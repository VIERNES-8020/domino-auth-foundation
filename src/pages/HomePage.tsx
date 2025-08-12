import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@/assets/cover.jpg";
import { ArrowRight } from "lucide-react";

// SEO helpers
function usePageSEO(options: { title: string; description: string; canonicalPath?: string }) {
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

    if (canonicalPath) {
      const canonicalUrl = new URL(canonicalPath, window.location.origin).toString();
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonicalUrl);
    }
  }, [title, description, canonicalPath]);
}

export default function HomePage() {
  usePageSEO({
    title: "Encuentra tu Hogar Ideal | DOMIN10 Inmobiliaria",
    description:
      "La red de franquicias inmobiliarias más grande de Bolivia. Miles de propiedades verificadas y agentes certificados.",
    canonicalPath: "/",
  });

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DOMIN10 Inmobiliaria",
    url: typeof window !== "undefined" ? window.location.origin : "",
    logo: typeof window !== "undefined" ? `${window.location.origin}/favicon.ico` : "/favicon.ico",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Header / Top Navigation */}
      <header className="container mx-auto py-5">
        <nav className="flex items-center justify-between" aria-label="Principal">
          <Link to="/" className="flex items-center gap-2 hover-scale" aria-label="DOMIN10 Inicio">
            <span className="text-xl font-bold tracking-tight">DOMIN10</span>
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm">
              <Link to="/" className="story-link">Inicio</Link>
              <Link to="/properties" className="story-link">Propiedades</Link>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link to="/auth">Iniciar Sesión</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Registrarse</Link>
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img
            src={heroImage}
            alt="Hogares de DOMIN10 en Bolivia, fotografía inmobiliaria profesional"
            className="h-[72vh] w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background" />
        </div>

        <div className="container mx-auto min-h-[72vh] flex flex-col items-center justify-center text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Encuentra tu Hogar Ideal
          </h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            La red de franquicias inmobiliarias más grande de Bolivia. Miles de propiedades verificadas,
            agentes certificados y el respaldo de DOMIN10.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <Button size="lg" asChild>
              <Link to="/properties">Explorar Propiedades</Link>
            </Button>
            <Link to="/auth" className="inline-flex items-center gap-2 text-primary hover-scale">
              <span>Únete como Franquicia</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <main>
        <section className="container mx-auto py-12 md:py-16" aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="sr-only">Métricas de DOMIN10</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <Card className="shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold tracking-tight">1,200+</div>
                <p className="mt-1 text-sm text-muted-foreground">Propiedades</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold tracking-tight">25</div>
                <p className="mt-1 text-sm text-muted-foreground">Franquicias</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold tracking-tight">9</div>
                <p className="mt-1 text-sm text-muted-foreground">Ciudades</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold tracking-tight">150+</div>
                <p className="mt-1 text-sm text-muted-foreground">Ventas / mes</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
    </div>
  );
}
