import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import SuccessCounters from "@/components/SuccessCounters";
import MapPicker from "@/components/MapPicker";
import { boliviaDepartments, type Department } from "@/data/bolivia-locations";

export default function VendePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    department: "",
    province: "",
    request_type: "",
    property_location: "",
    property_lat: null as number | null,
    property_lng: null as number | null
  });

  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDepartmentChange = (departmentId: string) => {
    const department = boliviaDepartments.find(d => d.id === departmentId);
    setSelectedDepartment(department || null);
    setFormData(prev => ({ 
      ...prev, 
      department: departmentId,
      province: "" // Reset province when department changes
    }));
  };

  const handleMapChange = (coords: { lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      property_lat: coords.lat,
      property_lng: coords.lng
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.request_type) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('listing_leads')
        .insert({
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          whatsapp: formData.whatsapp.trim() || null,
          city_country: `${selectedDepartment?.name || ''}, ${boliviaDepartments.find(d => d.id === formData.department)?.provinces.find(p => p.id === formData.province)?.name || ''}, Bolivia`.trim(),
          request_type: formData.request_type,
          property_location: formData.property_location.trim() || null
        });

      if (error) throw error;

      toast.success("¡Solicitud enviada exitosamente! Te contactaremos pronto.");
      
      // Reset form
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        whatsapp: "",
        department: "",
        province: "",
        request_type: "",
        property_location: "",
        property_lat: null,
        property_lng: null
      });
      setSelectedDepartment(null);

      // Redirect to home after success
      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (error) {
      console.error('Error submitting listing lead:', error);
      toast.error("Error al enviar la solicitud. Por favor intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-6 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Inicio
            </Button>

            <SuccessCounters />

            <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                ¿Quieres Vender o Alquilar tu Propiedad?
              </CardTitle>
              <CardDescription className="text-lg">
                Déjanos tus datos y nuestro equipo de expertos te contactará para 
                brindarte la mejor asesoría inmobiliaria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">
                      Nombre Completo *
                    </Label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Correo Electrónico *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Número de Celular
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+591 7XXXXXXX"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-sm font-medium">
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="+591 7XXXXXXX"
                      value={formData.whatsapp}
                      onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium">
                      Departamento *
                    </Label>
                    <Select value={formData.department} onValueChange={handleDepartmentChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {boliviaDepartments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province" className="text-sm font-medium">
                      Provincia *
                    </Label>
                    <Select 
                      value={formData.province} 
                      onValueChange={(value) => handleInputChange("province", value)}
                      disabled={!selectedDepartment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una provincia" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedDepartment?.provinces.map((province) => (
                          <SelectItem key={province.id} value={province.id}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-2">
                    <Label htmlFor="request_type" className="text-sm font-medium">
                      Tipo de Solicitud *
                    </Label>
                    <Select value={formData.request_type} onValueChange={(value) => handleInputChange("request_type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venta">Quiero Vender</SelectItem>
                        <SelectItem value="alquiler">Quiero Alquilar</SelectItem>
                        <SelectItem value="anticretico">Quiero dar en Anticrético</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="property_location" className="text-sm font-medium">
                    Ubicación de la Propiedad
                  </Label>
                  <Textarea
                    id="property_location"
                    placeholder="Describe la ubicación exacta de tu propiedad (barrio, zona, referencias, etc.)"
                    value={formData.property_location}
                    onChange={(e) => handleInputChange("property_location", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Ubicación en el Mapa (Opcional)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Haz clic en el mapa para marcar la ubicación exacta de tu propiedad
                  </p>
                  <MapPicker
                    lat={formData.property_lat || undefined}
                    lng={formData.property_lng || undefined}
                    onChange={handleMapChange}
                    className="w-full h-64 rounded-lg border"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex items-center gap-2"
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isLoading ? "Enviando..." : "Enviar Solicitud"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}