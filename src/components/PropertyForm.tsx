import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import MapPicker from "@/components/MapPicker";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Upload, X, Check, AlertTriangle } from "lucide-react";
import { boliviaDepartments } from "@/data/bolivia-locations";
import { Progress } from "@/components/ui/progress";

interface Property {
  id?: string;
  title: string;
  address: string;
  price?: number | null;
  price_currency: string;
  description?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_m2?: number | null;
  video_url?: string | null;
  image_urls?: string[] | null;
  plans_url?: string[] | null;
  geolocation?: string | null;
  agent_id?: string | null;
}

interface Amenity {
  id: string;
  name: string;
}

interface Location {
  lat: number;
  lng: number;
}

interface FileUploadState {
  file: File | null;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

interface PropertyFormProps {
  property?: any;
  onPropertySaved?: (property: any) => void;
  onClose?: () => void;
  onSubmit?: (propertyData: any) => Promise<void>;
  initialData?: any;
}

export default function PropertyForm({ property, onPropertySaved, onClose, onSubmit, initialData }: PropertyFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Property>({
    title: property?.title || "",
    address: property?.address || "",
    price: property?.price || null,
    price_currency: property?.price_currency || "USD",
    description: property?.description || null,
    bedrooms: property?.bedrooms || null,
    bathrooms: property?.bathrooms || null,
    area_m2: property?.area_m2 || null,
    video_url: property?.video_url || null,
    image_urls: property?.image_urls || [],
    plans_url: property?.plans_url || [],
    geolocation: property?.geolocation || null,
    agent_id: property?.agent_id || null,
  });
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchAmenities = async () => {
      const { data, error } = await supabase.from("amenities").select("*");
      if (error) {
        console.error("Error fetching amenities:", error);
      } else {
        setAmenities(data || []);
      }
    };

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchAmenities();
    fetchUser();
  }, []);

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || "",
        address: property.address || "",
        price: property.price || null,
        price_currency: property.price_currency || "USD",
        description: property.description || null,
        bedrooms: property.bedrooms || null,
        bathrooms: property.bathrooms || null,
        area_m2: property.area_m2 || null,
        video_url: property.video_url || null,
        image_urls: property.image_urls || [],
        plans_url: property.plans_url || [],
        geolocation: property.geolocation || null,
        agent_id: property.agent_id || null,
      });

      // Parse geolocation string to Location object
      if (property.geolocation) {
        const coordinates = property.geolocation.replace(/[POINT()]/g, '').split(' ');
        setSelectedLocation({
          lng: parseFloat(coordinates[0]),
          lat: parseFloat(coordinates[1])
        });
      }

      // Load selected amenities
      const loadSelectedAmenities = async () => {
        const { data, error } = await supabase
          .from("property_amenities")
          .select("amenity_id")
          .eq("property_id", property.id);

        if (error) {
          console.error("Error fetching selected amenities:", error);
        } else {
          const amenityIds = data?.map((item: any) => item.amenity_id) || [];
          setSelectedAmenities(amenityIds);
        }
      };

      loadSelectedAmenities();
    }
  }, [property]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (amenityId: string) => {
    setSelectedAmenities(prev => {
      if (prev.includes(amenityId)) {
        return prev.filter(id => id !== amenityId);
      } else {
        return [...prev, amenityId];
      }
    });
  };

  const [imageUploads, setImageUploads] = useState<FileUploadState[]>([]);
  const [planUploads, setPlanUploads] = useState<FileUploadState[]>([
    { file: null, progress: 0, status: 'idle' },
    { file: null, progress: 0, status: 'idle' },
    { file: null, progress: 0, status: 'idle' }
  ]);

  // BULLETPROOF FILE UPLOAD - NO MORE HANGING AT PERCENTAGES
  const uploadFileRobust = async (file: File, bucket: string, path: string): Promise<string> => {
    console.log(`🚀 INICIO UPLOAD ROBUSTO: ${file.name} a ${bucket}/${path}`);
    
    try {
      // Upload directo sin simulación de progreso
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error(`❌ ERROR UPLOAD ${file.name}:`, error);
        throw error;
      }

      console.log(`✅ UPLOAD EXITOSO: ${file.name}`);
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      
      console.log(`📦 URL GENERADA: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error(`💥 FALLO TOTAL EN UPLOAD DE ${file.name}:`, error);
      throw error;
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newUploads: FileUploadState[] = Array.from(files).map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setImageUploads(prev => [...prev, ...newUploads]);

    // Process each file
    for (let i = 0; i < newUploads.length; i++) {
      const upload = newUploads[i];
      const globalIndex = imageUploads.length + i;

      try {
        console.log(`📸 PROCESANDO IMAGEN ${i + 1}/${newUploads.length}: ${upload.file!.name}`);

        // Update progress to show processing
        setImageUploads(prev => prev.map((item, idx) => 
          idx === globalIndex ? { ...item, progress: 50 } : item
        ));

        const fileName = `property-${Date.now()}-${i}.${upload.file!.name.split('.').pop()}`;
        const url = await uploadFileRobust(upload.file!, 'property-images', fileName);

        // Success - immediate 100%
        setImageUploads(prev => prev.map((item, idx) => 
          idx === globalIndex ? { 
            ...item, 
            progress: 100, 
            status: 'success' as const, 
            url 
          } : item
        ));

        console.log(`✅ IMAGEN ${i + 1} COMPLETADA`);

      } catch (error) {
        console.error(`❌ ERROR EN IMAGEN ${i + 1}:`, error);
        
        setImageUploads(prev => prev.map((item, idx) => 
          idx === globalIndex ? { 
            ...item, 
            progress: 0, 
            status: 'error' as const, 
            error: 'Error en la subida' 
          } : item
        ));

        toast.error(`Error subiendo imagen ${i + 1}. La propiedad se guardará sin esta imagen.`);
      }
    }
  };

  const handlePlanUpload = async (file: File, slotIndex: number) => {
    console.log(`📄 INICIO SUBIDA PLAN ${slotIndex + 1}: ${file.name}`);

    // Update state immediately
    setPlanUploads(prev => prev.map((item, idx) => 
      idx === slotIndex ? { 
        file, 
        progress: 25, 
        status: 'uploading' as const 
      } : item
    ));

    try {
      const fileName = `plan-${Date.now()}-slot${slotIndex}.${file.name.split('.').pop()}`;
      
      // Progress update
      setPlanUploads(prev => prev.map((item, idx) => 
        idx === slotIndex ? { ...item, progress: 75 } : item
      ));

      const url = await uploadFileRobust(file, 'property-plans', fileName);

      // Success
      setPlanUploads(prev => prev.map((item, idx) => 
        idx === slotIndex ? { 
          ...item, 
          progress: 100, 
          status: 'success' as const, 
          url 
        } : item
      ));

      console.log(`✅ PLAN ${slotIndex + 1} COMPLETADO`);
      toast.success(`Plano ${slotIndex + 1} subido exitosamente`);

    } catch (error) {
      console.error(`❌ ERROR PLAN ${slotIndex + 1}:`, error);
      
      setPlanUploads(prev => prev.map((item, idx) => 
        idx === slotIndex ? { 
          ...item, 
          progress: 0, 
          status: 'error' as const, 
          error: 'Error en la subida' 
        } : item
      ));

      toast.error(`Error subiendo plano ${slotIndex + 1}. La propiedad se guardará sin este archivo.`);
    }
  };

  const removePlanUpload = (slotIndex: number) => {
    console.log(`🗑️ ELIMINANDO PLAN ${slotIndex + 1}`);
    setPlanUploads(prev => prev.map((item, idx) => 
      idx === slotIndex ? { 
        file: null, 
        progress: 0, 
        status: 'idle' as const, 
        url: undefined, 
        error: undefined 
      } : item
    ));
  };

  const removeImageUpload = (index: number) => {
    console.log(`🗑️ ELIMINANDO IMAGEN ${index + 1}`);
    setImageUploads(prev => prev.filter((_, idx) => idx !== index));
  };

  // GUARDAR PROPIEDAD - SIEMPRE FUNCIONA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.address || !formData.price) {
      toast.error("Por favor completa los campos obligatorios: título, dirección y precio");
      return;
    }

    setLoading(true);
    console.log("🏠 INICIANDO GUARDADO DE PROPIEDAD - MODO ROBUSTO");

    try {
      // Collect successful image URLs only
      const successfulImageUrls = imageUploads
        .filter(upload => upload.status === 'success' && upload.url)
        .map(upload => upload.url!);

      // Collect successful plan URLs only
      const successfulPlanUrls = planUploads
        .filter(upload => upload.status === 'success' && upload.url)
        .map(upload => upload.url!);

      console.log(`📊 RESUMEN UPLOADS:`);
      console.log(`- Imágenes exitosas: ${successfulImageUrls.length}`);
      console.log(`- Planos exitosos: ${successfulPlanUrls.length}`);

      // Prepare property data
      const propertyData = {
        title: formData.title,
        address: formData.address,
        price: formData.price ? (typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price) : null,
        price_currency: formData.price_currency,
        description: formData.description || null,
        bedrooms: formData.bedrooms ? (typeof formData.bedrooms === 'string' ? parseInt(formData.bedrooms) : formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? (typeof formData.bathrooms === 'string' ? parseInt(formData.bathrooms) : formData.bathrooms) : null,
        area_m2: formData.area_m2 ? (typeof formData.area_m2 === 'string' ? parseFloat(formData.area_m2) : formData.area_m2) : null,
        video_url: formData.video_url || null,
        image_urls: successfulImageUrls.length > 0 ? successfulImageUrls : null,
        plans_url: successfulPlanUrls.length > 0 ? successfulPlanUrls : null,
        geolocation: selectedLocation ? `POINT(${selectedLocation.lng} ${selectedLocation.lat})` : null,
        agent_id: user?.id
      };

      console.log("💾 DATOS A GUARDAR:", propertyData);

      let result;
      if (property) {
        // Update existing property
        result = await supabase
          .from("properties")
          .update(propertyData)
          .eq("id", property.id)
          .select()
          .single();
      } else {
        // Create new property
        result = await supabase
          .from("properties")
          .insert(propertyData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      console.log("✅ PROPIEDAD GUARDADA EXITOSAMENTE:", result.data);

      // Handle amenities if any selected
      if (selectedAmenities.length > 0) {
        console.log("🏷️ GUARDANDO AMENIDADES...");
        
        if (property) {
          // Delete existing amenities
          await supabase
            .from("property_amenities")
            .delete()
            .eq("property_id", property.id);
        }

        // Insert new amenities
        const amenityInserts = selectedAmenities.map(amenityId => ({
          property_id: result.data.id,
          amenity_id: amenityId
        }));

        const { error: amenitiesError } = await supabase
          .from("property_amenities")
          .insert(amenityInserts);

        if (amenitiesError) {
          console.error("❌ Error guardando amenidades:", amenitiesError);
          toast.error("Error guardando amenidades, pero la propiedad se guardó correctamente");
        } else {
          console.log("✅ AMENIDADES GUARDADAS");
        }
      }

      // Success notification
      const failedImages = imageUploads.filter(u => u.status === 'error').length;
      const failedPlans = planUploads.filter(u => u.status === 'error').length;

      let successMessage = `✅ Propiedad ${property ? 'actualizada' : 'creada'} exitosamente`;
      
      if (failedImages > 0 || failedPlans > 0) {
        successMessage += ` (${failedImages} imágenes y ${failedPlans} planos fallaron)`;
      }

      toast.success(successMessage);

      // Callback and navigation
      if (onPropertySaved) {
        onPropertySaved(result.data);
      } else {
        navigate("/dashboard/agent");
      }

    } catch (error: any) {
      console.error("💥 ERROR CRÍTICO GUARDANDO PROPIEDAD:", error);
      toast.error("Error guardando propiedad: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            {property ? "Editar Propiedad" : "Nueva Propiedad"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="col-span-1 md:col-span-2">
                <Label htmlFor="title">Título de la Propiedad</Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ej: Hermosa casa en el centro"
                  required
                />
              </div>

              {/* Address */}
              <div className="col-span-1 md:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Ej: Calle Principal #123"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <Label htmlFor="price">Precio</Label>
                <Input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price || ""}
                  onChange={handlePriceChange}
                  placeholder="Ej: 150000"
                  required
                />
              </div>

              {/* Price Currency */}
              <div>
                <Label htmlFor="price_currency">Moneda</Label>
                <Select onValueChange={(value) => handleSelectChange("price_currency", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona" defaultValue={formData.price_currency || "USD"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="BOB">BOB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bedrooms */}
              <div>
                <Label htmlFor="bedrooms">Habitaciones</Label>
                <Input
                  type="number"
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms || ""}
                  onChange={handleInputChange}
                  placeholder="Ej: 3"
                />
              </div>

              {/* Bathrooms */}
              <div>
                <Label htmlFor="bathrooms">Baños</Label>
                <Input
                  type="number"
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms || ""}
                  onChange={handleInputChange}
                  placeholder="Ej: 2"
                />
              </div>

              {/* Area */}
              <div>
                <Label htmlFor="area">Área (m²)</Label>
                <Input
                  type="number"
                  id="area"
                  name="area_m2"
                  value={formData.area_m2 || ""}
                  onChange={handleInputChange}
                  placeholder="Ej: 120"
                />
              </div>

              {/* Video URL */}
              <div>
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  type="url"
                  id="videoUrl"
                  name="video_url"
                  value={formData.video_url || ""}
                  onChange={handleInputChange}
                  placeholder="Ej: https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            {/* Description */}
            <div className="col-span-1 md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                placeholder="Ej: Casa con excelente ubicación..."
              />
            </div>

            {/* Images Upload Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Imágenes de la Propiedad</Label>
              <div className="grid grid-cols-1 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label htmlFor="images-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" asChild>
                          <span>Seleccionar Imágenes</span>
                        </Button>
                      </Label>
                      <Input
                        id="images-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e.target.files)}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      JPG, PNG, WebP hasta 10MB cada una
                    </p>
                  </div>
                </div>

                {/* Image Upload Progress */}
                {imageUploads.length > 0 && (
                  <div className="space-y-3">
                    {imageUploads.map((upload, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {upload.file?.name || `Imagen ${index + 1}`}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeImageUpload(index)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {upload.status === 'uploading' && (
                            <div className="space-y-1">
                              <Progress value={upload.progress} className="h-2" />
                              <p className="text-xs text-gray-500">{upload.progress}% completado</p>
                            </div>
                          )}
                          {upload.status === 'success' && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Check className="h-4 w-4" />
                              <span className="text-xs">Subida exitosa</span>
                            </div>
                          )}
                          {upload.status === 'error' && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs">{upload.error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Plans Upload Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Planos de la Propiedad</Label>
              <p className="text-sm text-gray-600">
                Sube hasta 3 archivos: planos (PDF) o imágenes (JPG/PNG) - Máximo 10MB cada uno
              </p>
              
              <div className="space-y-4">
                {planUploads.map((upload, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Archivo {index + 1}</h4>
                      {upload.file && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePlanUpload(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    {!upload.file && upload.status === 'idle' && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <div className="mt-2">
                            <Label htmlFor={`plan-upload-${index}`} className="cursor-pointer">
                              <Button type="button" variant="outline" size="sm" asChild>
                                <span>Subir archivo</span>
                              </Button>
                            </Label>
                            <Input
                              id={`plan-upload-${index}`}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePlanUpload(file, index);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {upload.file && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{upload.file.name}</span>
                          {upload.status === 'success' && (
                            <Badge variant="secondary" className="text-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Subido
                            </Badge>
                          )}
                          {upload.status === 'error' && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          )}
                        </div>

                        {upload.status === 'uploading' && (
                          <div className="space-y-2">
                            <Progress value={upload.progress} className="h-2" />
                            <p className="text-xs text-blue-600">
                              📤 Subiendo archivo {index + 1}... {upload.progress}% completado
                            </p>
                          </div>
                        )}

                        {upload.status === 'error' && (
                          <p className="text-xs text-red-600">{upload.error}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Checkbox id="independent-files" className="mt-1" />
                  <Label htmlFor="independent-files" className="text-sm text-blue-800">
                    Hasta 3 archivos independientes: Cada archivo sube por separado con su propia barra de progreso. 
                    Si hay error, aparecerá mensaje específico para ese archivo.
                  </Label>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Amenidades</Label>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {amenities.map(amenity => (
                  <div key={amenity.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`amenity-${amenity.id}`}
                      value={amenity.id}
                      checked={selectedAmenities.includes(amenity.id)}
                      onCheckedChange={() => handleCheckboxChange(amenity.id)}
                    />
                    <Label htmlFor={`amenity-${amenity.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {amenity.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Picker */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Ubicación</Label>
               <MapPicker
                lat={selectedLocation?.lat}
                lng={selectedLocation?.lng}
                onChange={(coords) => {
                  setSelectedLocation(coords);
                }}
              />
              {selectedLocation && (
                <Badge variant="outline">
                  Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                </Badge>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => navigate("/dashboard/agent")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="min-w-[200px]">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {property ? "Actualizando..." : "Guardando..."}
                  </>
                ) : (
                  <>
                    ✅ {property ? "Actualizar" : "Guardar"} Propiedad
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
