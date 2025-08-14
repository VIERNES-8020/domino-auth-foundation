import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import MapPicker from "@/components/MapPicker"; // Fixed import
import { toast } from "sonner";
import { Home, MapPin, Camera, Settings, Upload, FileText, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FileUpload from "@/components/FileUpload";

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
    setLoading(true);

    try {
      // Basic validation
      if (!formData.title || !formData.price || !formData.property_type) {
        toast.error("Por favor completa los campos obligatorios");
        return;
      }

      // Call onSubmit if provided
      if (onSubmit) {
        await onSubmit(formData);
      }
      
      toast.success("Propiedad guardada exitosamente");
      
      // Reset form and return to general tab
      setActiveTab("general");
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
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      toast.error("Error guardando propiedad: " + error.message);
    } finally {
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
                  <Label htmlFor="bedrooms">Dormitorios</Label>
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
                <Label htmlFor="description">Descripción</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Describe las características principales de la propiedad..."
                    rows={4}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateAuraDescription}
                    disabled={!formData.title || !formData.property_type}
                    className="self-start"
                  >
                    ✨ AURA
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Usa AURA para generar una descripción profesional automáticamente
                </p>
              </div>
            </TabsContent>

            <TabsContent value="caracteristicas" className="space-y-6">
              <div>
                <Label className="text-base font-medium">Amenidades y Características</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecciona las amenidades que incluye la propiedad
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableFeatures.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
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
              {/* Property Images */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Fotografías de la Propiedad</Label>
                  <p className="text-sm text-muted-foreground">
                    Sube hasta 10 imágenes de la propiedad (se aplicará marca de agua automáticamente)
                  </p>
                </div>
                <FileUpload
                  onFilesUploaded={(urls) => updateFormData("image_urls", urls)}
                  accept="image/*"
                  multiple={true}
                  maxFiles={10}
                  maxSize={5}
                  label="Seleccionar fotos"
                  bucket="property-images"
                />
              </div>

              {/* Property Video */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Video de la Propiedad</Label>
                  <p className="text-sm text-muted-foreground">
                    Sube un video promocional de la propiedad (opcional)
                  </p>
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="video_url">URL del Video o Subir Archivo</Label>
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
                            Subir Video
                          </span>
                        </Button>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Puedes pegar una URL de YouTube/Vimeo O subir un archivo de video directamente
                    </p>
                  </div>
              </div>

              {/* Property Plans */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Planos de la Propiedad</Label>
                  <p className="text-sm text-muted-foreground">
                    Sube los planos arquitectónicos en PDF o imagen
                  </p>
                </div>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Selecciona archivos PDF o imágenes de los planos
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,image/*"
                      onChange={handlePlansUpload}
                      className="hidden"
                      id="property-plans"
                    />
                    <label htmlFor="property-plans">
                      <Button type="button" variant="outline" asChild>
                        <span className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Seleccionar planos
                        </span>
                      </Button>
                    </label>
                  </div>
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