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

export default function VendePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    city_country: "",
    request_type: "",
    property_location: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          city_country: formData.city_country.trim() || null,
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
        city_country: "",
        request_type: "",
        property_location: ""
      });

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
                    <Label htmlFor="city_country" className="text-sm font-medium">
                      Ciudad/País
                    </Label>
                    <Input
                      id="city_country"
                      type="text"
                      placeholder="La Paz, Bolivia"
                      value={formData.city_country}
                      onChange={(e) => handleInputChange("city_country", e.target.value)}
                    />
                  </div>

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