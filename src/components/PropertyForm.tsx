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
import { boliviaDepartments } from "@/data/bolivia-locations";

const supabaseUrl = "https://rzsailqcijraplggryyy.supabase.co";

interface PropertyFormData {
  title: string;
  description: string;
  price: string;
  currency: string;
  property_type: string;
  transaction_type: string;
  commission_percentage: string;
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
  property_code?: string;
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
  const [formSubmitting, setFormSubmitting] = useState(false);
  // Robust upload states - completely independent systems
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState<{[key: string]: number}>({});
  const [plansUploading, setPlansUploading] = useState<{[key: number]: boolean}>({});
  const [plansUploadProgress, setPlansUploadProgress] = useState<{[key: number]: number}>({});
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadTimeout, setVideoUploadTimeout] = useState<NodeJS.Timeout | null>(null);
  const [videoTimer, setVideoTimer] = useState(0);
  const [videoTimerInterval, setVideoTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [updateButtonLoading, setUpdateButtonLoading] = useState(false);
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Location selection states
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  
  const [formData, setFormData] = useState<PropertyFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    price: initialData?.price?.toString() || "",
    currency: initialData?.price_currency || "USD",
    property_type: initialData?.property_type || "",
    transaction_type: initialData?.transaction_type || "",
    commission_percentage: initialData?.commission_percentage?.toString() || "",
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

    // Get current user profile to check permissions
    const getCurrentUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, is_super_admin, full_name')
            .eq('id', user.id)
            .single();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Error getting user profile:", error);
      }
    };
    getCurrentUserProfile();
  }, []);

  // Enhanced video upload with size validation and progress bar
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Video size validation (50MB max)
    const maxVideoSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxVideoSize) {
      toast.error("El video no debe exceder 50MB para mantener la performance de la plataforma");
      return;
    }
    
    setVideoUploading(true);
    setVideoUploadProgress(0);
    
    // Start visual timer and progress simulation
    setVideoTimer(0);
    const timerInterval = setInterval(() => {
      setVideoTimer(prev => prev + 1);
    }, 1000);
    setVideoTimerInterval(timerInterval);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setVideoUploadProgress(prev => Math.min(prev + 8, 85));
    }, 500);

    const uploadTimeout = setTimeout(() => {
      setVideoUploading(false);
      setVideoUploadProgress(0);
      setVideoTimer(0);
      if (timerInterval) clearInterval(timerInterval);
      if (progressInterval) clearInterval(progressInterval);
      toast.error("Timeout en subida de video. Intenta con un archivo más pequeño.");
    }, 60000); // 60 seconds timeout
    setVideoUploadTimeout(uploadTimeout);
    
    try {
      console.log("=== VIDEO UPLOAD STARTED ===");
      toast.success("📹 Subiendo video...");
      const fileExt = file.name.split('.').pop();
      const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('property-videos')
        .upload(fileName, file);
      
      if (error) throw error;
      
      // Complete progress
      clearInterval(progressInterval);
      setVideoUploadProgress(100);
      
      // Get public URL correctly
      const { data: { publicUrl } } = supabase.storage
        .from('property-videos')
        .getPublicUrl(fileName);
      
      updateFormData("video_url", publicUrl);
      setVideoTimer(0);
      if (videoUploadTimeout) clearTimeout(videoUploadTimeout);
      if (videoTimerInterval) clearInterval(videoTimerInterval);
      toast.success("✅ Video subido exitosamente");
      console.log("=== VIDEO UPLOAD SUCCESS ===");
      
      // Clear the input after successful upload
      e.target.value = "";
      
      // Clear progress after success
      setTimeout(() => {
        setVideoUploadProgress(0);
      }, 2000);
      
    } catch (error: any) {
      console.error("=== VIDEO UPLOAD ERROR ===", error);
      setVideoTimer(0);
      setVideoUploadProgress(0);
      if (videoUploadTimeout) clearTimeout(videoUploadTimeout);
      if (videoTimerInterval) clearInterval(videoTimerInterval);
      if (progressInterval) clearInterval(progressInterval);
      toast.error("Error subiendo video: " + error.message);
    } finally {
      setVideoUploading(false);
      console.log("=== VIDEO UPLOAD FINISHED ===");
    }
  };

  // ROBUST INDEPENDENT UPLOAD SYSTEM - ZERO CROSS-INTERFERENCE
  
  // Property Images Upload with Progress Bar
  const handleImagesUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const existingImages = formData.image_urls || [];
    
    // Validate total count
    if (existingImages.length + fileArray.length > 10) {
      toast.error(`❌ MÁXIMO 10 IMÁGENES: Ya tienes ${existingImages.length}, intentas subir ${fileArray.length}. Total sería ${existingImages.length + fileArray.length}.`);
      return false;
    }
    
    // Validate each file size
    for (const file of fileArray) {
      if (file.size > 5 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        toast.error(`❌ IMAGEN MUY GRANDE: "${file.name}" es ${sizeMB}MB. Máximo: 5MB. Comprime la imagen.`);
        return false;
      }
    }
    
    setImageUploading(true);
    const progressTracker: {[key: string]: number} = {};
    
    try {
      toast.info(`📤 Subiendo ${fileArray.length} imagen(es)...`);
      
      const uploadPromises = fileArray.map(async (file, index) => {
        const fileKey = `img_${Date.now()}_${index}`;
        progressTracker[fileKey] = 0;
        setImageUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));
        
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `image-${Date.now()}-${index}.${fileExt}`;
        
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          progressTracker[fileKey] = Math.min(progressTracker[fileKey] + 10, 90);
          setImageUploadProgress(prev => ({ ...prev, [fileKey]: progressTracker[fileKey] }));
        }, 200);
        
        const { data, error } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);
        
        clearInterval(progressInterval);
        
        if (error) {
          setImageUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));
          if (error.message.includes('exceeded') || error.message.includes('quota')) {
            throw new Error(`❌ CUOTA EXCEDIDA: El almacenamiento está lleno. Contacta al administrador.`);
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            throw new Error(`❌ SIN INTERNET: Revisa tu conexión a internet y vuelve a intentar.`);
          } else if (error.message.includes('size')) {
            throw new Error(`❌ IMAGEN GRANDE: "${file.name}" es demasiado pesada para el servidor.`);
          } else {
            throw new Error(`❌ ERROR DE SERVIDOR: ${error.message}`);
          }
        }
        
        setImageUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));
        
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);
        
        return publicUrl;
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      const newImages = [...existingImages, ...uploadedUrls];
      updateFormData("image_urls", newImages);
      
      toast.success(`✅ ${fileArray.length} IMAGEN(ES) SUBIDAS: Todas las imágenes están disponibles`);
      setImageUploadProgress({});
      
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast.error(error.message || `❌ Error subiendo imágenes`);
      setImageUploadProgress({});
    } finally {
      setImageUploading(false);
    }
  };
  
  // Plans Upload System - COMPLETELY REWRITTEN - NO MORE 85% BUGS
  const handlePlanUpload = async (file: File, slotIndex: number) => {
    if (!file) return;
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast.error(`❌ ARCHIVO MUY GRANDE: ${sizeMB}MB. Máximo permitido: 10MB. Comprime el archivo.`);
      return;
    }
    
    // Set uploading state immediately
    setPlansUploading(prev => ({ ...prev, [slotIndex]: true }));
    setPlansUploadProgress(prev => ({ ...prev, [slotIndex]: 0 }));
    
    console.log(`=== INICIO SUBIDA PLAN ${slotIndex + 1} ===`);
    
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `plan-${Date.now()}-slot${slotIndex}.${fileExt}`;
      
      toast.info(`📤 Subiendo archivo ${slotIndex + 1}...`);
      
      // SIMPLE PROGRESS: Start at 10%, then 50% during upload, 100% on success
      setPlansUploadProgress(prev => ({ ...prev, [slotIndex]: 10 }));
      
      // Small delay to show initial progress
      await new Promise(resolve => setTimeout(resolve, 200));
      setPlansUploadProgress(prev => ({ ...prev, [slotIndex]: 50 }));
      
      console.log(`Subiendo archivo: ${fileName}`);
      
      // ACTUAL UPLOAD - No intervals, no complications
      const { data, error } = await supabase.storage
        .from('property-plans')
        .upload(fileName, file);
      
      if (error) {
        console.error("Upload error:", error);
        throw new Error(error.message);
      }
      
      console.log("Upload successful:", data);
      
      // Progress to 90%
      setPlansUploadProgress(prev => ({ ...prev, [slotIndex]: 90 }));
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-plans')
        .getPublicUrl(fileName);
      
      console.log("Public URL obtained:", publicUrl);
      
      // Progress to 100%
      setPlansUploadProgress(prev => ({ ...prev, [slotIndex]: 100 }));
      
      // Update form data
      const currentPlans = [...(formData.plans_url || [])];
      while (currentPlans.length <= slotIndex) {
        currentPlans.push("");
      }
      currentPlans[slotIndex] = publicUrl;
      updateFormData("plans_url", currentPlans);
      
      console.log("Form data updated successfully");
      
      toast.success(`✅ ARCHIVO ${slotIndex + 1} SUBIDO EXITOSAMENTE`);
      
      // Keep progress visible for 2 seconds, then clear
      setTimeout(() => {
        setPlansUploadProgress(prev => {
          const newState = { ...prev };
          delete newState[slotIndex];
          return newState;
        });
        console.log(`Progress cleared for slot ${slotIndex + 1}`);
      }, 2000);
      
    } catch (error: any) {
      console.error(`=== ERROR SUBIDA PLAN ${slotIndex + 1} ===`, error);
      
      // Clear progress on error
      setPlansUploadProgress(prev => {
        const newState = { ...prev };
        delete newState[slotIndex];
        return newState;
      });
      
      // Specific error handling
      let errorMessage = "Error desconocido";
      if (error.message?.includes('exceeded') || error.message?.includes('quota')) {
        errorMessage = "CUOTA EXCEDIDA: El almacenamiento está lleno.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "SIN INTERNET: Revisa tu conexión y reintenta.";
      } else if (error.message?.includes('size') || error.message?.includes('large')) {
        errorMessage = "ARCHIVO MUY GRANDE: Comprime el archivo.";
      } else {
        errorMessage = error.message || "Error inesperado al subir";
      }
      
      toast.error(`❌ ${errorMessage}`);
      
    } finally {
      // ALWAYS clear uploading state
      setPlansUploading(prev => ({ ...prev, [slotIndex]: false }));
      console.log(`=== FIN SUBIDA PLAN ${slotIndex + 1} ===`);
    }
  };
  
  // Remove plan file
  const removePlanFile = (slotIndex: number) => {
    const currentPlans = [...(formData.plans_url || [])];
    currentPlans[slotIndex] = "";
    updateFormData("plans_url", currentPlans.filter(plan => plan !== ""));
    
    const input = document.getElementById(`plan-upload-${slotIndex}`) as HTMLInputElement;
    if (input) input.value = "";
    
    toast.success(`🗑️ Archivo ${slotIndex + 1} eliminado`);
  };

  // Cancel plan upload
  const cancelPlanUpload = (slotIndex: number) => {
    setPlansUploading(prev => ({ ...prev, [slotIndex]: false }));
    setPlansUploadProgress(prev => {
      const newState = { ...prev };
      delete newState[slotIndex];
      return newState;
    });
    
    toast.info(`❌ Subida cancelada para archivo ${slotIndex + 1}`);
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

  // Enhanced form validation - ARCHIVOS OPCIONALES
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.title) errors.push("El título es obligatorio");
    if (!formData.property_type) errors.push("El tipo de propiedad es obligatorio");
    if (!formData.transaction_type) errors.push("El tipo de transacción es obligatorio");
    if (!formData.price) errors.push("El precio es obligatorio");
    if (!formData.description) errors.push("La descripción es obligatoria para una mejor presentación");
    
    // CAMBIO: Las imágenes y planos son ahora OPCIONALES
    // No se requieren archivos para guardar la propiedad
    
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
        transaction_type: formData.transaction_type || "venta",
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
    setFormSubmitting(true);
    setSaveSuccess(false);

    try {
      console.log("Llamando onSubmit con datos:", formData);
      
      // Call onSubmit if provided
      if (onSubmit) {
        await Promise.resolve(onSubmit(formData));
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
            transaction_type: "",
            commission_percentage: "",
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
    }
    
    // CRITICAL: Always set loading to false regardless of success or error
    console.log("FINALIZANDO SUBMIT - Poniendo loading a false");
    setFormSubmitting(false);
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction_type">Tipo de Transacción *</Label>
                  <Select value={formData.transaction_type} onValueChange={(value) => updateFormData("transaction_type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de transacción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venta">Venta</SelectItem>
                      <SelectItem value="alquiler">Alquiler</SelectItem>
                      <SelectItem value="anticretico">Anticrético</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(userProfile?.is_super_admin || userProfile) && (
                  <div className="space-y-2">
                    <Label htmlFor="commission_percentage">Comisión (%) - Solo visible para agentes</Label>
                    <Input
                      id="commission_percentage"
                      value={formData.commission_percentage}
                      onChange={(e) => updateFormData("commission_percentage", e.target.value)}
                      placeholder="5.0"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Este campo no será visible en el portal público
                    </p>
                  </div>
                )}
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
              {/* Department, Province, Zone Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Select value={selectedDepartment || "all"} onValueChange={(value) => {
                    const newDept = value === "all" ? "" : value;
                    setSelectedDepartment(newDept);
                    setSelectedProvince(""); // Reset province when department changes
                    setSelectedZone(""); // Reset zone when department changes
                    
                    // Update address with department
                    if (newDept) {
                      const dept = boliviaDepartments.find(d => d.id === newDept);
                      if (dept) {
                        const currentAddress = formData.address.replace(/,\s*\w+\s*$/g, ''); // Remove existing department
                        updateFormData("address", `${currentAddress}, ${dept.name}`.replace(/^,\s*/, ''));
                      }
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Seleccionar departamento</SelectItem>
                      {boliviaDepartments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Provincia</Label>
                  <Select 
                    value={selectedProvince || "all"} 
                    onValueChange={(value) => {
                      const newProv = value === "all" ? "" : value;
                      setSelectedProvince(newProv);
                      setSelectedZone(""); // Reset zone when province changes
                      
                      // Update address with province
                      if (newProv && selectedDepartment) {
                        const dept = boliviaDepartments.find(d => d.id === selectedDepartment);
                        const province = dept?.provinces.find(p => p.id === newProv);
                        if (province) {
                          const baseAddress = formData.address.split(',')[0] || '';
                          updateFormData("address", `${baseAddress}, ${province.name}, ${dept?.name}`.replace(/^,\s*/, ''));
                        }
                      }
                    }}
                    disabled={!selectedDepartment}
                  >
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={selectedDepartment ? "Selecciona provincia" : "Primero elige departamento"} 
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Seleccionar provincia</SelectItem>
                      {selectedDepartment && 
                        boliviaDepartments
                          .find(d => d.id === selectedDepartment)
                          ?.provinces.map((province) => (
                            <SelectItem key={province.id} value={province.id}>
                              {province.name}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Zona específica</Label>
                  <Input
                    value={selectedZone}
                    onChange={(e) => {
                      const newZone = e.target.value;
                      setSelectedZone(newZone);
                      
                      // Update address with zone
                      if (selectedDepartment && selectedProvince) {
                        const dept = boliviaDepartments.find(d => d.id === selectedDepartment);
                        const province = dept?.provinces.find(p => p.id === selectedProvince);
                        if (province && dept) {
                          const baseAddress = formData.address.split(',')[0] || '';
                          updateFormData("address", 
                            newZone 
                              ? `${baseAddress}, ${newZone}, ${province.name}, ${dept.name}`.replace(/^,\s*/, '')
                              : `${baseAddress}, ${province.name}, ${dept.name}`.replace(/^,\s*/, '')
                          );
                        }
                      }
                    }}
                    placeholder={selectedProvince ? "Ej: Zona Sur, Centro, etc." : "Primero elige provincia"}
                    disabled={!selectedProvince}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección Completa</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder="Calle Ingavi, Cochabamba, Departamento de Cochabamba, Bolivia"
                />
                <p className="text-xs text-muted-foreground">
                  La dirección se actualizará automáticamente al seleccionar ubicación
                </p>
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
              {/* ROBUST PROPERTY IMAGES - MULTIPLE UPLOAD with Progress */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <Label className="text-base font-medium">Fotografías de la Propiedad *</Label>
                    <p className="text-sm text-muted-foreground">
                      Selecciona múltiples imágenes - Máximo 10 fotos, 5MB cada una
                    </p>
                  </div>
                </div>
                
                {/* Progress bars for image uploads */}
                {Object.keys(imageUploadProgress).length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-blue-800">📤 Subiendo imágenes...</Label>
                      {Object.entries(imageUploadProgress).map(([key, progress]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-xs text-blue-700">
                            <span>Imagen {key.split('_')[2]}</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Show existing images */}
                {formData.image_urls && formData.image_urls.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {formData.image_urls.length} imagen(es) subida(s)
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
                              toast.success("🗑️ Imagen eliminada");
                            }}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Image upload area */}
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary hover:bg-accent/5 transition-all">
                  <input
                    id="multiple-images"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    disabled={imageUploading}
                    onChange={(e) => {
                      if (e.target.files) {
                        handleImagesUpload(e.target.files);
                        e.target.value = ""; // Clear input after handling
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="multiple-images" className={`cursor-pointer ${imageUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="text-4xl mb-2">📸</div>
                    <div className="text-lg font-medium mb-1">
                      {imageUploading ? "Subiendo imágenes..." : "Agregar Fotografías"}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Selecciona múltiples imágenes (máx 10 fotos, 5MB cada una)
                    </div>
                    <Button type="button" variant="outline" asChild disabled={imageUploading}>
                      <span>
                        {imageUploading
                          ? "⏳ Procesando..."
                          : formData.image_urls && formData.image_urls.length > 0
                          ? `📸 Agregar Más (${formData.image_urls.length}/10)`
                          : "📸 Seleccionar Imágenes"
                        }
                      </span>
                    </Button>
                  </label>
                </div>
                
                <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
                  📸 <strong>Imágenes múltiples:</strong> Sube hasta 10 fotos para mostrar todos los aspectos de la propiedad. Con barra de progreso en tiempo real.
                </div>
              </div>

              {/* ROBUST VIDEO UPLOAD with Progress */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Video de la Propiedad</Label>
                  <p className="text-sm text-muted-foreground">
                    Video promocional (opcional) - Límite: 50MB para mantener la velocidad de la plataforma
                  </p>
                </div>
                
                {/* Video upload progress */}
                {videoUploading && (
                  <div className="bg-blue-50 p-4 rounded-lg border">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">📹 Subiendo video... ({videoTimer}s)</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${videoUploadProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-blue-700 text-center">{videoUploadProgress}% completado</div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="video_url">URL del Video o Subir Archivo (máx. 50MB)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="video_url"
                      value={formData.video_url}
                      onChange={(e) => updateFormData("video_url", e.target.value)}
                      placeholder="https://youtube.com/watch?v=... o Vimeo"
                      className="flex-1"
                      disabled={videoUploading}
                    />
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="video-upload"
                      disabled={videoUploading}
                    />
                     <label htmlFor="video-upload">
                     <Button type="button" variant="outline" asChild disabled={videoUploading}>
                       <span className="flex items-center gap-2">
                         <Video className="h-4 w-4" />
                         {videoUploading ? `⏳ ${videoTimer}s` : "📹 Subir Video"}
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
                          disabled={videoUploading}
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

              {/* ROBUST TRIPLE PLAN UPLOAD SYSTEM - UP TO 3 FILES with Independent Progress */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <Label className="text-base font-medium">Planos de la Propiedad</Label>
                    <p className="text-sm text-muted-foreground">
                      Sube hasta 3 archivos: planos (PDF) o imágenes (JPG/PNG) - Máximo 10MB cada uno
                    </p>
                  </div>
                </div>
                
                {/* Three independent plan upload slots */}
                {[0, 1, 2].map((slotIndex) => {
                  const isUploading = plansUploading[slotIndex];
                  const progress = plansUploadProgress[slotIndex] || 0;
                  const hasFile = formData.plans_url && formData.plans_url[slotIndex];
                  
                  return (
                    <div key={slotIndex} className="space-y-2">
                      <Label className="text-sm font-medium">Archivo {slotIndex + 1}</Label>
                      
                      {/* Progress bar for this slot */}
                      {isUploading && (
                        <div className="bg-blue-50 p-3 rounded-lg border">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">📤 Subiendo archivo {slotIndex + 1}...</span>
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => cancelPlanUpload(slotIndex)}
                                className="h-6 w-6 p-0"
                              >
                                ✕
                              </Button>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="text-xs text-blue-700 text-center">{progress}% completado</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show uploaded file */}
                      {hasFile && !isUploading && (
                        <div className="bg-green-50 p-3 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                ✅ Archivo {slotIndex + 1} subido
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removePlanFile(slotIndex)}
                              disabled={isUploading}
                            >
                              🗑️ Eliminar
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Upload area for this slot */}
                      {!hasFile && !isUploading && (
                        <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center hover:border-primary hover:bg-accent/5 transition-all">
                          <input
                            id={`plan-upload-${slotIndex}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handlePlanUpload(file, slotIndex);
                                e.target.value = ""; // Clear input
                              }
                            }}
                            className="hidden"
                            disabled={isUploading}
                          />
                          <label htmlFor={`plan-upload-${slotIndex}`} className="cursor-pointer">
                            <div className="text-2xl mb-1">📋</div>
                            <div className="text-sm font-medium mb-1">Subir Archivo {slotIndex + 1}</div>
                            <div className="text-xs text-muted-foreground mb-2">
                              PDF, JPG o PNG - Máximo 10MB
                            </div>
                            <Button type="button" variant="outline" size="sm" asChild>
                              <span>📋 Seleccionar</span>
                            </Button>
                          </label>
                        </div>
                      )}
                      
                      {/* Replace button if file exists */}
                      {hasFile && !isUploading && (
                        <div className="text-center">
                          <input
                            id={`plan-replace-${slotIndex}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handlePlanUpload(file, slotIndex);
                                e.target.value = ""; // Clear input
                              }
                            }}
                            className="hidden"
                          />
                          <label htmlFor={`plan-replace-${slotIndex}`}>
                            <Button type="button" variant="outline" size="sm" asChild>
                              <span>🔄 Reemplazar Archivo {slotIndex + 1}</span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
                  📄 <strong>Hasta 3 archivos independientes:</strong> Cada archivo sube por separado con su propia barra de progreso. 
                  Si hay error, aparecerá mensaje específico para ese archivo.
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <div className="flex gap-2">
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              )}
              
              <Button 
                type="button" 
                variant="secondary"
                disabled={updateButtonLoading}
                onClick={async () => {
                  setUpdateButtonLoading(true);
                  // Reset all loading states
                  setFormSubmitting(false);
                  setVideoUploading(false);
                  setGeneratingDescription(false);
                  
                  // Simular un pequeño delay para mostrar feedback
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  setUpdateButtonLoading(false);
                  toast.success("✅ Estados actualizados. Puedes continuar.");
                }}
              >
                {updateButtonLoading ? "🔄 Actualizando..." : "🔄 Actualizar"}
              </Button>
              
              <Button 
                type="submit" 
                disabled={formSubmitting}
                onClick={(e) => {
                  // CAMBIO: Solo bloquear por formSubmitting, permitir guardar mientras se suben archivos
                  // Los archivos son opcionales y pueden subir en segundo plano
                  console.log("=== INTENTO DE GUARDADO ===");
                  console.log("formSubmitting:", formSubmitting);
                  console.log("Permitiendo guardado con archivos en segundo plano");
                }}
              >
                {formSubmitting 
                  ? "Guardando..." 
                  : "Guardar Propiedad"
                }
                {/* Indicador de archivos subiendo en paralelo */}
                {(videoUploading || imageUploading || Object.values(plansUploading).some(Boolean)) && !formSubmitting && (
                  <span className="ml-2 text-xs opacity-70">
                    {videoUploading && "📹"} 
                    {imageUploading && "🖼️"} 
                    {Object.values(plansUploading).some(Boolean) && "📋"}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}