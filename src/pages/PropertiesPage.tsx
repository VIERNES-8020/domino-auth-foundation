import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/PropertyCard";
import PropertiesMap from "@/components/PropertiesMap";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LocateFixed, Phone, Mail } from "lucide-react";
import { boliviaDepartments } from "@/data/bolivia-locations";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
  
  usePageSEO({
    title: `${t('properties.title')} | DOMINIO`,
    description: t('properties.subtitle'),
    canonicalPath: "/properties",
  });

  

  const [city, setCity] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [bedrooms, setBedrooms] = useState<string>("");
  const [bathrooms, setBathrooms] = useState<string>("");
  const [propertyType, setPropertyType] = useState<string>("");
  const [lifestyle, setLifestyle] = useState<string>("");
  const [amenities, setAmenities] = useState<{ id: string; name: string }[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [transactionType, setTransactionType] = useState<string>("");

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
    () => [city, selectedDepartment, selectedProvince, selectedZone, priceMin, priceMax, bedrooms, bathrooms, propertyType, lifestyle, selectedAmenities.sort().join(","), transactionType].join("|"),
    [city, selectedDepartment, selectedProvince, selectedZone, priceMin, priceMax, bedrooms, bathrooms, propertyType, lifestyle, selectedAmenities, transactionType]
  );

  const markers = useMemo(() => {
    const list: { id: string; lng: number; lat: number; title?: string; label?: string; propertyType?: string }[] = [];

    // Helper: parse WKB hex (SRID 4326 Point) to [lng, lat]
    const parseWKBHex = (hex: string): number[] | null => {
      try {
        if (hex.length < 42) return null;
        const buf = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) buf[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        const dv = new DataView(buf.buffer);
        const le = buf[0] === 1; // little-endian
        // Offset depends on whether SRID flag is set (type bytes at offset 1)
        const typeVal = le ? dv.getUint32(1, true) : dv.getUint32(1, false);
        const hasSRID = (typeVal & 0x20000000) !== 0;
        const coordOffset = hasSRID ? 9 : 5; // 4 extra bytes for SRID
        const lng = dv.getFloat64(coordOffset, le);
        const lat = dv.getFloat64(coordOffset + 8, le);
        if (isFinite(lng) && isFinite(lat)) return [lng, lat];
      } catch { /* skip */ }
      return null;
    };

    for (const p of properties) {
      const g: any = (p as any).geolocation;
      let coordinates: number[] | null = null;
      
      if (g) {
        if (typeof g === 'string') {
          // Try WKT format "POINT(-63.123 -17.456)"
          const match = g.match(/POINT\(([^)]+)\)/);
          if (match) {
            const coords = match[1].split(' ').map(Number);
            if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              coordinates = coords;
            }
          }
          // Try WKB hex format
          if (!coordinates && /^[0-9a-fA-F]+$/.test(g)) {
            coordinates = parseWKBHex(g);
          }
        } else if (g.coordinates && Array.isArray(g.coordinates)) {
          coordinates = g.coordinates;
        } else if (g.geom?.coordinates && Array.isArray(g.geom.coordinates)) {
          coordinates = g.geom.coordinates;
        }
      }
      
      if (coordinates && coordinates.length >= 2 && 
          typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
        const cur = (p.price_currency || "USD").toUpperCase();
        const priceNum = typeof p.price === "number" ? p.price : null;
        const abbr = priceNum === null ? "—" :
          priceNum >= 1_000_000 ? `${(priceNum / 1_000_000).toFixed(1).replace(/\.0$/, '')}M` :
          priceNum >= 1_000 ? `${(priceNum / 1_000).toFixed(0)}K` : `${priceNum}`;
        const label = priceNum === null ? "Consultar" : `${abbr} ${cur}`;
        list.push({ id: p.id, lng: coordinates[0], lat: coordinates[1], title: p.title, label, propertyType: p.property_type || undefined });
      }
    }
    return list;
  }, [properties]);

  // Load amenities once
  useEffect(() => {
    let cancelled = false;
    async function loadAmenities() {
      const { data, error } = await supabase.from("amenities").select("id,name").order("name", { ascending: true });
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
        const { data } = await supabase.functions.invoke("mapbox-public-token");
        const t = (data as any)?.token as string | undefined;
        if (t) setMapToken(t);
      } catch (_) { /* noop */ }
    })();
  }, []);

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
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;
      const { data } = await supabase.from("favorites").select("property_id");
      const ids = new Set<string>((data ?? []).map((r: any) => r.property_id));
      setFavIds(ids);
    })();
  }, []);

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
          
          // Get nearby properties first
          const { data: nearbyData, error: nearbyError } = await supabase.rpc("properties_nearby", {
            lon: longitude,
            lat: latitude,
            radius_km: 5,
          });
          if (nearbyError) throw nearbyError;
          
          let filteredProperties = (nearbyData as Property[]) ?? [];
          
          // Apply current filters to nearby results
          if (transactionType) {
            filteredProperties = filteredProperties.filter(p => (p as any).transaction_type === transactionType);
          }
          if (propertyType) {
            filteredProperties = filteredProperties.filter(p => p.property_type === propertyType);
          }
          if (priceMin.trim() && !isNaN(Number(priceMin))) {
            filteredProperties = filteredProperties.filter(p => (p.price ?? 0) >= Number(priceMin));
          }
          if (priceMax.trim() && !isNaN(Number(priceMax))) {
            filteredProperties = filteredProperties.filter(p => (p.price ?? 0) <= Number(priceMax));
          }
          if (bedrooms.trim() && !isNaN(Number(bedrooms))) {
            filteredProperties = filteredProperties.filter(p => (p.bedrooms ?? 0) >= Number(bedrooms));
          }
          if (bathrooms.trim() && !isNaN(Number(bathrooms))) {
            filteredProperties = filteredProperties.filter(p => (p.bathrooms ?? 0) >= Number(bathrooms));
          }
          
          setProperties(filteredProperties);
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
          const { data: pa, error: paError } = await supabase
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

        let query = supabase
          .from("properties")
          .select("id,title,price,price_currency,image_urls,bedrooms,bathrooms,area_m2,address,property_type,property_code,geolocation", { count: "exact" })
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(60);

        if (amenityPropertyIds && amenityPropertyIds.length > 0) {
          query = query.in("id", amenityPropertyIds);
        }

        if (city.trim()) {
          query = query.ilike("address", `%${city.trim()}%`);
        }
        if (selectedDepartment) {
          const dept = boliviaDepartments.find(d => d.id === selectedDepartment);
          if (dept) {
            query = query.ilike("address", `%${dept.name}%`);
          }
        }
        if (selectedProvince) {
          const dept = boliviaDepartments.find(d => d.id === selectedDepartment);
          const province = dept?.provinces.find(p => p.id === selectedProvince);
          if (province) {
            query = query.ilike("address", `%${province.name}%`);
          }
        }
        if (selectedZone) {
          query = query.ilike("address", `%${selectedZone}%`);
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
        if (transactionType) {
          query = query.eq("transaction_type", transactionType);
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
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('properties.title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('properties.subtitle')}
          </p>
          </header>

        {/* Filters */}
        <section aria-labelledby="filters-heading" className="mb-8">
          <h2 id="filters-heading" className="sr-only">{t('properties.filters')}</h2>
          <Card className="shadow-sm" role="region" aria-labelledby="filters-heading">
            <CardContent className="p-4 md:p-6" aria-live="polite">
              {/* Transaction Type Filters */}
              <div className="mb-6">
                <Label className="text-base font-semibold">{t('properties.transactionType')}</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { value: "", label: t('properties.all') },
                    { value: "venta", label: t('properties.sale') },
                    { value: "alquiler", label: t('properties.rent') },
                    { value: "anticretico", label: t('properties.anticretico') }
                  ].map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={transactionType === option.value ? "default" : "outline"}
                      onClick={() => setTransactionType(option.value)}
                      className={transactionType === option.value ? "bg-primary hover:bg-primary/90 text-white" : ""}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <Label>{t('properties.department')}</Label>
                  <Select value={selectedDepartment || "all"} onValueChange={(value) => {
                    setSelectedDepartment(value === "all" ? "" : value);
                    setSelectedProvince(""); // Reset province when department changes
                    setSelectedZone(""); // Reset zone when department changes
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('properties.selectDepartment')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('properties.allDepartments')}</SelectItem>
                      {boliviaDepartments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label>{t('properties.province')}</Label>
                  <Select 
                    value={selectedProvince || "all"} 
                    onValueChange={(value) => {
                      setSelectedProvince(value === "all" ? "" : value);
                      setSelectedZone(""); // Reset zone when province changes
                    }}
                    disabled={!selectedDepartment}
                  >
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={selectedDepartment ? t('properties.selectProvince') : t('properties.selectDepartment')} 
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('properties.allProvinces')}</SelectItem>
                      {selectedDepartment && 
                        boliviaDepartments
                          .find(d => d.id === selectedDepartment)
                          ?.provinces.map((province) => (
                            <SelectItem key={province.id} value={province.id}>
                              {province.name}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label>{t('properties.specificZone')}</Label>
                  <Select 
                    value={selectedZone || "all"} 
                    onValueChange={(value) => setSelectedZone(value === "all" ? "" : value)}
                    disabled={!selectedProvince}
                  >
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={selectedProvince ? t('properties.selectProvince') : t('properties.selectDepartment')} 
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('properties.allZones')}</SelectItem>
                      {/* Zonas comunes de Bolivia */}
                      {selectedProvince && [
                        "Centro", "Norte", "Sur", "Este", "Oeste",
                        "Zona Central", "Zona Norte", "Zona Sur", "Zona Este", "Zona Oeste",
                        "Equipetrol", "Las Palmas", "Radial 10", "Radial 26", "4to Anillo",
                        "Calacoto", "San Miguel", "Sopocachi", "Miraflores", "Achumani"
                      ].map((zone) => (
                        <SelectItem key={zone} value={zone.toLowerCase()}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priceMin">{t('properties.minPrice')}</Label>
                  <Input id="priceMin" type="number" min={0} placeholder="0" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} inputMode="numeric" />
                </div>
                <div>
                  <Label htmlFor="priceMax">{t('properties.maxPrice')}</Label>
                  <Input id="priceMax" type="number" min={0} placeholder="500000" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} inputMode="numeric" />
                </div>

                <div>
                  <Label htmlFor="bedrooms">{t('properties.bedrooms')}</Label>
                  <Input id="bedrooms" type="number" min={0} placeholder="2" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="bathrooms">{t('properties.bathrooms')}</Label>
                  <Input id="bathrooms" type="number" min={0} placeholder="1" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
                </div>

                <div>
                  <Label>{t('properties.propertyType')}</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('properties.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casa">{t('properties.house')}</SelectItem>
                      <SelectItem value="departamento">{t('properties.apartment')}</SelectItem>
                      <SelectItem value="terreno">{t('properties.land')}</SelectItem>
                      <SelectItem value="oficina">{t('properties.office')}</SelectItem>
                      <SelectItem value="local_comercial">{t('properties.commercial')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="lifestyle">{t('properties.lifestyle')}</Label>
                  <Input
                    id="lifestyle"
                    placeholder={t('properties.lifestylePlaceholder')}
                    value={lifestyle}
                    onChange={(e) => setLifestyle(e.target.value)}
                  />
                </div>

                <div className="flex items-end md:col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleNearMeClick}
                    disabled={nearMeLoading}
                    aria-label={t('properties.searchNearMe')}
                    className="w-full whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4"
                  >
                    <LocateFixed className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{nearMeLoading ? t('properties.loading') : t('properties.searchNearMe')}</span>
                  </Button>
                </div>

                <div className="md:col-span-6">
                  <Label>{t('properties.amenities')}</Label>
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
                      <span className="text-sm text-muted-foreground">{t('properties.loading')}</span>
                    )}
                  </div>
                </div>

                <div className="self-end">
                  <Button 
                    type="button" 
                    onClick={() => {
                      // The search is already reactive - filters update automatically
                      toast.success(t('properties.loading'));
                    }}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {t('properties.search')}
                  </Button>
                </div>
                <div className="self-end">
                  <Button type="button" variant="ghost" onClick={() => {
                    setCity("");
                    setSelectedDepartment("");
                    setSelectedZone("");
                    setPriceMin("");
                    setPriceMax("");
                    setBedrooms("");
                    setBathrooms("");
                    setPropertyType("");
                    setLifestyle("");
                    setSelectedAmenities([]);
                    setTransactionType("");
                    setUsingNearMe(false);
                    setNearMeCenter(null);
                  }}>{t('properties.clearFilters')}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Map */}
        {mapToken && (
          <section aria-labelledby="map-heading" className="mb-8">
            <h2 id="map-heading" className="text-xl font-semibold mb-3">{t('properties.results')}</h2>
            <PropertiesMap token={mapToken} markers={markers} defaultCenter={nearMeCenter ?? undefined} className="w-full h-80 rounded-lg overflow-hidden" />
          </section>
        )}
        {/* Results */}
        <section aria-labelledby="results-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="results-heading" className="text-xl font-semibold">{t('properties.results')}</h2>
            <div className="text-sm text-muted-foreground">
              {loading ? t('properties.loading') : `${properties.length} ${t('properties.propertiesFound')}`}
            </div>
          </div>
          {suggestedCity && !city && (
            <div className="mb-4 rounded-md border p-3 text-sm flex items-center justify-between">
              <span>{t('properties.noResults')}</span>
              <Button size="sm" onClick={() => setCity(suggestedCity!)}>{t('properties.search')}</Button>
            </div>
          )}

          {error && (
            <div role="alert" className="mb-4 text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">A</span>
                  </div>
                  <span className="font-medium text-primary">AURA</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  {usingNearMe 
                    ? t('properties.noResults') 
                    : t('properties.noResults')
                  }
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('properties.tryDifferentFilters')}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = '/contacto'}
                    className="flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    {t('agents.contactNow')}
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/contacto'}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    {t('contact.send')}
                  </Button>
                </div>
                <Button 
                  className="mt-3 w-full" 
                  variant="outline"
                  onClick={() => {
                    // Clear some filters to show more results
                    setPriceMin("");
                    setPriceMax("");
                    setBedrooms("");
                    setBathrooms("");
                    setSelectedAmenities([]);
                    toast.success(t('properties.clearFilters'));
                  }}
                >
                  {t('properties.tryDifferentFilters')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} isFavorited={favIds.has(p.id)} onToggleFavorite={async (id, next) => {
                  const { data: auth } = await supabase.auth.getUser();
                  const user = auth?.user;
                  if (!user) { toast.message("Inicia sesión para guardar favoritos"); return; }
                  if (next) {
                    const { error } = await supabase.from("favorites").insert({ user_id: user.id, property_id: id });
                    if (!error) setFavIds((prev) => new Set(prev).add(id));
                  } else {
                    const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", id);
                    if (!error) setFavIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
                  }
                }} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
