import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

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

interface AboutContent {
  section_key: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
}

export default function AboutPage() {
  usePageSEO({ 
    title: "Sobre Nosotros | DOMINIO", 
    description: "Conoce la historia, misión y visión de DOMINIO Inmobiliaria, la red inmobiliaria líder en Bolivia.", 
    canonicalPath: "/about" 
  });

  const [content, setContent] = useState<AboutContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        const { data, error } = await supabase
          .from('about_page_content')
          .select('*')
          .order('section_key');
        
        if (!error && data) {
          setContent(data);
        }
      } catch (e) {
        console.error('Error loading about content:', e);
      } finally {
        setLoading(false);
      }
    }
    
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
        <main className="container mx-auto py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando...</p>
          </div>
        </main>
      </div>
    );
  }

  const getCeoSection = () => content.find(c => c.section_key === 'ceo_section');
  const getMission = () => content.find(c => c.section_key === 'mission');
  const getVision = () => content.find(c => c.section_key === 'vision');
  const getValues = () => content.find(c => c.section_key === 'values');
  const getObjectives = () => content.find(c => c.section_key === 'objectives');

  const ceoSection = getCeoSection();
  const mission = getMission();
  const vision = getVision();
  const values = getValues();
  const objectives = getObjectives();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <main className="container mx-auto py-16 space-y-16">
        {/* CEO Section - Two Columns */}
        <section className="animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {ceoSection?.title || "Sobre DOMINIO"}
              </h1>
              <div className="prose prose-lg text-muted-foreground max-w-none">
                <p className="text-lg leading-relaxed">
                  {ceoSection?.content || 
                    "DOMINIO Inmobiliaria nació de la visión de crear la red de franquicias inmobiliarias más grande y confiable de Bolivia. Nuestra misión es conectar personas con hogares, brindando transparencia, confianza y excelencia en cada transacción."
                  }
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/10 to-accent/10">
                {ceoSection?.image_url ? (
                  <img 
                    src={ceoSection.image_url} 
                    alt="CEO de DOMINIO Inmobiliaria"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-24 h-24 rounded-full bg-primary/20 mx-auto flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary">D</span>
                      </div>
                      <div className="text-muted-foreground">
                        <p className="font-semibold">Liderazgo</p>
                        <p className="text-sm">DOMINIO Inmobiliaria</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Mission, Vision, Values, Objectives - Four Cards */}
        <section className="animate-fade-in">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Nuestros Pilares</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Los valores y principios que guían nuestro trabajo diario y nos impulsan hacia la excelencia.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Mission Card */}
            <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-blue-100 border-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 group-hover:from-blue-500/10 group-hover:to-blue-600/20 transition-all duration-300" />
              <CardContent className="p-6 relative">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-xl font-bold text-blue-900">
                    {mission?.title || "Nuestra Misión"}
                  </h3>
                </div>
                <p className="text-blue-800 text-sm leading-relaxed">
                  {mission?.content || 
                    "Ser el puente confiable entre las personas y sus sueños inmobiliarios, proporcionando servicios de excelencia y transparencia en cada transacción."
                  }
                </p>
              </CardContent>
            </Card>

            {/* Vision Card */}
            <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-purple-100 border-0">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10 group-hover:from-purple-500/10 group-hover:to-purple-600/20 transition-all duration-300" />
              <CardContent className="p-6 relative">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
                    <span className="text-2xl">🌟</span>
                  </div>
                  <h3 className="text-xl font-bold text-purple-900">
                    {vision?.title || "Nuestra Visión"}
                  </h3>
                </div>
                <p className="text-purple-800 text-sm leading-relaxed">
                  {vision?.content || 
                    "Convertirnos en la red inmobiliaria líder en Bolivia, reconocida por nuestra integridad, innovación y compromiso con nuestros clientes."
                  }
                </p>
              </CardContent>
            </Card>

            {/* Values Card */}
            <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-green-50 to-green-100 border-0">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10 group-hover:from-green-500/10 group-hover:to-green-600/20 transition-all duration-300" />
              <CardContent className="p-6 relative">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                    <span className="text-2xl">💎</span>
                  </div>
                  <h3 className="text-xl font-bold text-green-900">
                    {values?.title || "Nuestros Valores"}
                  </h3>
                </div>
                <p className="text-green-800 text-sm leading-relaxed">
                  {values?.content || 
                    "Transparencia, Confianza, Excelencia, Innovación y Compromiso con nuestros clientes y comunidades."
                  }
                </p>
              </CardContent>
            </Card>

            {/* Objectives Card */}
            <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-orange-50 to-orange-100 border-0">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10 group-hover:from-orange-500/10 group-hover:to-orange-600/20 transition-all duration-300" />
              <CardContent className="p-6 relative">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-3">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h3 className="text-xl font-bold text-orange-900">
                    {objectives?.title || "Nuestros Objetivos"}
                  </h3>
                </div>
                <p className="text-orange-800 text-sm leading-relaxed">
                  {objectives?.content || 
                    "Expandir nuestra red de franquicias a nivel nacional, mantener los más altos estándares de servicio y ser el referente en el sector inmobiliario boliviano."
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="text-center animate-fade-in">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-12 border border-primary/20">
            <h2 className="text-3xl font-bold mb-6">¿Listo para formar parte de DOMINIO?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg">
              Únete a la red inmobiliaria más confiable de Bolivia. Descubre cómo podemos ayudarte a alcanzar tus objetivos inmobiliarios.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/properties" 
                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Ver Propiedades
              </a>
              <a 
                href="/franchise-application" 
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Solicitar Franquicia
              </a>
              <a 
                href="/contacto" 
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Contactar
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}