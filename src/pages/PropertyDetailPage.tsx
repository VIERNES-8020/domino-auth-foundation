import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Map from "@/components/Map";
import { BedDouble, Bath, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PropertyRow {
  id: string;
  title: string;
  address: string | null;
  price: number | null;
  price_currency: string | null;
  description: string | null;
  image_urls: string[] | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_m2: number | null;
  video_url: string | null;
  plans_url: string[] | null;
  geolocation: any;
  agent_id: string;
}

interface Amenity { id: string; name: string; icon_svg?: string | null }

function usePageSEO(options: { title: string; description: string; canonicalPath: string }) {
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

    const canonicalUrl = new URL(canonicalPath, window.location.origin).toString();
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);
  }, [title, description, canonicalPath]);
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  

  const [property, setProperty] = useState<PropertyRow | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [mapToken, setMapToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadToken() {
      try {
        const { data, error } = await supabase.functions.invoke("mapbox-public-token");
        if (!cancelled) {
          if (!error && (data as any)?.token) setMapToken((data as any).token as string);
          else setMapToken(undefined);
        }
      } catch (_) {
        if (!cancelled) setMapToken(undefined);
      }
    }
    loadToken();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!id) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: prop, error: propErr } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
        if (propErr) throw propErr;
        if (!active) return;
        setProperty(prop as PropertyRow);

        // load amenities
        const { data: pa, error: paErr } = await supabase
          .from("property_amenities")
          .select("amenity_id")
          .eq("property_id", id);
        if (paErr) throw paErr;
        const ids = (pa ?? []).map((r: any) => r.amenity_id);
        if (ids.length > 0) {
          const { data: ams } = await supabase.from("amenities").select("id,name,icon_svg").in("id", ids);
          if (!active) return;
          setAmenities((ams as Amenity[]) ?? []);
        } else {
          setAmenities([]);
        }
      } catch (e: any) {
        console.error(e);
        if (!active) return;
        setError("No se pudo cargar la propiedad.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [id]);

  usePageSEO({
    title: property?.title ? `${property.title} | DOMINIO` : "Detalle de Propiedad | DOMINIO",
    description: property?.description?.slice(0, 150) ?? "Explora detalles de la propiedad en DOMINIO.",
    canonicalPath: `/properties/${id ?? ""}`,
  });

  const images = property?.image_urls ?? [];
  const priceStr = useMemo(() => {
    if (!property?.price) return "Precio a consultar";
    const currency = (property.price_currency || "USD").toUpperCase();
    const prefix = currency === "USD" ? "US$" : `${currency} `;
    return `${prefix}${property.price.toLocaleString()}`;
  }, [property]);

  // Try to extract coordinates from a PostGIS GeoJSON response
  const coords = useMemo(() => {
    const g = property?.geolocation as any;
    if (g && typeof g === "object") {
      const c = (g.coordinates || g?.geom?.coordinates) as [number, number] | undefined;
      if (Array.isArray(c) && c.length >= 2) return { lng: c[0], lat: c[1] };
    }
    return null;
  }, [property]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <main className="container mx-auto py-8">
        {loading && <p className="text-muted-foreground">Cargando propiedad...</p>}
        {error && <p className="text-destructive">{error}</p>}
        {!loading && !property && !error && (
          <p className="text-muted-foreground">No encontramos esta propiedad.</p>
        )}

        {property && (
          <div className="space-y-8">
            {/* Gallery */}
            <section>
              {images.length > 0 ? (
                <Carousel>
                  <CarouselContent>
                    {images.map((src, idx) => (
                      <CarouselItem key={idx} className="basis-full">
                        <AspectRatio ratio={16 / 9}>
                          <img
                            src={src || "/default-placeholder.jpg"}
                            alt={`Imagen ${idx + 1} de ${property.title}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const el = e.currentTarget as HTMLImageElement;
                              if (el.src !== window.location.origin + "/default-placeholder.jpg") {
                                el.src = "/default-placeholder.jpg";
                              }
                            }}
                          />
                        </AspectRatio>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              ) : (
                <AspectRatio ratio={16 / 9}>
                  <img
                    src="/default-placeholder.jpg"
                    alt="Sin imagen disponible"
                    className="h-full w-full object-cover"
                  />
                </AspectRatio>
              )}
            </section>

            {/* Main info */}
            <section>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{property.title}</h1>
              <p className="mt-1 text-muted-foreground">{property.address}</p>
              <p className="mt-2 text-xl font-semibold">{priceStr}</p>

              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                {typeof property.bedrooms === "number" && (
                  <span className="inline-flex items-center gap-2"><BedDouble size={18} /> {property.bedrooms} hab.</span>
                )}
                {typeof property.bathrooms === "number" && (
                  <span className="inline-flex items-center gap-2"><Bath size={18} /> {property.bathrooms} baños</span>
                )}
                {typeof property.area_m2 === "number" && (
                  <span className="inline-flex items-center gap-2"><Ruler size={18} /> {property.area_m2} m²</span>
                )}
              </div>
            </section>

            <Separator />

            {/* Description */}
            {property.description && (
              <section>
                <h2 className="text-xl font-semibold mb-2">Descripción</h2>
                <Card>
                  <CardContent className="p-4">
                    <p className="whitespace-pre-line leading-relaxed">{property.description}</p>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-2">Amenidades</h2>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <Badge key={a.id} variant="secondary">{a.name}</Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Map */}
            {coords && (
              <section>
                <h2 className="text-xl font-semibold mb-2">Ubicación</h2>
                <Map token={undefined /* Configure token via secrets */} lng={coords.lng} lat={coords.lat} />
                <p className="mt-2 text-xs text-muted-foreground">El mapa se mostrará cuando se configure el token público de Mapbox.</p>
              </section>
            )}

            {/* Video */}
            {property.video_url && (
              <section>
                <h2 className="text-xl font-semibold mb-2">Video</h2>
                {/(youtube\.com|youtu\.be)/i.test(property.video_url) ? (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      className="w-full h-full"
                      src={property.video_url.replace("watch?v=", "embed/")}
                      title="Video de la propiedad"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a className="underline" href={property.video_url} target="_blank" rel="noreferrer">
                    Ver video
                  </a>
                )}
              </section>
            )}

            {/* Plans */}
            {Array.isArray(property.plans_url) && property.plans_url.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-2">Planos</h2>
                <ul className="list-disc pl-5 space-y-1">
                  {property.plans_url.map((u, i) => (
                    <li key={i}><a className="underline" href={u} target="_blank" rel="noreferrer">Plano {i + 1}</a></li>
                  ))}
                </ul>
              </section>
            )}

            {/* Contact form */}
            <section>
              <h2 className="text-xl font-semibold mb-2">Contactar al agente</h2>
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get("name") as string;
                  const email = formData.get("email") as string;
                  const phone = formData.get("phone") as string;
                  const message = formData.get("message") as string;
                  
                  try {
                    const { error } = await supabase.functions.invoke("agent-contact", {
                      body: {
                        agentId: property.agent_id,
                        propertyId: property.id,
                        clientName: name,
                        clientEmail: email,
                        clientPhone: phone,
                        message: message
                      }
                    });
                    
                    if (error) throw error;
                    toast.success("¡Mensaje enviado exitosamente! El agente se pondrá en contacto contigo pronto.");
                    (e.target as HTMLFormElement).reset();
                  } catch (error) {
                    console.error("Error sending message:", error);
                    toast.error("Error al enviar el mensaje. Inténtalo de nuevo.");
                  }
                }}
              >
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" required placeholder="Tu nombre" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required placeholder="tu@correo.com" />
                </div>
                <div>
                  <Label htmlFor="phone">Número de Celular</Label>
                  <Input id="phone" name="phone" placeholder="+591 70000000" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="message">Mensaje</Label>
                  <Textarea id="message" name="message" required placeholder="Estoy interesado/a en esta propiedad..." />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit">Enviar mensaje</Button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
