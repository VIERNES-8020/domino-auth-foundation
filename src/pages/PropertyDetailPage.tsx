import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AgentSearchSelector } from "@/components/AgentSearchSelector";
import { SuccessConfirmationModal } from "@/components/SuccessConfirmationModal";
import Map from "@/components/Map";
import PropertyBookingCalendar from "@/components/PropertyBookingCalendar";
import PropertyReviewForm from "@/components/PropertyReviewForm";
import { BedDouble, Bath, Ruler, Star, Heart, ZoomIn, MapPin, ExternalLink, MessageSquare, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import WatermarkedImage from "@/components/WatermarkedImage";

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
  concluded_status: string | null;
  concluded_at: string | null;
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

interface Review {
  id: string;
  rating: number;
  comment: string;
  client_name: string;
  created_at: string;
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  const [property, setProperty] = useState<PropertyRow | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [mapToken, setMapToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showBookingCalendar, setShowBookingCalendar] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedAgentCode, setSelectedAgentCode] = useState<string>("");
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [showContactConfirmation, setShowContactConfirmation] = useState(false);

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

        // Load sample reviews
        const sampleReviews: Review[] = [
          {
            id: "1",
            rating: 5,
            comment: "Excelente propiedad, muy recomendada.",
            client_name: "María García",
            created_at: new Date().toISOString()
          },
          {
            id: "2", 
            rating: 4,
            comment: "Buena ubicación y precio justo.",
            client_name: "Carlos López", 
            created_at: new Date().toISOString()
          }
        ];
        setReviews(sampleReviews);

        // Load available agents
        const { data: agentsData, error: agentsError } = await supabase
          .from("profiles")
          .select("id, full_name, agent_code")
          .not("agent_code", "is", null)
          .order("full_name", { ascending: true });
        
        if (!agentsError && agentsData) {
          setAvailableAgents(agentsData);
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

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const formatVideoUrl = (url: string) => {
    if (/(youtube\.com|youtu\.be)/i.test(url)) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    return url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <main className="container mx-auto py-4 px-4">
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Cargando propiedad...</p>
            </div>
          </div>
        )}
        
        {error && (
          <Card className="p-8 text-center">
            <p className="text-destructive text-lg">{error}</p>
          </Card>
        )}
        
        {!loading && !property && !error && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground text-lg">No encontramos esta propiedad.</p>
          </Card>
        )}

        {property && (
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header with title and action buttons */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">{property.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{property.address}</span>
                </div>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(averageRating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm">({reviews.length} reseñas)</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="gap-2"
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? "fill-current text-red-500" : ""}`} />
                  {isFavorite ? "Guardado" : "Guardar"}
                </Button>
              </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Image gallery - Left side */}
              <div className="lg:col-span-2 space-y-6">
                {/* Main image carousel */}
                <div className="relative">
                  {images.length > 0 ? (
                    <Carousel className="w-full group">
                      <CarouselContent>
                        {images.map((src, idx) => (
                          <CarouselItem key={idx}>
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="relative cursor-pointer group/image">
                                  <AspectRatio ratio={16 / 10} className="rounded-xl overflow-hidden shadow-lg">
                                    <WatermarkedImage
                                      src={src || "/default-placeholder.jpg"}
                                      alt={`${property.title} - imagen ${idx + 1}`}
                                      className="h-full w-full object-cover transition-transform duration-300 group-hover/image:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center">
                                      <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover/image:opacity-100 transition-opacity" />
                                    </div>
                                  </AspectRatio>
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl p-0">
                                <img
                                  src={src}
                                  alt={`${property.title} - imagen ampliada ${idx + 1}`}
                                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                                />
                              </DialogContent>
                            </Dialog>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {images.length > 1 && (
                        <>
                          <CarouselPrevious className="left-4 bg-background/90 backdrop-blur-sm border-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <CarouselNext className="right-4 bg-background/90 backdrop-blur-sm border-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                      )}
                    </Carousel>
                  ) : (
                    <AspectRatio ratio={16 / 10} className="rounded-xl overflow-hidden shadow-lg bg-muted">
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Sin imágenes disponibles</p>
                      </div>
                    </AspectRatio>
                  )}
                </div>

                {/* Thumbnail grid */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {images.slice(1, 5).map((src, idx) => (
                      <Dialog key={idx}>
                         <DialogTrigger asChild>
                           <div className="aspect-square rounded-lg overflow-hidden cursor-pointer group shadow-sm border-0 hover:shadow-md transition-all duration-300">
                             <WatermarkedImage
                               src={src}
                               alt={`Vista ${idx + 2}`}
                               className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                             />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-0">
                          <img
                            src={src}
                            alt={`${property.title} - imagen ampliada ${idx + 2}`}
                            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                          />
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                )}
              </div>

              {/* Property info sidebar - Right side */}
              <div className="space-y-6">
                {/* Price and details card */}
                <Card className="p-6 shadow-lg border-2 border-primary/20 bg-gradient-to-br from-background to-secondary/30">
                  <div className="space-y-6">
                    {/* Price */}
                    <div className="text-center">
                      <p className="text-3xl md:text-4xl font-bold text-primary mb-2">
                        {priceStr}
                      </p>
                      {property.concluded_status ? (
                        <Badge variant="secondary" className="px-3 py-1 text-sm font-medium bg-orange-500 text-white">
                          {property.concluded_status === 'vendido' && 'VENDIDO ✓'}
                          {property.concluded_status === 'alquilado' && 'ALQUILADO ✓'}
                          {property.concluded_status === 'anticretico' && 'EN ANTICRÉTICO ✓'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                          Disponible
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    {/* Property specs */}
                    <div className="grid grid-cols-3 gap-4">
                      {typeof property.bedrooms === "number" && (
                        <div className="text-center p-3 rounded-lg bg-background/50">
                          <BedDouble size={28} className="mx-auto text-primary mb-2" />
                          <p className="text-2xl font-bold">{property.bedrooms}</p>
                          <p className="text-xs text-muted-foreground">Habitaciones</p>
                        </div>
                      )}
                      {typeof property.bathrooms === "number" && (
                        <div className="text-center p-3 rounded-lg bg-background/50">
                          <Bath size={28} className="mx-auto text-primary mb-2" />
                          <p className="text-2xl font-bold">{property.bathrooms}</p>
                          <p className="text-xs text-muted-foreground">Baños</p>
                        </div>
                      )}
                      {typeof property.area_m2 === "number" && (
                        <div className="text-center p-3 rounded-lg bg-background/50">
                          <Ruler size={28} className="mx-auto text-primary mb-2" />
                          <p className="text-2xl font-bold">{property.area_m2}</p>
                          <p className="text-xs text-muted-foreground">m²</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Quick contact */}
                <Card className="p-6">
                  {property.concluded_status ? (
                    <div className="text-center space-y-4">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h3 className="font-semibold text-orange-800 mb-2">
                          Propiedad Comercializada
                        </h3>
                        <p className="text-sm text-orange-700 leading-relaxed">
                          Esta propiedad ya fue comercializada. Te invitamos a poder solicitar un agente o ver las distintas propiedades disponibles.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          size="lg"
                          onClick={() => {
                            window.location.href = "/agentes";
                          }}
                        >
                          Solicitar un agente
                        </Button>
                        <Button 
                          variant="secondary" 
                          className="w-full" 
                          size="lg"
                          onClick={() => {
                            window.location.href = "/propiedades";
                          }}
                        >
                          Ver propiedades disponibles
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold mb-4">Contacto rápido</h3>
                      <div className="space-y-3">
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={() => {
                            document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          Solicitar información
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full gap-2" 
                          size="lg"
                          onClick={() => setShowBookingCalendar(true)}
                        >
                          <CalendarDays className="h-4 w-4" />
                          Agendar visita
                        </Button>
                      </div>
                    </>
                  )}
                </Card>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Description */}
            {property.description && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">Descripción</h2>
                <Card className="p-6">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                </Card>
              </section>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">Amenidades</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {amenities.map((amenity) => (
                    <Card key={amenity.id} className="p-4 text-center hover:shadow-md transition-shadow">
                      <Badge variant="secondary" className="w-full justify-center py-2">
                        {amenity.name}
                      </Badge>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Video section */}
            {property.video_url && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">Video</h2>
                <Card className="p-4">
                  {/(youtube\.com|youtu\.be|vimeo\.com)/i.test(property.video_url) ? (
                    <div className="max-w-2xl mx-auto">
                      <AspectRatio ratio={16 / 9} className="rounded-lg overflow-hidden shadow-lg">
                        <iframe
                          src={formatVideoUrl(property.video_url)}
                          title="Video de la propiedad"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </AspectRatio>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 border rounded-lg max-w-md mx-auto">
                      <ExternalLink className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Video de la propiedad</p>
                        <a 
                          href={property.video_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          Ver video externo
                        </a>
                      </div>
                    </div>
                  )}
                </Card>
              </section>
            )}

            {/* Plans section */}
            {Array.isArray(property.plans_url) && property.plans_url.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">Planos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.plans_url.map((planUrl, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Plano {index + 1}</h3>
                          <Button variant="outline" size="sm" asChild>
                            <a href={planUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver
                            </a>
                          </Button>
                        </div>
                        {/\.(jpg|jpeg|png|gif|webp)$/i.test(planUrl) ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="cursor-pointer group">
                                <AspectRatio ratio={4 / 3} className="rounded-lg overflow-hidden border">
                                  <WatermarkedImage
                                    src={planUrl}
                                    alt={`Plano ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </AspectRatio>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl p-0">
                              <WatermarkedImage
                                src={planUrl}
                                alt={`Plano ${index + 1} ampliado`}
                                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                              />
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <div className="p-8 text-center border rounded-lg bg-muted/30">
                            <p className="text-muted-foreground">Vista previa no disponible</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Map section */}
            {coords && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">Ubicación</h2>
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden shadow-lg">
                      <Map token={mapToken} lng={coords.lng} lat={coords.lat} className="w-full h-80" />
                    </div>
                    {!mapToken && (
                      <p className="text-sm text-muted-foreground text-center">
                        El mapa se mostrará cuando se configure el token de Mapbox
                      </p>
                    )}
                  </div>
                </Card>
              </section>
            )}

            {/* Reviews section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-primary">Reseñas y puntuaciones</h2>
                {!property.concluded_status && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReviewForm(true)}
                    className="gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Escribir reseña
                  </Button>
                )}
                {property.concluded_status && (
                  <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                    Solo clientes relacionados pueden reseñar
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Rating summary */}
                <Card className="p-6 text-center">
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">
                      {reviews.length > 0 ? averageRating.toFixed(1) : "—"}
                    </div>
                    <div className="flex justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(averageRating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {reviews.length === 0 ? "Sin reseñas" : `${reviews.length} reseña${reviews.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </Card>

                {/* Reviews list */}
                <div className="md:col-span-2 space-y-4">
                  {reviews.length > 0 ? (
                    <>
                      {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                      <Card key={review.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {review.client_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{review.client_name}</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(review.created_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                      </Card>
                      ))}
                      
                      {/* Show more/less button */}
                      {reviews.length > 3 && (
                        <div className="text-center pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowAllReviews(!showAllReviews)}
                            className="gap-2"
                          >
                            {showAllReviews ? (
                              <>Mostrar menos reseñas</>
                            ) : (
                              <>Ver todas las reseñas ({reviews.length})</>
                            )}
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Card className="p-8 text-center border-dashed">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Sé el primero en dejar una reseña de esta propiedad
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowReviewForm(true)}
                        className="gap-2"
                      >
                        <Star className="h-4 w-4" />
                        Escribir primera reseña
                      </Button>
                    </Card>
                  )}
                </div>
              </div>
            </section>

            {/* Contact form */}
            {!property.concluded_status && (
              <section id="contact-form">
                <h2 className="text-2xl font-semibold mb-4 text-primary">Contactar al agente</h2>
              <Card className="p-6">
                <form
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (isSubmittingContact) return;
                    
                    setIsSubmittingContact(true);
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get("name") as string;
                    const email = formData.get("email") as string;
                    const phone = formData.get("phone") as string;
                    const message = formData.get("message") as string;
                    
                    // Use selected agent or default to property agent
                    const targetAgentId = selectedAgentCode && selectedAgentCode !== "default" ? 
                      availableAgents.find(a => a.agent_code === selectedAgentCode)?.id : 
                      property.agent_id;
                    
                    try {
                      const { error } = await supabase.functions.invoke("agent-contact", {
                        body: {
                          agentId: targetAgentId,
                          propertyId: property.id,
                          clientName: name,
                          clientEmail: email,
                          clientPhone: phone,
                          message: message
                        }
                      });
                      
                      if (error) throw error;
                      
                      // MOSTRAR CONFIRMACIÓN VISUAL CON IMAGEN
                      setShowContactConfirmation(true);
                      
                      // RESETEAR FORMULARIO Y CERRAR CONFIRMACIÓN
                      setTimeout(() => {
                        (e.target as HTMLFormElement).reset();
                        setSelectedAgentCode("");
                        setShowContactConfirmation(false);
                      }, 3000);
                     } catch (error) {
                       console.error("Error sending message:", error);
                       toast.error("❌ Error al enviar mensaje", {
                         description: "No se pudo enviar. Verifica tu conexión e inténtalo de nuevo.",
                       });
                     } finally {
                       setIsSubmittingContact(false);
                     }
                   }}
                >
                  <div>
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input id="name" name="name" required placeholder="Tu nombre completo" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input id="email" name="email" type="email" required placeholder="tu@correo.com" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Número de teléfono</Label>
                    <Input id="phone" name="phone" placeholder="+591 70000000" className="mt-1" />
                  </div>
                  
                   <div>
                     <Label htmlFor="agent-select">Seleccionar agente (opcional)</Label>
                     <div className="mt-1">
                       <AgentSearchSelector
                         agents={availableAgents.filter(agent => agent.agent_code && agent.agent_code.trim() !== '')}
                         value={selectedAgentCode}
                         onValueChange={setSelectedAgentCode}
                         placeholder="Buscar agente por nombre o código..."
                       />
                     </div>
                     <p className="text-xs text-muted-foreground mt-1">
                       Busca por nombre completo o código de agente (ej: MCAL4139)
                     </p>
                   </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="message">Mensaje</Label>
                    <Textarea 
                      id="message" 
                      name="message" 
                      required 
                      placeholder="Hola, estoy interesado/a en esta propiedad. Me gustaría obtener más información..."
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                   <div className="md:col-span-2">
                     <Button 
                       type="submit" 
                       size="lg" 
                       className="w-full md:w-auto px-8 relative"
                       disabled={isSubmittingContact}
                     >
                       {isSubmittingContact ? (
                         <>
                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                           Enviando mensaje...
                         </>
                       ) : (
                         "📤 Enviar consulta"
                       )}
                     </Button>
                   </div>
                </form>
              </Card>
              </section>
            )}
          </div>
        )}

        {/* Booking Calendar Modal */}
        {property && (
          <PropertyBookingCalendar
            propertyId={property.id}
            agentId={property.agent_id}
            isOpen={showBookingCalendar}
            onClose={() => setShowBookingCalendar(false)}
          />
        )}

        {/* Review Form Modal */}
        {property && (
          <PropertyReviewForm
            propertyId={property.id}
            isOpen={showReviewForm}
            onClose={() => setShowReviewForm(false)}
            onReviewAdded={() => {
              // For now, just add a sample review to demonstrate functionality
              const newReview: Review = {
                id: Date.now().toString(),
                rating: 5,
                comment: "Nueva reseña añadida exitosamente",
                client_name: "Cliente",
                created_at: new Date().toISOString()
              };
              setReviews(prev => [newReview, ...prev]);
            }}
          />
        )}

        {/* Contact Confirmation Modal */}
        <SuccessConfirmationModal
          isOpen={showContactConfirmation}
          onClose={() => setShowContactConfirmation(false)}
          type="message"
        />
      </main>
    </div>
  );
}
