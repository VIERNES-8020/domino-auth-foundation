import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SuccessMessage from "@/components/SuccessMessage";

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
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <main className="container mx-auto py-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Contacto</h1>
        <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input 
              id="name" 
              required 
              placeholder="Tu nombre"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              required 
              placeholder="tu@correo.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="phone">Número de Celular</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="Ej: 7XXXXXXXX"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input 
              id="whatsapp" 
              type="tel" 
              placeholder="Ej: 7XXXXXXXX"
              value={formData.whatsapp}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="message">Mensaje</Label>
            <Textarea 
              id="message" 
              required 
              placeholder="¿En qué podemos ayudarte?"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </form>
      </main>
      
      {/* Success Message Modal */}
      <SuccessMessage 
        isOpen={showSuccessMessage}
        onClose={() => setShowSuccessMessage(false)}
      />
    </div>
  );
}