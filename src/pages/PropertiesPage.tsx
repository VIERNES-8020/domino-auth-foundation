import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/PropertyCard";
import PropertiesMap from "@/components/PropertiesMap";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { LocateFixed } from "lucide-react";

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
  price_currency?: string | null;
  image_urls: string[] | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_m2?: number | null;
  address?: string | null;
  property_type?: string | null;
  geolocation?: any;
}

export default function PropertiesPage() {
  usePageSEO({
    title: "Propiedades en Venta y Alquiler | DOMINIO",
    description: "Explora propiedades aprobadas por DOMINIO. Filtra por precio, habitaciones, tipo y más.",
    canonicalPath: "/properties",
  });

  const sb = getSupabaseClient();

  const [city, setCity] = useState("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [bedrooms, setBedrooms] = useState<string>("");
  const [bathrooms, setBathrooms] = useState<string>("");
  const [propertyType, setPropertyType] = useState<string>("");
  const [lifestyle, setLifestyle] = useState<string>("");
  const [amenities, setAmenities] = useState<{ id: string; name: string }[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [suggestedCity, setSuggestedCity] = useState<string | null>(null);
const [favIds, setFavIds] = useState<Set<string>>(new Set());
const [usingNearMe, setUsingNearMe] = useState(false);
const [nearMeLoading, setNearMeLoading] = useState(false);
const [nearMeCenter, setNearMeCenter] = useState<{ lng: number; lat: number } | null>(null);

  // Build a simple key for memoization of query deps
  const filterKey = useMemo(
    () => [city, priceMin, priceMax, bedrooms, bathrooms, propertyType, lifestyle, selectedAmenities.sort().join(",")].join("|"),
    [city, priceMin, priceMax, bedrooms, bathrooms, propertyType, lifestyle, selectedAmenities]
  );

  const markers = useMemo(() => {
    const list: { id: string; lng: number; lat: number; title?: string; label?: string }[] = [];
    for (const p of properties) {
      const g: any = (p as any).geolocation;
      const c = g?.coordinates || g?.geom?.coordinates;
      if (Array.isArray(c) && c.length >= 2) {
        // Abbreviated price label: e.g., 144K USD
        const cur = (p.price_currency || "USD").toUpperCase();
        const priceNum = typeof p.price === "number" ? p.price : null;
        const abbr = priceNum === null ? "—" :
          priceNum >= 1_000_000 ? `${(priceNum / 1_000_000).toFixed(1).replace(/\.0$/, '')}M` :
          priceNum >= 1_000 ? `${(priceNum / 1_000).toFixed(0)}K` : `${priceNum}`;
        const label = priceNum === null ? "Consultar" : `${abbr} ${cur}`;
        list.push({ id: p.id, lng: c[0], lat: c[1], title: p.title, label });
      }
    }
    return list;
  }, [properties]);

  // Load amenities once
  useEffect(() => {
    let cancelled = false;
    async function loadAmenities() {
      const { data, error } = await sb.from("amenities").select("id,name").order("name", { ascending: true });
      if (!cancelled && !error) setAmenities(data ?? []);
    }
    loadAmenities();
    return () => {
      cancelled = true;
    };
  }, []);

  // Mapbox token and geolocation suggestion + favorites
  useEffect(() => {
    (async () => {
      try {
        const { data } = await sb.functions.invoke("mapbox-public-token");
        const t = (data as any)?.token as string | undefined;
        if (t) setMapToken(t);
      } catch (_) { /* noop */ }
    })();
  }, [sb]);

  useEffect(() => {
    if (!mapToken || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=place&language=es&access_token=${mapToken}`);
        const j = await res.json();
        const place = j?.features?.[0]?.text;
        if (place) setSuggestedCity(place);
      } catch (_) { /* noop */ }
    });
  }, [mapToken]);

  useEffect(() => {
    (async () => {
      const { data: auth } = await sb.auth.getUser();
      const user = auth?.user;
      if (!user) return;
      const { data } = await sb.from("favorites").select("property_id");
      const ids = new Set<string>((data ?? []).map((r: any) => r.property_id));
      setFavIds(ids);
    })();
  }, [sb]);

  // Buscar por ubicación actual (GPS)
  const handleNearMeClick = () => {
    if (!("geolocation" in navigator)) {
      toast.message("Tu navegador no soporta geolocalización");
      return;
    }
    setNearMeLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          setUsingNearMe(true);
          setLoading(true);
          const { data, error } = await sb.rpc("properties_nearby", {
            lon: longitude,
            lat: latitude,
            radius_km: 5,
          });
          if (error) throw error;
          setProperties((data as Property[]) ?? []);
          setNearMeCenter({ lng: longitude, lat: latitude });
          setError(null);
        } catch (e) {
          console.error("Geolocalización: error al buscar cercanas", e);
          toast.message("No se pudo obtener propiedades cercanas.");
          setUsingNearMe(false);
        } finally {
          setNearMeLoading(false);
          setLoading(false);
        }
      },
      (err) => {
        console.error("Geolocalización: permiso denegado o error", err);
        toast.message("No pudimos acceder a tu ubicación.");
        setNearMeLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Load properties when filters change
  useEffect(() => {
    let active = true;
    if (usingNearMe) {
      return () => { active = false }; 
    }
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // If filtering by amenities, compute matching property ids first
        let amenityPropertyIds: string[] | null = null;
        if (selectedAmenities.length > 0) {
          const { data: pa, error: paError } = await sb
            .from("property_amenities")
            .select("property_id, amenity_id")
            .in("amenity_id", selectedAmenities);
          if (paError) throw paError;

          const counts = new Map<string, number>();
          (pa ?? []).forEach((row: any) => {
            counts.set(row.property_id, (counts.get(row.property_id) ?? 0) + 1);
          });
          amenityPropertyIds = Array.from(counts.entries())
            .filter(([, count]) => count >= selectedAmenities.length)
            .map(([id]) => id);

          if ((amenityPropertyIds?.length ?? 0) === 0) {
            if (!active) return;
            setProperties([]);
            setLoading(false);
            return;
          }
        }

        let query = sb
          .from("properties")
          .select("id,title,price,price_currency,image_urls,bedrooms,bathrooms,area_m2,address,property_type,geolocation", { count: "exact" })
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(60);

        if (amenityPropertyIds && amenityPropertyIds.length > 0) {
          query = query.in("id", amenityPropertyIds);
        }

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
        if (bathrooms.trim() && !isNaN(Number(bathrooms))) {
          query = query.gte("bathrooms", Number(bathrooms));
        }
        if (propertyType) {
          query = query.eq("property_type", propertyType);
        }
        if (lifestyle.trim()) {
          const term = lifestyle.trim();
          // Use broad search across key text fields (stable fallback)
          query = query.or(
            `title.ilike.%${term}%,description.ilike.%${term}%,address.ilike.%${term}%`
          );
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
  }, [filterKey, usingNearMe]);

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
          <Card className="shadow-sm" role="region" aria-labelledby="filters-heading">
            <CardContent className="p-4 md:p-6" aria-live="polite">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="city">Ciudad / Zona</Label>
                  <Input id="city" placeholder="Ej. La Paz, Equipetrol" value={city} onChange={(e) => setCity(e.target.value)} aria-describedby="results-heading" />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleNearMeClick}
                    disabled={nearMeLoading}
                    aria-label="Buscar propiedades cerca de mi ubicación"
                  >
                    <LocateFixed className="mr-2 h-4 w-4" /> {nearMeLoading ? "Buscando..." : "Buscar cerca de mí"}
                  </Button>
                </div>
                <div>
                  <Label htmlFor="priceMin">Precio mín.</Label>
                  <Input id="priceMin" type="number" min={0} placeholder="0" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} inputMode="numeric" />
                </div>
                <div>
                  <Label htmlFor="priceMax">Precio máx.</Label>
                  <Input id="priceMax" type="number" min={0} placeholder="500000" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} inputMode="numeric" />
                </div>

                <div>
                  <Label htmlFor="bedrooms">Habitaciones</Label>
                  <Input id="bedrooms" type="number" min={0} placeholder="2" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="bathrooms">Baños</Label>
                  <Input id="bathrooms" type="number" min={0} placeholder="1" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
                </div>

                <div>
                  <Label>Tipo</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="departamento">Departamento</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                      <SelectItem value="oficina">Oficina</SelectItem>
                      <SelectItem value="local_comercial">Local Comercial</SelectItem>
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

                <div className="md:col-span-6">
                  <Label>Amenidades</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {amenities.map((a) => {
                      const selected = selectedAmenities.includes(a.id);
                      return (
                        <Button
                          key={a.id}
                          type="button"
                          size="sm"
                          variant={selected ? "default" : "outline"}
                          onClick={() =>
                            setSelectedAmenities((prev) =>
                              selected ? prev.filter((id) => id !== a.id) : [...prev, a.id]
                            )
                          }
                        >
                          {a.name}
                        </Button>
                      );
                    })}
                    {amenities.length === 0 && (
                      <span className="text-sm text-muted-foreground">Cargando amenidades...</span>
                    )}
                  </div>
                </div>

                <div className="self-end">
                  <Button 
                    type="button" 
                    onClick={() => {
                      // The search is already reactive - filters update automatically
                      toast.success("Búsqueda actualizada con nuevos filtros");
                    }}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Buscar
                  </Button>
                </div>
                <div className="self-end">
                  <Button type="button" variant="ghost" onClick={() => {
                    setCity("");
                    setPriceMin("");
                    setPriceMax("");
                    setBedrooms("");
                    setBathrooms("");
                    setPropertyType("");
                    setLifestyle("");
                    setSelectedAmenities([]);
                    setUsingNearMe(false);
                    setNearMeCenter(null);
                  }}>Limpiar filtros</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Map */}
        {mapToken && (
          <section aria-labelledby="map-heading" className="mb-8">
            <h2 id="map-heading" className="text-xl font-semibold mb-3">Mapa de resultados</h2>
            <PropertiesMap token={mapToken} markers={markers} defaultCenter={nearMeCenter ?? undefined} className="w-full h-80 rounded-lg overflow-hidden" />
          </section>
        )}
        {/* Results */}
        <section aria-labelledby="results-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="results-heading" className="text-xl font-semibold">Resultados</h2>
            <div className="text-sm text-muted-foreground">
              {loading ? "Cargando propiedades..." : `${properties.length} propiedades`}
            </div>
          </div>
          {suggestedCity && !city && (
            <div className="mb-4 rounded-md border p-3 text-sm flex items-center justify-between">
              <span>¿Quieres ver propiedades en {suggestedCity}?</span>
              <Button size="sm" onClick={() => setCity(suggestedCity!)}>Sí, mostrar</Button>
            </div>
          )}

          {error && (
            <div role="alert" className="mb-4 text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} isFavorited={favIds.has(p.id)} onToggleFavorite={async (id, next) => {
                const { data: auth } = await sb.auth.getUser();
                const user = auth?.user;
                if (!user) { toast.message("Inicia sesión para guardar favoritos"); return; }
                if (next) {
                  const { error } = await sb.from("favorites").insert({ user_id: user.id, property_id: id });
                  if (!error) setFavIds((prev) => new Set(prev).add(id));
                } else {
                  const { error } = await sb.from("favorites").delete().eq("user_id", user.id).eq("property_id", id);
                  if (!error) setFavIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
                }
              }} />
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
