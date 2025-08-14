import { useState } from "react";
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
import { Home, MapPin, Camera, Settings } from "lucide-react";

interface PropertyFormData {
  title: string;
  description: string;
  price: string;
  currency: string;
  property_type: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  features: string[];
}

interface PropertyFormProps {
  onClose?: () => void;
  onSubmit?: (data: PropertyFormData) => void;
}

const availableFeatures = [
  "Piscina", "Gym", "Estacionamiento", "Jardín", 
  "Balcón", "Terraza", "Seguridad 24h", "Ascensor",
  "Aire Acondicionado", "Calefacción", "Barbacoa", "Cochera"
];

export default function PropertyForm({ onClose, onSubmit }: PropertyFormProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    price: "",
    currency: "USD",
    property_type: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    address: "",
    latitude: null,
    longitude: null,
    features: []
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

  const handleLocationSelect = (coords: { lat: number; lng: number }) => {
    updateFormData("latitude", coords.lat);
    updateFormData("longitude", coords.lng);
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
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        price: "",
        currency: "USD",
        property_type: "",
        bedrooms: "",
        bathrooms: "",
        area: "",
        address: "",
        latitude: null,
        longitude: null,
        features: []
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
          Nueva Propiedad
        </CardTitle>
        <CardDescription>
          Completa la información de la propiedad para publicarla
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

              <div className="space-y-2">
                <Label htmlFor="area">Área (m²)</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => updateFormData("area", e.target.value)}
                  placeholder="250"
                  type="number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  placeholder="Describe las características principales de la propiedad..."
                  rows={4}
                />
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
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Subir fotos de la propiedad</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Arrastra y suelta las imágenes aquí o haz clic para seleccionar
                  </p>
                  <Button type="button" variant="outline">
                    Seleccionar archivos
                  </Button>
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