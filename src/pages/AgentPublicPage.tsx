import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import ClientReviewsSection from "@/components/ClientReviewsSection";
import { 
  Star, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Globe, 
  Phone, 
  Mail, 
  Award,
  GraduationCap,
  User,
  MessageSquare,
  Send,
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Square,
  Quote
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  agent_code: string | null;
  avatar_url: string | null;
  title: string | null;
  experience_summary: string | null;
  education: string | null;
  bio: string | null;
  corporate_phone: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  website_url?: string | null;
}

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  price_currency: string | null;
  image_urls: string[] | null;
  bedrooms?: number;
  bathrooms?: number;
  area_m2?: number;
}

interface ClientReview {
  id: string;
  client_name: string;
  transaction_type: string;
  company_rating: number;
  agent_rating: number;
  comment: string | null;
  created_at: string;
}

function usePageSEO(title: string, description: string, canonicalPath?: string) {
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

export default function AgentPublicPage() {
  const { code } = useParams<{ code: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<{ average_rating: number; total_ratings: number } | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  usePageSEO(
    profile?.full_name ? `${profile.full_name} | Agente DOMINIO` : "Agente Inmobiliario | DOMINIO",
    profile?.bio || "Conoce al agente inmobiliario DOMINIO, su experiencia y propiedades activas.",
    code ? `/agente/${code}` : undefined
  );

  useEffect(() => {
    let active = true;
    (async () => {
      if (!code) return;
      try {
        const { data, error } = await supabase.functions.invoke('get-agent-profile', {
          body: { code },
        });
        if (error) {
          console.error('get-agent-profile error', error);
          return;
        }
        if (!active) return;
        const payload = data as any;
        setProfile(payload.profile as Profile);
        setStats(payload.stats as { average_rating: number; total_ratings: number });
        setProperties((payload.properties ?? []) as Property[]);
      } catch (err) {
        console.error('Error fetching agent profile:', err);
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [code]);

  const whatsappUrl = useMemo(() => {
    if (!profile?.corporate_phone) return null;
    const msg = encodeURIComponent(`Hola ${profile.full_name ?? ''}, me interesa contactarte por tus propiedades (código ${profile.agent_code ?? ''}).`);
    const phone = profile.corporate_phone.replace(/\D+/g, "");
    return `https://wa.me/${phone}?text=${msg}`;
  }, [profile]);

  const maskedPhone = useMemo(() => {
    if (!profile?.corporate_phone) return null;
    // For non-registered users, show masked number
    const phone = profile.corporate_phone;
    return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
  }, [profile?.corporate_phone]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, message } = formData;
    const text = encodeURIComponent(`Hola ${profile?.full_name ?? ''}, soy ${name} (${email}). ${message}`);
    
    if (whatsappUrl) {
      const base = whatsappUrl.split('?')[0];
      const phone = base.replace('https://wa.me/', '');
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    } else {
      window.location.href = `mailto:info@dominio.com?subject=Contacto agente ${profile?.agent_code ?? ''}&body=${text}`;
    }
    
    // Reset form
    setFormData({ name: "", email: "", message: "" });
  };

  const personJsonLd = profile ? {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.full_name ?? undefined,
    jobTitle: profile.title ?? undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    image: profile.avatar_url ?? undefined,
    identifier: profile.agent_code ?? undefined,
    sameAs: [profile.website_url, profile.facebook_url, profile.instagram_url, profile.linkedin_url, profile.twitter_url].filter(Boolean),
    aggregateRating: stats ? {
      "@type": "AggregateRating",
      ratingValue: Number(stats.average_rating || 0).toFixed(1),
      reviewCount: stats.total_ratings || 0,
    } : undefined,
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
        <div className="container mx-auto py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando perfil del agente...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
        <div className="container mx-auto py-20">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8">
              <User className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Agente no encontrado</h2>
              <p className="text-muted-foreground mb-6">
                No se pudo encontrar un agente con el código proporcionado.
              </p>
              <Button asChild>
                <Link to="/nuestros-agentes">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a Agentes
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Hero Section */}
      <section className="relative py-12 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="container mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/nuestros-agentes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Agentes
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Agent Info */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Agent Photo */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <img
                        src={profile.avatar_url || "/default-placeholder.jpg"}
                        alt={`Foto de ${profile.full_name ?? 'Agente'}`}
                        className="w-48 h-48 rounded-2xl object-cover shadow-xl"
                        onError={(e) => { 
                          (e.currentTarget as HTMLImageElement).src = "/default-placeholder.jpg"; 
                        }}
                      />
                      {stats && (
                        <div className="absolute -bottom-3 -right-3 bg-white rounded-full p-2 shadow-lg border">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-sm">{Number(stats.average_rating || 0).toFixed(1)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            {stats.total_ratings} reseñas
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Agent Details */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <h1 className="text-3xl font-bold text-foreground mb-2">
                        {profile.full_name ?? "Agente Inmobiliario"}
                      </h1>
                      <p className="text-xl text-primary font-semibold mb-1">
                        {profile.title || "Corredor de Bienes Raíces"}
                      </p>
                      <Badge variant="outline" className="mb-4">
                        Código: {profile.agent_code || "N/A"}
                      </Badge>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 mb-6">
                      {profile.corporate_phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-primary" />
                          <span className="text-muted-foreground">{maskedPhone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <span className="text-muted-foreground">info@dominio.com</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span className="text-muted-foreground">Bolivia</span>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="flex flex-wrap gap-3">
                      {profile.website_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={profile.website_url} target="_blank" rel="noreferrer">
                            <Globe className="h-4 w-4 mr-2" />
                            Website
                          </a>
                        </Button>
                      )}
                      {profile.facebook_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={profile.facebook_url} target="_blank" rel="noreferrer">
                            <Facebook className="h-4 w-4 mr-2" />
                            Facebook
                          </a>
                        </Button>
                      )}
                      {profile.instagram_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={profile.instagram_url} target="_blank" rel="noreferrer">
                            <Instagram className="h-4 w-4 mr-2" />
                            Instagram
                          </a>
                        </Button>
                      )}
                      {profile.linkedin_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={profile.linkedin_url} target="_blank" rel="noreferrer">
                            <Linkedin className="h-4 w-4 mr-2" />
                            LinkedIn
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* About Me Section */}
                {profile.bio && (
                  <div className="mt-8 pt-8 border-t">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <User className="h-6 w-6 text-primary" />
                      Acerca de mí
                    </h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Experience & Education */}
                <div className="mt-8 pt-8 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile.experience_summary && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        Experiencia
                      </h3>
                      <p className="text-muted-foreground">{profile.experience_summary}</p>
                    </div>
                  )}
                  {profile.education && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        Educación
                      </h3>
                      <p className="text-muted-foreground">{profile.education}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <MessageSquare className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="text-2xl font-bold mb-2">Contactar Agente</h3>
                  <p className="text-muted-foreground text-sm">
                    Envía un mensaje directo a {profile.full_name?.split(' ')[0] || 'este agente'}
                  </p>
                </div>

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Tu nombre completo"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Tu email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Escribe tu mensaje o consulta..."
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      required
                      className="bg-background min-h-[120px]"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Mensaje
                  </Button>
                </form>

                {whatsappUrl && (
                  <div className="mt-4 pt-4 border-t">
                    <Button asChild variant="outline" className="w-full">
                      <a href={whatsappUrl} target="_blank" rel="noreferrer">
                        <Phone className="h-4 w-4 mr-2" />
                        WhatsApp Directo
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Client Reviews Section */}
        <section className="mt-12">
          <ClientReviewsSection agentId={profile.id} />
        </section>

        {/* Properties Section */}
        <section className="mt-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Propiedades Activas</h2>
            <p className="text-muted-foreground">
              Descubre las propiedades disponibles de {profile.full_name?.split(' ')[0] || 'este agente'}
            </p>
          </div>

          {properties.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="mb-4">
                  <Square className="h-16 w-16 text-muted-foreground/40 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sin propiedades activas</h3>
                <p className="text-muted-foreground">
                  Este agente no tiene propiedades disponibles en este momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Card key={property.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={property.image_urls?.[0] || "/default-placeholder.jpg"}
                      alt={`Imagen de ${property.title}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-primary text-primary-foreground">
                        {property.price_currency === 'BOB' ? 'Bs.' : '$'} {property.price.toLocaleString()}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-1">{property.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {property.address}
                    </p>

                    {/* Property Features */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                      {property.bedrooms && (
                        <div className="flex items-center gap-1">
                          <Bed className="h-3 w-3" />
                          <span>{property.bedrooms}</span>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center gap-1">
                          <Bath className="h-3 w-3" />
                          <span>{property.bathrooms}</span>
                        </div>
                      )}
                      {property.area_m2 && (
                        <div className="flex items-center gap-1">
                          <Square className="h-3 w-3" />
                          <span>{property.area_m2}m²</span>
                        </div>
                      )}
                    </div>

                    <Button asChild className="w-full">
                      <Link to={`/properties/${property.id}`}>
                        Ver Detalles
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* JSON-LD Schema */}
      {personJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      )}
    </div>
  );
}
