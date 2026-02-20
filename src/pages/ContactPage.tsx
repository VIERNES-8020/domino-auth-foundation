import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SuccessMessage from "@/components/SuccessMessage";
import { ArrowLeft } from "lucide-react";

function usePageSEO(opts: { title: string; description: string; canonicalPath: string }) {
  const { title, description, canonicalPath } = opts;
  useEffect(() => {
    document.title = title;
    const ensure = (n: string, c: string) => {
      let el = document.querySelector(`meta[name="${n}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", n); document.head.appendChild(el); }
      el.setAttribute("content", c);
    };
    ensure("description", description);
    const canonicalUrl = new URL(canonicalPath, window.location.origin).toString();
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement("link"); link.setAttribute("rel", "canonical"); document.head.appendChild(link); }
    link.setAttribute("href", canonicalUrl);
  }, [title, description, canonicalPath]);
}

export default function ContactPage() {
  const navigate = useNavigate();
  usePageSEO({ title: "Contacto | DOMINIO", description: "Contáctanos para comprar, vender o alquilar propiedades.", canonicalPath: "/contact" });
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create contact message for super admin notifications
      const { error } = await supabase.functions.invoke('contact-message', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          message: formData.message,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        throw error;
      }

      toast.success("¡Gracias! Tu mensaje ha sido enviado. Te contactaremos pronto.");
      setFormData({ name: "", email: "", phone: "", whatsapp: "", message: "" });
      setShowSuccessMessage(true);
    } catch (error) {
      console.error('Error sending contact message:', error);
      toast.error("Hubo un error al enviar tu mensaje. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
      <main className="container mx-auto px-4 py-16 sm:py-24 flex flex-col items-center">
        {/* Back Button */}
        <div className="w-full max-w-2xl mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/propiedades')} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver a Propiedades
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-10 max-w-lg">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">Contáctanos</h1>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg">¿Tienes alguna consulta? Nos encantaría saber de ti. Completa el formulario y te responderemos pronto.</p>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-2xl bg-card rounded-2xl shadow-xl border border-border/40 p-6 sm:p-10">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input 
                id="name" 
                required 
                placeholder="Tu nombre"
                className="h-12"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                placeholder="tu@correo.com"
                className="h-12"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Número de Celular</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="Ej: 7XXXXXXXX"
                className="h-12"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input 
                id="whatsapp" 
                type="tel" 
                placeholder="Ej: 7XXXXXXXX"
                className="h-12"
                value={formData.whatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="message">Mensaje</Label>
              <Textarea 
                id="message" 
                required 
                placeholder="¿En qué podemos ayudarte?"
                className="min-h-[130px]"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2 pt-2">
              <Button type="submit" disabled={loading} size="lg" className="w-full text-base font-semibold">
                {loading ? "Enviando..." : "Enviar mensaje"}
              </Button>
            </div>
          </form>
        </div>
      </main>
      
      <SuccessMessage 
        isOpen={showSuccessMessage}
        onClose={() => setShowSuccessMessage(false)}
      />
    </div>
  );
}