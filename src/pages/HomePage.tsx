import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from "sonner";
import heroImage from "@/assets/cover.jpg";

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

const supabase = getSupabaseClient();

interface Property {
  id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  image_urls?: string[] | null;
  status?: string | null;
}

export default function HomePage() {
  usePageSEO({
    title: "Búsqueda por Estilo de Vida | Inmobiliaria DOMIN10",
    description: "Encuentra propiedades por estilo de vida con AURA: busca cerca de parques, cafés y más.",
    canonicalPath: "/",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("properties")
      .select("id, title, price, image_urls, status")
      .textSearch("fts_column", q, { type: "websearch", config: "spanish" })
      .eq("status", "approved");

    if (error) {
      toast.error("No se pudo realizar la búsqueda", { description: error.message });
      setLoading(false);
      return;
    }

    setResults((data ?? []) as Property[]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <header className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={heroImage}
            alt="Portada Inmobiliaria DOMIN10 mostrando un estilo de vida urbano confortable"
            className="h-[60vh] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 to-background" />
        </div>
        <div className="relative container mx-auto flex min-h-[60vh] flex-col items-center justify-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Encuentra más que una casa, descubre tu hogar
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Dile a AURA qué estás buscando. Sé tan específico como quieras.
          </p>
          <form onSubmit={handleSearch} className="mt-8 w-full max-w-2xl">
            <div className="flex gap-3">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ej: cerca de parques y cafés, ideal para teletrabajo"
                aria-label="Búsqueda por estilo de vida"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Buscando…" : "Buscar"}
              </Button>
            </div>
          </form>
        </div>
      </header>

      <main className="container mx-auto py-12">
        <section aria-labelledby="results-title">
          <h2 id="results-title" className="text-2xl font-semibold tracking-tight">
            Resultados de la búsqueda
          </h2>
          {results.length === 0 ? (
            <p className="mt-3 text-muted-foreground">No hay resultados aún. Prueba una búsqueda de estilo de vida.</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((p) => (
                <Card key={p.id} className="overflow-hidden shadow-sm">
                  <AspectRatio ratio={16 / 9}>
                    <img
                      src={p.image_urls?.[0] || "/placeholder.svg"}
                      alt={`Propiedad: ${p.title} — Inmobiliaria DOMIN10`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </AspectRatio>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1">{p.title}</h3>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium">{typeof p.price === "number" ? `$${p.price.toLocaleString()}` : "Precio a consultar"}</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">Match Score AURA — próximamente</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
