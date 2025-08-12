import { useEffect } from "react";

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

export default function AboutPage() {
  usePageSEO({ title: "Sobre Nosotros | DOMINIO", description: "Conoce la misión y visión de DOMINIO Inmobiliaria.", canonicalPath: "/about" });
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <main className="container mx-auto py-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Sobre Nosotros</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">Somos la red de franquicias inmobiliarias más grande de Bolivia. Conectamos personas con hogares, brindando transparencia y confianza.</p>
      </main>
    </div>
  );
}
