import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface AgentProfile { id: string; full_name: string | null; avatar_url?: string | null; bio?: string | null }

function usePageSEO(opts: { title: string; description: string; canonicalPath: string }) {
  const { title, description, canonicalPath } = opts;
  useEffect(() => {
    document.title = title;
    const ensure = (n: string, c: string) => {
      let el = document.querySelector(`meta[name="${n}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", n); document.head.appendChild(el); }
      el.setAttribute("content", c);
    };
    ensure("description", description);
    const canonicalUrl = new URL(canonicalPath, window.location.origin).toString();
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement("link"); link.setAttribute("rel", "canonical"); document.head.appendChild(link); }
    link.setAttribute("href", canonicalUrl);
  }, [title, description, canonicalPath]);
}

export default function AgentsPage() {
  usePageSEO({ title: "Nuestros Agentes | DOMINIO", description: "Conoce a nuestros agentes certificados en toda Bolivia.", canonicalPath: "/agents" });
  const sb = useMemo(() => getSupabaseClient(), []);
  const [agents, setAgents] = useState<AgentProfile[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Basic list from profiles
        const { data } = await sb.from("profiles").select("id, full_name").order("full_name", { ascending: true });
        if (!active) return;
        setAgents((data as AgentProfile[]) ?? []);
      } catch (e) { /* noop */ }
    })();
    return () => { active = false; };
  }, [sb]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <main className="container mx-auto py-10">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Nuestros Agentes</h1>
          <p className="mt-2 text-muted-foreground">Profesionales listos para ayudarte a encontrar tu hogar ideal.</p>
        </header>

        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {agents.map((a) => (
              <Card key={a.id} className="overflow-hidden">
                <AspectRatio ratio={1}>
                  <img src="/placeholder.svg" alt={`Agente ${a.full_name ?? a.id}`} className="w-full h-full object-cover" />
                </AspectRatio>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-1">{a.full_name ?? `Agente ${a.id.slice(0,8)}`}</h3>
                  <Button variant="outline" size="sm" className="mt-2">Ver Perfil</Button>
                </CardContent>
              </Card>
            ))}
            {agents.length === 0 && (
              <p className="text-muted-foreground">Pronto listaremos a nuestros agentes.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
