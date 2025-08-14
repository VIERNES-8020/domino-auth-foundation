import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Facebook, Instagram, Linkedin, Twitter, Globe } from "lucide-react";


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

  usePageSEO(
    profile?.full_name ? `Agente ${profile.full_name} | DOMIN10` : "Agente Inmobiliario | DOMIN10",
    profile?.bio || "Conoce al agente inmobiliario DOMIN10, su experiencia y propiedades activas.",
    code ? `/agente/${code}` : undefined
  );

  useEffect(() => {
    let active = true;
    (async () => {
      if (!code) return;
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
    })();
    return () => { active = false; };
  }, [code]);


  const whatsappUrl = useMemo(() => {
    if (!profile?.corporate_phone) return null;
    const msg = encodeURIComponent(`Hola ${profile.full_name ?? ''}, me interesa contactarte por tus propiedades (código ${profile.agent_code ?? ''}).`);
    const phone = profile.corporate_phone.replace(/\D+/g, "");
    return `https://wa.me/${phone}?text=${msg}`;
  }, [profile]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <header className="container mx-auto py-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Perfil del Agente</h1>
        <p className="mt-2 text-muted-foreground">Identidad única y propiedades activas.</p>
      </header>
      <main className="container mx-auto pb-16">
        {!profile ? (
          <Card>
            <CardHeader>
              <CardTitle>No se encontró el agente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Verifica el código del agente o vuelve al <Link to="/agents" className="underline">listado de agentes</Link>.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={profile.avatar_url || "/default-placeholder.jpg"}
                    alt={`Foto de perfil del agente ${profile.full_name ?? ''}`}
                    className="h-20 w-20 rounded-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/default-placeholder.jpg"; }}
                  />
                  <div>
                    <p className="font-semibold">{profile.full_name ?? "Agente"}</p>
                    {profile.title && (<p className="text-sm text-muted-foreground">{profile.title}</p>)}
                    <p className="text-sm text-muted-foreground">Código: {profile.agent_code ?? "—"}</p>
                    {stats && (
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < Math.round(stats.average_rating) ? '' : 'opacity-30'}`} />
                        ))}
                        <span className="ml-1 text-xs text-muted-foreground">({stats.total_ratings})</span>
                      </div>
                    )}
                  </div>
                </div>
                {profile.experience_summary && (
                  <div>
                    <p className="text-sm font-medium">Experiencia</p>
                    <p className="text-sm text-muted-foreground">{profile.experience_summary}</p>
                  </div>
                )}
                {profile.education && (
                  <div>
                    <p className="text-sm font-medium">Estudios</p>
                    <p className="text-sm text-muted-foreground">{profile.education}</p>
                  </div>
                )}
                {profile.bio && (
                  <div>
                    <p className="text-sm font-medium">Acerca de mí</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{profile.bio}</p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {profile.website_url && (
                    <a href={profile.website_url} target="_blank" rel="noreferrer" aria-label="Sitio web" className="text-muted-foreground hover:text-primary">
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                  {profile.facebook_url && (
                    <a href={profile.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook" className="text-muted-foreground hover:text-primary">
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {profile.instagram_url && (
                    <a href={profile.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-primary">
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {profile.twitter_url && (
                    <a href={profile.twitter_url} target="_blank" rel="noreferrer" aria-label="Twitter" className="text-muted-foreground hover:text-primary">
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                </div>
                {whatsappUrl && !(/\*/.test(profile.corporate_phone ?? '')) && (
                  <Button asChild className="w-full"><a href={whatsappUrl} target="_blank" rel="noreferrer">Contactar por WhatsApp</a></Button>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Propiedades activas</CardTitle>
              </CardHeader>
              <CardContent>
                {properties.length === 0 ? (
                  <p className="text-muted-foreground">Sin propiedades aprobadas por el momento.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {properties.map((p) => (
                      <div key={p.id} className="border rounded-lg overflow-hidden">
                        <div className="aspect-[16/9] bg-muted">
                          {p.image_urls?.length ? (
                            <img src={p.image_urls[0]} alt={`Imagen de ${p.title}`} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <img src="/default-placeholder.jpg" alt={`Imagen de ${p.title}`} className="h-full w-full object-cover" loading="lazy" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-medium line-clamp-1">{p.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{p.address}</p>
                          <p className="mt-1 text-sm">{p.price_currency === 'BOB' ? 'Bs.' : '$us.'} {p.price.toLocaleString()}</p>
                          <Button asChild variant="outline" className="mt-2 w-full"><Link to={`/properties/${p.id}`}>Ver detalle</Link></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Contacto directo</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const name = (form.querySelector('#c-name') as HTMLInputElement).value;
                    const email = (form.querySelector('#c-email') as HTMLInputElement).value;
                    const msg = (form.querySelector('#c-msg') as HTMLTextAreaElement).value;
                    const text = encodeURIComponent(`Hola ${profile.full_name ?? ''}, soy ${name} (${email}). ${msg}`);
                    if (whatsappUrl) {
                      const base = whatsappUrl.split('?')[0];
                      const phone = base.replace('https://wa.me/', '');
                      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                    } else {
                      window.location.href = `mailto:info@dominio.com?subject=Contacto agente ${profile.agent_code ?? ''}&body=${text}`;
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <input id="c-name" required placeholder="Tu nombre" className="border rounded-md px-3 py-2 bg-background" />
                  <input id="c-email" required type="email" placeholder="Tu email" className="border rounded-md px-3 py-2 bg-background" />
                  <div className="md:col-span-3">
                    <textarea id="c-msg" required placeholder="Tu mensaje" className="border rounded-md px-3 py-2 w-full h-24 bg-background" />
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <Button type="submit">Enviar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      {personJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      )}
    </div>
  );
}
