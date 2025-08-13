import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Profile {
  id: string;
  full_name: string | null;
  agent_code: string | null;
  experience_summary: string | null;
  bio: string | null;
  corporate_phone: string | null;
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
    const load = async () => {
      if (!code) return;
      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, agent_code, experience_summary, bio, corporate_phone, avatar_url")
        .eq("agent_code", code)
        .maybeSingle();
      if (pErr) {
        console.error(pErr);
        return;
      }
      if (!prof) return;
      setProfile(prof as Profile);

      const { data: stat, error: sErr } = await supabase.rpc("get_agent_public_stats", { _agent_id: prof.id });
      if (!sErr && stat && Array.isArray(stat) ? (stat as any)[0] : stat) {
        const val = Array.isArray(stat) ? (stat as any)[0] : (stat as any);
        setStats({ average_rating: Number(val.average_rating ?? 0), total_ratings: Number(val.total_ratings ?? 0) });
      }

      const { data: props, error: prErr } = await supabase
        .from("properties")
        .select("id, title, address, price, price_currency, image_urls")
        .eq("agent_id", prof.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (!prErr) setProperties((props ?? []) as Property[]);
    };
    load();
  }, [code]);

  const whatsappUrl = useMemo(() => {
    if (!profile?.corporate_phone) return null;
    const msg = encodeURIComponent(`Hola ${profile.full_name ?? ''}, me interesa contactarte por tus propiedades (código ${profile.agent_code ?? ''}).`);
    const phone = profile.corporate_phone.replace(/\D+/g, "");
    return `https://wa.me/${phone}?text=${msg}`;
  }, [profile]);

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
                  <img src={(profile as any).avatar_url || "/default-placeholder.jpg"} alt={`Foto de perfil del agente ${profile.full_name ?? ''}`} className="h-20 w-20 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold">{profile.full_name ?? "Agente"}</p>
                    <p className="text-sm text-muted-foreground">Código: {profile.agent_code ?? "—"}</p>
                    {stats && (
                      <p className="text-sm text-muted-foreground">⭐ {stats.average_rating.toFixed(1)} ({stats.total_ratings})</p>
                    )}
                  </div>
                </div>
                {profile.experience_summary && (
                  <div>
                    <p className="text-sm font-medium">Experiencia</p>
                    <p className="text-sm text-muted-foreground">{profile.experience_summary}</p>
                  </div>
                )}
                {profile.bio && (
                  <div>
                    <p className="text-sm font-medium">Biografía</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{profile.bio}</p>
                  </div>
                )}
                {whatsappUrl && (
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
    </div>
  );
}
