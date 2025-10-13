import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FileImage } from "lucide-react";
import { useEffect } from "react";
import { SuccessConfirmationModal } from "@/components/SuccessConfirmationModal";
import { convertImageToJPG } from "@/utils/imageConverter";

// SEO Hook
function usePageSEO(options: { title: string; description: string; canonicalPath: string }) {
  const { title, description, canonicalPath } = options;
  useEffect(() => {
    document.title = title;

    const ensureMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    ensureMeta("description", description);

    const canonicalUrl = new URL(canonicalPath, window.location.origin).toString();
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);
  }, [title, description, canonicalPath]);
}

export default function FranchiseApplicationPage() {
  usePageSEO({
    title: "Solicitar Servicios ARXIS | DOMINIO Inmobiliaria",
    description: "Diseño, construcción y mantenimiento al servicio de tu proyecto inmobiliario. Contacta con nuestro equipo técnico ARXIS.",
    canonicalPath: "/solicitar-franquicia",
  });

  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    projectType: "",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadFile = async (file: File, folder: string, isImage: boolean = false): Promise<string | null> => {
    try {
      let fileToUpload = file;
      
      if (isImage && file.type.startsWith('image/')) {
        try {
          fileToUpload = await convertImageToJPG(file, 1200, 900, 0.9);
          console.log('Image converted to JPG successfully');
        } catch (conversionError) {
          console.error('Failed to convert image, using original:', conversionError);
        }
      }
      
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('franchise-docs')
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('franchise-docs')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;

      if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'arxis-projects', true);
        if (!imageUrl) {
          toast.error("Error al subir la imagen. Inténtalo de nuevo.");
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('franchise_applications')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          whatsapp: formData.phone,
          city: formData.city,
          country: formData.projectType,
          message: formData.message,
          photo_url: imageUrl,
          cv_url: null
        });

      if (error) throw error;

      setShowSuccessModal(true);
      
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        city: "",
        projectType: "",
        message: ""
      });
      setImageFile(null);
      
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error("Error al enviar la solicitud. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: "hsl(24 95% 50%)" }}>Solicitar Servicios ARXIS</h1>
            <p className="mt-3 text-xl font-semibold text-foreground">
              Diseño, construcción y mantenimiento al servicio de tu proyecto inmobiliario
            </p>
            <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
              Completa el siguiente formulario para coordinar con nuestro equipo técnico de ARXIS, el departamento de arquitectura, construcción y mantenimiento de DOMINIO.
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              Evaluaremos tu solicitud y te contactaremos para definir el alcance del proyecto: desde el diseño arquitectónico y remodelaciones, hasta la ejecución de obras y mantenimiento integral de inmuebles.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Formulario de Solicitud</CardTitle>
                  <CardDescription>
                    Cuéntanos sobre tu proyecto
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold" style={{ color: "#C76C33" }}>ARXIS</span>
                  <p className="text-xs text-muted-foreground">by DOMINIO</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Nombre completo *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="tu@correo.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Número de contacto / WhatsApp</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+591 70000000"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad / País</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="La Paz, Bolivia"
                    />
                  </div>
                  <div>
                    <Label htmlFor="projectType">Tipo de proyecto</Label>
                    <Select
                      value={formData.projectType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, projectType: value }))}
                    >
                      <SelectTrigger id="projectType">
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nuevo">Nuevo</SelectItem>
                        <SelectItem value="remodelacion">Remodelación</SelectItem>
                        <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="asesoria">Asesoría técnica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Cuéntanos tu idea o necesidad</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Describe tu proyecto, área a intervenir, alcance esperado..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="image">Subir imagen o plano (opcional)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Adjunta una foto o plano del área a intervenir
                  </p>
                  <div className="mt-2">
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image')?.click()}
                      className="w-full flex items-center gap-2"
                    >
                      <FileImage className="h-4 w-4" />
                      {imageFile ? imageFile.name : "Seleccionar imagen"}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-white" 
                  disabled={loading}
                  style={{ backgroundColor: "#C76C33" }}
                >
                  {loading ? "Enviando..." : "Enviar Solicitud"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <SuccessConfirmationModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="message"
        title="¡Solicitud Enviada Exitosamente!"
        description="Tu solicitud de servicios ARXIS ha sido recibida. Nuestro equipo técnico revisará los detalles de tu proyecto y te contactará pronto para coordinar una reunión y definir el alcance del trabajo."
      />
    </div>
  );
}