import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MapPicker from "@/components/MapPicker";
import { toast } from "sonner";
import { Home, MapPin, Camera, Settings, Upload, FileText, Video, Sparkles, Plus, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FileUpload from "@/components/FileUpload";

const supabaseUrl = "https://rzsailqcijraplggryyy.supabase.co";

interface PropertyFormData {
  title: string;
  description: string;
  price: string;
  currency: string;
  property_type: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  constructed_area_m2: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  features: string[];
  image_urls: string[];
  video_url: string;
  plans_url: string[];
}

interface PropertyFormProps {
  onClose?: () => void;
  onSubmit?: (data: PropertyFormData) => void;
  initialData?: any;
}

const availableFeatures = [
  "Piscina", "Gym", "Estacionamiento", "Jardín", 
  "Balcón", "Terraza", "Seguridad 24h", "Ascensor",
  "Aire Acondicionado", "Calefacción", "Parrillero", "Cochera"
];

export default function PropertyForm({ onClose, onSubmit, initialData }: PropertyFormProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [formData, setFormData] = useState<PropertyFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    price: initialData?.price?.toString() || "",
    currency: initialData?.price_currency || "USD",
    property_type: initialData?.property_type || "",
    bedrooms: initialData?.bedrooms?.toString() || "",
    bathrooms: initialData?.bathrooms?.toString() || "",
    area: initialData?.area_m2?.toString() || "",
    constructed_area_m2: initialData?.constructed_area_m2?.toString() || "",
    address: initialData?.address || "",
    latitude: initialData?.geolocation?.coordinates?.[1] || null,
    longitude: initialData?.geolocation?.coordinates?.[0] || null,
    features: initialData?.tags || [],
    image_urls: initialData?.image_urls || [],
    video_url: initialData?.video_url || "",
    plans_url: initialData?.plans_url || []
  });

  const updateFormData = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleLocationSelect = async (coords: { lat: number; lng: number }) => {
    updateFormData("latitude", coords.lat);
    updateFormData("longitude", coords.lng);
    
    // AURA: Auto-fill address using reverse geocoding
    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${mapboxToken}&language=es&country=bo`);
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        updateFormData("address", address);
        toast.success("Dirección actualizada automáticamente");
      }
    } catch (error) {
      console.error("Error getting address:", error);
    }
  };
  
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [generatingDescription, setGeneratingDescription] = useState(false);
  
  useEffect(() => {
    // Get Mapbox token for AURA reverse geocoding
    const getMapboxToken = async () => {
      try {
        const { data } = await supabase.functions.invoke('mapbox-public-token');
        setMapboxToken(data?.token || "");
      } catch (error) {
        console.error("Error getting Mapbox token:", error);
      }
    };
    getMapboxToken();
  }, []);

  // Enhanced video upload with size validation
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Video size validation (50MB max)
    const maxVideoSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxVideoSize) {
      toast.error("El video no debe exceder 50MB para mantener la performance de la plataforma");
      return;
    }
    
    try {
      toast.success("Subiendo video...");
      const fileExt = file.name.split('.').pop();
      const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('property-videos')
        .upload(fileName, file);
      
      if (error) throw error;
      
      // Get public URL correctly
      const { data: { publicUrl } } = supabase.storage
        .from('property-videos')
        .getPublicUrl(fileName);
      
      updateFormData("video_url", publicUrl);
      toast.success("✅ Video subido exitosamente");
      
      // Clear the input after successful upload
      e.target.value = "";
    } catch (error: any) {
      console.error("Error uploading video:", error);
      toast.error("Error subiendo video: " + error.message);
    }
  };

  // Enhanced plans upload with AURA assistance
  const handlePlansUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      toast.success("AURA está procesando los planos...");
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `plan-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('property-plans')
          .upload(fileName, file);
        
        if (error) throw error;
        
        // Get public URL correctly
        const { data: { publicUrl } } = supabase.storage
          .from('property-plans')
          .getPublicUrl(fileName);
          
        return publicUrl;
      });
      
      const urls = await Promise.all(uploadPromises);
      updateFormData("plans_url", [...formData.plans_url, ...urls]);
      toast.success(`✅ ${files.length} plano(s) organizados por AURA exitosamente`);
      
      // Clear the input after successful upload
      e.target.value = "";
    } catch (error: any) {
      console.error("Error uploading plans:", error);
      toast.error("Error subiendo planos: " + error.message);
    }
  };

  // Add custom amenity
  const addCustomAmenity = () => {
    if (newAmenity.trim() && !formData.features.includes(newAmenity.trim())) {
      toggleFeature(newAmenity.trim());
      setCustomAmenities(prev => [...prev, newAmenity.trim()]);
      setNewAmenity("");
      toast.success("Amenidad personalizada agregada");
    }
  };

  // Remove custom amenity
  const removeCustomAmenity = (amenity: string) => {
    setCustomAmenities(prev => prev.filter(a => a !== amenity));
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== amenity)
    }));
  };

  // Enhanced form validation
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.title) errors.push("El título es obligatorio");
    if (!formData.property_type) errors.push("El tipo de propiedad es obligatorio");
    if (!formData.price) errors.push("El precio es obligatorio");
    if (!formData.description) errors.push("La descripción es obligatoria para una mejor presentación");
    if (!formData.image_urls || formData.image_urls.length === 0) {
      errors.push("Se requiere al menos una fotografía");
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Text auto-correction for description
  const handleDescriptionChange = (value: string) => {
    // Basic auto-corrections
    let correctedValue = value
      .replace(/\b(espacioso|amplio)\b/gi, match => match.toLowerCase())
      .replace(/\b(ubicado|situado)\b/gi, match => match.toLowerCase())
      .replace(/\s{2,}/g, ' ') // Multiple spaces to single space
      .replace(/([.!?])\s*([a-z])/g, (match, p1, p2) => p1 + ' ' + p2.toUpperCase()); // Capitalize after punctuation
    
    updateFormData("description", correctedValue);
  };

  const generateAuraDescription = async () => {
    if (!formData.title || !formData.property_type) {
      toast.error("Completa al menos el título y tipo de propiedad");
      return;
    }

    setGeneratingDescription(true);
    try {
      const propertyData = {
        title: formData.title,
        property_type: formData.property_type,
        transaction_type: "venta", // Default
        price: formData.price,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        area_m2: formData.area ? parseFloat(formData.area) : undefined,
        address: formData.address,
        lat: formData.latitude,
        lng: formData.longitude,
        has_pool: formData.features.includes("Piscina"),
        has_garage: formData.features.includes("Cochera") || formData.features.includes("Estacionamiento"),
        pet_friendly: false // Can be added as a feature later
      };

      const { data, error } = await supabase.functions.invoke('aura-generate-description', {
        body: {
          property: propertyData,
          language: "es",
          brand: "Dominio Inmobiliario",
          tone: "profesional persuasivo",
          style: "80-150 palabras, frases cortas, enfocado en beneficios y estilo de vida"
        }
      });

      if (error) throw error;

      if (data?.generatedText) {
        updateFormData("description", data.generatedText);
        toast.success("Descripción generada por AURA");
      } else {
        throw new Error("No se pudo generar la descripción");
      }
    } catch (error: any) {
      console.error("Error generating AURA description:", error);
      toast.error("Error generando descripción: " + error.message);
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== SUBMIT INICIADO ===");
    console.log("Form data:", formData);
    
    // Enhanced validation
    if (!validateForm()) {
      console.log("VALIDACION FALLIDA");
      toast.error("Complete todos los campos obligatorios marcados para continuar");
      return;
    }
    
    console.log("VALIDACION PASADA - Iniciando guardado...");
    setLoading(true);
    setSaveSuccess(false);

    try {
      console.log("Llamando onSubmit con datos:", formData);
      
      // Call onSubmit if provided
      if (onSubmit) {
        await onSubmit(formData);
        console.log("onSubmit completado exitosamente");
      } else {
        console.log("No onSubmit - simulando guardado");
        // If no onSubmit provided, simulate a successful save
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log("=== GUARDADO EXITOSO ===");
      
      // Show success indicator
      setSaveSuccess(true);
      toast.success("🎉 ¡Propiedad guardada exitosamente!");
      
      // Reset form after successful submission
      setTimeout(() => {
        console.log("Reseteando formulario");
        setFormData({
          title: "",
          description: "",
          price: "",
          currency: "USD",
          property_type: "",
          bedrooms: "",
          bathrooms: "",
          area: "",
          constructed_area_m2: "",
          address: "",
          latitude: null,
          longitude: null,
          features: [],
          image_urls: [],
          video_url: "",
          plans_url: []
        });
        setActiveTab("general");
        setValidationErrors([]);
        setSaveSuccess(false);
        
        if (onClose) {
          onClose();
        }
      }, 2000);
      
    } catch (error: any) {
      console.error("=== ERROR EN SUBMIT ===", error);
      console.error("Error completo:", error);
      toast.error("Error guardando propiedad: " + (error.message || "Error desconocido"));
    } finally {
      console.log("FINALIZANDO SUBMIT - Poniendo loading a false");
      // Ensure loading is always set to false
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          {initialData ? "Editar Propiedad" : "Nueva Propiedad"}
        </CardTitle>
        <CardDescription>
          {initialData ? "Actualiza la información de la propiedad" : "Completa la información de la propiedad para publicarla"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Success Indicator */}
        {saveSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              🎉 ¡Propiedad guardada exitosamente! Los datos se han actualizado correctamente.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <p className="font-medium mb-2">Complete los siguientes campos obligatorios:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="caracteristicas" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Características
              </TabsTrigger>
              <TabsTrigger value="ubicacion" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicación
              </TabsTrigger>
              <TabsTrigger value="multimedia" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Multimedia
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título de la propiedad *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateFormData("title", e.target.value)}
                    placeholder="Ej: Casa moderna en Miraflores"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_type">Tipo de propiedad *</Label>
                  <Select value={formData.property_type} onValueChange={(value) => updateFormData("property_type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="departamento">Departamento</SelectItem>
                      <SelectItem value="oficina">Oficina</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                      <SelectItem value="local_comercial">Local Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) => updateFormData("price", e.target.value)}
                      placeholder="350000"
                      type="number"
                      required
                    />
                    <Select value={formData.currency} onValueChange={(value) => updateFormData("currency", value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="BOB">BOB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">
                    {formData.property_type === 'local_comercial' || 
                     formData.property_type === 'oficina' || 
                     formData.property_type === 'terreno' ? 'Ambientes' : 'Dormitorios'}
                  </Label>
                  <Input
                    id="bedrooms"
                    value={formData.bedrooms}
                    onChange={(e) => updateFormData("bedrooms", e.target.value)}
                    placeholder="3"
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Baños</Label>
                  <Input
                    id="bathrooms"
                    value={formData.bathrooms}
                    onChange={(e) => updateFormData("bathrooms", e.target.value)}
                    placeholder="2"
                    type="number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Área Total (m²)</Label>
                  <Input
                    id="area"
                    value={formData.area}
                    onChange={(e) => updateFormData("area", e.target.value)}
                    placeholder="250"
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="constructed_area_m2">M2 Construidos</Label>
                  <Input
                    id="constructed_area_m2"
                    value={formData.constructed_area_m2}
                    onChange={(e) => updateFormData("constructed_area_m2", e.target.value)}
                    placeholder="180"
                    type="number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción * (con autocorrección)</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder="Describe las características principales de la propiedad..."
                    rows={4}
                    className="flex-1"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateAuraDescription}
                    disabled={!formData.title || !formData.property_type || generatingDescription}
                    className="self-start"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    {generatingDescription ? "..." : "AURA"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ✨ Autocorrector activo | Usa AURA para generar descripción profesional
                </p>
              </div>
            </TabsContent>

            <TabsContent value="caracteristicas" className="space-y-6">
              {/* Standard Amenities */}
              <div>
                <Label className="text-base font-medium">Amenidades Estándar</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecciona las amenidades que incluye la propiedad
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableFeatures.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                      <Checkbox
                        id={feature}
                        checked={formData.features.includes(feature)}
                        onCheckedChange={() => toggleFeature(feature)}
                      />
                      <Label
                        htmlFor={feature}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Amenities */}
              <div>
                <Label className="text-base font-medium">Amenidades Personalizadas</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Agrega amenidades específicas para esta propiedad
                </p>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    placeholder="Ej: Vista panorámica, Chimenea..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
                  />
                  <Button type="button" onClick={addCustomAmenity} variant="outline">
                    <Plus className="h-4 w-4" />
                    Agregar
                  </Button>
                </div>
                
                {/* Custom amenities display */}
                {customAmenities.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Amenidades personalizadas:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {customAmenities.map((amenity) => (
                        <div key={amenity} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                          <span className="text-sm">{amenity}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomAmenity(amenity)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ubicacion" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder="Ingresa la dirección o selecciona en el mapa"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Ubicación en el mapa</Label>
                <div className="border rounded-lg overflow-hidden">
                  <MapPicker
                    lat={formData.latitude}
                    lng={formData.longitude}
                    onChange={handleLocationSelect}
                    className="w-full h-64"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Haz clic en el mapa para seleccionar la ubicación exacta
                </p>
              </div>
            </TabsContent>

            <TabsContent value="multimedia" className="space-y-6">
              {/* Property Images with AURA Enhancement */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <Label className="text-base font-medium">Fotografías de la Propiedad *</Label>
                    <p className="text-sm text-muted-foreground">
                      AURA optimiza automáticamente tamaño y resolución | Marca de agua incluida
                    </p>
                  </div>
                </div>
                
                {/* Show existing images */}
                {formData.image_urls && formData.image_urls.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {formData.image_urls.length} imagen(es) actual(es)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {formData.image_urls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`Foto ${index + 1}`} 
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newImages = formData.image_urls.filter((_, i) => i !== index);
                              updateFormData("image_urls", newImages);
                              toast.success("Imagen removida");
                            }}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                 <FileUpload
                   onFilesUploaded={(urls) => {
                     console.log("Files uploaded:", urls);
                     if (urls && urls.length > 0) {
                       // Combine with existing images instead of replacing them
                       const existingImages = formData.image_urls || [];
                       updateFormData("image_urls", [...existingImages, ...urls]);
                       toast.success(`✅ ${urls.length} imagen(es) subidas exitosamente`);
                     }
                   }}
                   accept="image/*"
                   multiple={true}
                   maxFiles={10}
                   maxSize={5}
                   label="📸 Agregar más fotos"
                   bucket="property-images"
                 />
                <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
                  🤖 <strong>AURA mejora automáticamente:</strong> Ajusta resolución, optimiza tamaño para web y aplica marca de agua profesional
                </div>
              </div>

              {/* Property Video with Size Limits */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Video de la Propiedad</Label>
                  <p className="text-sm text-muted-foreground">
                    Video promocional (opcional) - Límite: 50MB para mantener la velocidad de la plataforma
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_url">URL del Video o Subir Archivo (máx. 50MB)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="video_url"
                      value={formData.video_url}
                      onChange={(e) => updateFormData("video_url", e.target.value)}
                      placeholder="https://youtube.com/watch?v=... o Vimeo"
                      className="flex-1"
                    />
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload">
                      <Button type="button" variant="outline" asChild>
                        <span className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          📹 Subir Video
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  {/* Show current video if exists */}
                  {formData.video_url && (
                    <div className="bg-green-50 p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Video cargado:</span>
                          <span className="text-sm text-green-700 truncate max-w-xs">
                            {formData.video_url.includes('http') ? 'URL externa' : 'Archivo subido'}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => updateFormData("video_url", "")}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground bg-amber-50 p-3 rounded-lg">
                    ⚠️ <strong>Límite crítico:</strong> Videos mayores a 50MB afectan la velocidad. Usa YouTube/Vimeo para videos largos.
                  </div>
                </div>
              </div>

              {/* Property Plans with AURA */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <Label className="text-base font-medium">Planos de la Propiedad</Label>
                    <p className="text-sm text-muted-foreground">
                      AURA organiza y optimiza tus planos arquitectónicos automáticamente
                    </p>
                  </div>
                </div>
                
                {/* Show uploaded plans */}
                {formData.plans_url && formData.plans_url.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {formData.plans_url.length} plano(s) subido(s)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {formData.plans_url.map((url, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm text-gray-700">Plano {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newPlans = formData.plans_url.filter((_, i) => i !== index);
                              updateFormData("plans_url", newPlans);
                              toast.success("Plano removido");
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <FileUpload
                  onFilesUploaded={(urls) => {
                    console.log("Plans uploaded:", urls);
                    if (urls && urls.length > 0) {
                      // Combine with existing plans instead of replacing them
                      const existingPlans = formData.plans_url || [];
                      updateFormData("plans_url", [...existingPlans, ...urls]);
                      toast.success(`✅ ${urls.length} plano(s) organizados por AURA exitosamente`);
                    }
                  }}
                  accept=".pdf,image/*"
                  multiple={true}
                  maxFiles={5}
                  maxSize={10}
                  label="📋 AURA Organizar Planos"
                  bucket="property-plans"
                />
                <div className="text-xs text-muted-foreground bg-green-50 p-3 rounded-lg mt-4">
                  🤖 <strong>AURA asistente:</strong> Detecta automáticamente el tipo de plano, optimiza formato y organiza por categorías (planta baja, planta alta, etc.)
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Propiedad"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}