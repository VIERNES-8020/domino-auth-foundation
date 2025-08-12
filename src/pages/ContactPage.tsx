import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <main className="container mx-auto py-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Contacto</h1>
        <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl" onSubmit={(e)=>{ e.preventDefault(); toast.success("Gracias, te contactaremos pronto."); }}>
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" required placeholder="Tu nombre" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required placeholder="tu@correo.com" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="message">Mensaje</Label>
            <Textarea id="message" required placeholder="¿En qué podemos ayudarte?" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Enviar</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
