import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@/assets/hero-warm.jpg";

import { ArrowRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { getSupabaseClient } from "@/lib/supabaseClient";
import PropertyCard from "@/components/PropertyCard";

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
    title: "Encuentra tu Hogar Ideal | DOMINIO Inmobiliaria",
    description:
      "La red de franquicias inmobiliarias más grande de Bolivia. Miles de propiedades verificadas y agentes certificados.",
    canonicalPath: "/",
  });

  const [featHouse, setFeatHouse] = useState<any[]>([]);
  const [featApt, setFeatApt] = useState<any[]>([]);
  const [featLand, setFeatLand] = useState<any[]>([]);
  const [featOffice, setFeatOffice] = useState<any[]>([]);
  const [realMetrics, setRealMetrics] = useState({
    totalProperties: 1200,
    totalFranchises: 25,
    totalCities: 9,
    monthlySales: 150
  });


  useEffect(() => {
    let active = true;
    (async () => {
        const fetchType = async (type: string) => {
        const { data } = await supabase
          .from("properties")
          .select("id,title,price,price_currency,image_urls,bedrooms,bathrooms,area_m2,constructed_area_m2,address,property_type")
          .eq("status", "approved")
          .eq("property_type", type)
          .eq("is_archived", false)
          .order("created_at", { ascending: false })
          .limit(10);
        return (data ?? []) as any[];
      };

      // Fetch metrics
      const fetchMetrics = async () => {
        try {
          const { data, error } = await supabase.rpc('get_platform_metrics');
          if (error) throw error;
          if (data && data.length > 0) {
            const metrics = data[0];
            setRealMetrics({
              totalProperties: metrics.total_properties || 1200,
              totalFranchises: metrics.total_franchises || 25,
              totalCities: 9, // Static for now
              monthlySales: metrics.monthly_sales || 150
            });
          }
        } catch (error) {
          console.error('Error fetching metrics:', error);
        }
      };

      const [houses, apts, lands, offices] = await Promise.all([
        fetchType("casa"),
        fetchType("departamento"),
        fetchType("terreno"),
        fetchType("oficina"),
      ]);
      
      await fetchMetrics();
      
      if (!active) return;
      setFeatHouse(houses); setFeatApt(apts); setFeatLand(lands); setFeatOffice(offices);
    })();
    return () => { active = false; };
  }, []);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DOMINIO Inmobiliaria",
    url: typeof window !== "undefined" ? window.location.origin : "",
    logo: typeof window !== "undefined" ? `${window.location.origin}/favicon.ico` : "/favicon.ico",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img
            src={heroImage}
            alt="Pareja pintando su nuevo hogar con luz cálida - inspiración DOMINIO"
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
            agentes certificados y el respaldo de DOMINIO.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <Button size="lg" asChild>
              <Link to="/properties">Explorar Propiedades</Link>
            </Button>
            <Link to="/solicitar-franquicia" className="inline-flex items-center gap-2 text-primary hover-scale">
              <span>Únete como Franquicia</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="container mx-auto py-10" aria-labelledby="featured-heading">
        <h2 id="featured-heading" className="text-2xl font-semibold mb-3">Propiedades Destacadas</h2>
        <Tabs defaultValue="house">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full rounded-lg shadow-md mb-4">
          <TabsTrigger value="house" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Casas</TabsTrigger>
          <TabsTrigger value="apartment" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Departamentos</TabsTrigger>
          <TabsTrigger value="land" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Terrenos</TabsTrigger>
          <TabsTrigger value="office" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Oficinas</TabsTrigger>
        </TabsList>

          <TabsContent value="house">
            <Carousel>
              <CarouselContent>
                {featHouse.map((p) => (
                  <CarouselItem key={p.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
                    <PropertyCard property={p} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </TabsContent>

          <TabsContent value="apartment">
            <Carousel>
              <CarouselContent>
                {featApt.map((p) => (
                  <CarouselItem key={p.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
                    <PropertyCard property={p} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </TabsContent>

          <TabsContent value="land">
            <Carousel>
              <CarouselContent>
                {featLand.map((p) => (
                  <CarouselItem key={p.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
                    <PropertyCard property={p} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </TabsContent>

          <TabsContent value="office">
            <Carousel>
              <CarouselContent>
                {featOffice.map((p) => (
                  <CarouselItem key={p.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
                    <PropertyCard property={p} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </TabsContent>
        </Tabs>
      </section>

      {/* Metrics Section */}
      <main>
        <section className="container mx-auto py-12 md:py-16" aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="sr-only">Métricas de DOMINIO</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-fade-in">
            <Link to="/properties" aria-label="Ver propiedades" className="block group">
              <Card className="shadow-sm transition-transform duration-200 hover:scale-[1.02] hover:shadow-[var(--shadow-elegant)] hover:border-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold tracking-tight transition-colors group-hover:text-primary">{realMetrics.totalProperties.toLocaleString()}+</div>
                  <p className="mt-1 text-sm text-muted-foreground">Propiedades</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/properties" aria-label="Ver franquicias" className="block group">
              <Card className="shadow-sm transition-transform duration-200 hover:scale-[1.02] hover:shadow-[var(--shadow-elegant)] hover:border-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold tracking-tight transition-colors group-hover:text-primary">{realMetrics.totalFranchises}</div>
                  <p className="mt-1 text-sm text-muted-foreground">Franquicias</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/properties" aria-label="Ver ciudades" className="block group">
              <Card className="shadow-sm transition-transform duration-200 hover:scale-[1.02] hover:shadow-[var(--shadow-elegant)] hover:border-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold tracking-tight transition-colors group-hover:text-primary">{realMetrics.totalCities}</div>
                  <p className="mt-1 text-sm text-muted-foreground">Ciudades</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/properties" aria-label="Ver ventas mensuales" className="block group">
              <Card className="shadow-sm transition-transform duration-200 hover:scale-[1.02] hover:shadow-[var(--shadow-elegant)] hover:border-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold tracking-tight transition-colors group-hover:text-primary">{realMetrics.monthlySales}+</div>
                  <p className="mt-1 text-sm text-muted-foreground">Venta / Alquiler</p>
                </CardContent>
              </Card>
            </Link>
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
