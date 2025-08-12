import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/PropertyCard";
import { supabase } from "@/integrations/supabase/client";

// SEO helper (scoped to this page)
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

interface Property {
  id: string;
  title: string;
  price: number | null;
  image_urls: string[] | null;
  bedrooms?: number | null;
  address?: string | null;
  property_type?: string | null;
}

export default function PropertiesPage() {
  usePageSEO({
    title: "Propiedades en Venta y Alquiler | DOMINIO",
    description: "Explora propiedades aprobadas por DOMINIO. Filtra por precio, habitaciones, tipo y más.",
    canonicalPath: "/properties",
  });

  const [city, setCity] = useState("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [bedrooms, setBedrooms] = useState<string>("");
  const [propertyType, setPropertyType] = useState<string>("");
  const [lifestyle, setLifestyle] = useState<string>("");

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Build a simple key for memoization of query deps
  const filterKey = useMemo(
    () => [city, priceMin, priceMax, bedrooms, propertyType, lifestyle].join("|"),
    [city, priceMin, priceMax, bedrooms, propertyType, lifestyle]
  );

  useEffect(() => {
    let active = true;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from("properties")
          .select("id,title,price,image_urls,bedrooms,address,property_type", { count: "exact" })
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(60);

        if (city.trim()) {
          query = query.ilike("address", `%${city.trim()}%`);
        }
        if (priceMin.trim() && !isNaN(Number(priceMin))) {
          query = query.gte("price", Number(priceMin));
        }
        if (priceMax.trim() && !isNaN(Number(priceMax))) {
          query = query.lte("price", Number(priceMax));
        }
        if (bedrooms.trim() && !isNaN(Number(bedrooms))) {
          query = query.gte("bedrooms", Number(bedrooms));
        }
        if (propertyType) {
          query = query.eq("property_type", propertyType);
        }
        if (lifestyle.trim()) {
          // Use FTS column for lifestyle search
          query = query.textSearch("fts_column", lifestyle.trim(), { type: "websearch", config: "spanish" });
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!active) return;
        setProperties((data as Property[]) ?? []);
      } catch (e: any) {
        console.error("Error loading properties", e);
        if (!active) return;
        setError("No se pudieron cargar las propiedades.");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();
    return () => {
      active = false;
    };
  }, [filterKey]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <main className="container mx-auto py-10 animate-fade-in">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Busca tu próximo hogar</h1>
          <p className="mt-2 text-muted-foreground">
            Filtra por ciudad, presupuesto, habitaciones y más. Todas las propiedades están verificadas por DOMINIO.
          </p>
        </header>

        {/* Filters */}
        <section aria-labelledby="filters-heading" className="mb-8">
          <h2 id="filters-heading" className="sr-only">Filtros</h2>
          <Card className="shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="city">Ciudad / Zona</Label>
                  <Input id="city" placeholder="Ej. La Paz, Equipetrol" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="priceMin">Precio mín.</Label>
                  <Input id="priceMin" type="number" min={0} placeholder="0" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="priceMax">Precio máx.</Label>
                  <Input id="priceMax" type="number" min={0} placeholder="500000" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="bedrooms">Habitaciones</Label>
                  <Input id="bedrooms" type="number" min={0} placeholder="2" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
                </div>

                <div>
                  <Label>Tipo</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="house">Casa</SelectItem>
                      <SelectItem value="apartment">Departamento</SelectItem>
                      <SelectItem value="land">Terreno</SelectItem>
                      <SelectItem value="office">Oficina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-3">
                  <Label htmlFor="lifestyle">Búsqueda AURA (estilo de vida)</Label>
                  <Input
                    id="lifestyle"
                    placeholder="Ej. cerca de parques, zona tranquila, coworking..."
                    value={lifestyle}
                    onChange={(e) => setLifestyle(e.target.value)}
                  />
                </div>

                <div className="self-end">
                  <Button type="button" variant="ghost" onClick={() => {
                    setCity("");
                    setPriceMin("");
                    setPriceMax("");
                    setBedrooms("");
                    setPropertyType("");
                    setLifestyle("");
                  }}>Limpiar filtros</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Results */}
        <section aria-labelledby="results-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="results-heading" className="text-xl font-semibold">Resultados</h2>
            <div className="text-sm text-muted-foreground">
              {loading ? "Cargando..." : `${properties.length} propiedades`}
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-4 text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>

          {!loading && properties.length === 0 && (
            <p className="mt-6 text-muted-foreground">No encontramos propiedades con esos filtros. Intenta ajustar los criterios.</p>
          )}
        </section>
      </main>
    </div>
  );
}
