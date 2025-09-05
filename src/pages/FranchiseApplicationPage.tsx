import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, User } from "lucide-react";
import { useEffect } from "react";
import { SuccessConfirmationModal } from "@/components/SuccessConfirmationModal";

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
    title: "Solicitar Franquicia | DOMINIO Inmobiliaria",
    description: "Únete a la red de franquicias inmobiliarias más grande de Bolivia. Solicita tu franquicia DOMINIO hoy.",
    canonicalPath: "/solicitar-franquicia",
  });

  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    whatsapp: "",
    city: "",
    country: "",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('franchise-docs')
        .upload(fileName, file);

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
      let photoUrl = null;
      let cvUrl = null;

      // Upload photo if provided
      if (photoFile) {
        photoUrl = await uploadFile(photoFile, 'photos');
        if (!photoUrl) {
          toast.error("Error al subir la foto. Inténtalo de nuevo.");
          setLoading(false);
          return;
        }
      }

      // Upload CV if provided
      if (cvFile) {
        cvUrl = await uploadFile(cvFile, 'cvs');
        if (!cvUrl) {
          toast.error("Error al subir el curriculum. Inténtalo de nuevo.");
          setLoading(false);
          return;
        }
      }

      // Save application to database
      const { error } = await supabase
        .from('franchise_applications')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          city: formData.city,
          country: formData.country,
          message: formData.message,
          photo_url: photoUrl,
          cv_url: cvUrl
        });

      if (error) throw error;

      // Show success modal instead of toast
      setShowSuccessModal(true);
      
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        whatsapp: "",
        city: "",
        country: "",
        message: ""
      });
      setPhotoFile(null);
      setCvFile(null);
      
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
            <h1 className="text-4xl font-bold tracking-tight">Solicitar Franquicia DOMINIO</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Únete a la red de franquicias inmobiliarias más grande de Bolivia
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Formulario de Solicitud</CardTitle>
              <CardDescription>
                Completa el siguiente formulario para solicitar tu franquicia DOMINIO
              </CardDescription>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Número de Celular</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+591 70000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      placeholder="+591 70000000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="La Paz, Santa Cruz, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Bolivia"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">¿Por qué quieres una franquicia DOMINIO?</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Cuéntanos tu motivación y experiencia..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="photo">Foto del solicitante</Label>
                    <div className="mt-2">
                      <input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('photo')?.click()}
                        className="w-full flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        {photoFile ? photoFile.name : "Subir foto"}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cv">Curriculum (PDF)</Label>
                    <div className="mt-2">
                      <input
                        id="cv"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('cv')?.click()}
                        className="w-full flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        {cvFile ? cvFile.name : "Subir CV"}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
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
        title="¡Solicitud de Franquicia Enviada!"
        description="Tu solicitud de franquicia fue enviada exitosamente. Nuestro equipo revisará tu aplicación y te contactará pronto para continuar con el proceso."
      />
    </div>
  );
}