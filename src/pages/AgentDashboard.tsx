import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

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

    // Canonical
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
  address: string;
  price: number;
  status: string | null;
}

export default function AgentDashboard() {
  usePageSEO({
    title: "Panel Agente Inmobiliario | Inmobiliaria DOMIN10",
    description: "Panel seguro para agentes inmobiliarios: lista y creación de propiedades.",
    canonicalPath: "/dashboard/agent",
  });

  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const isFormValid = useMemo(() => Boolean(title && address && price !== "" && Number(price) >= 0), [title, address, price]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
      if (data.user) {
        await fetchProperties(data.user.id);
      }
      setIsLoading(false);
    };

    init();

    // Subscribe to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProperties(session.user.id);
      } else {
        setProperties([]);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const fetchProperties = async (agentId: string) => {
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, address, price, status")
      .eq("agent_id", agentId)
      .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching properties:", error);
      toast.error("No se pudieron cargar las propiedades", {
        description: error.message,
      });
      return;
    }
    setProperties((data ?? []) as Property[]);
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      title: title.trim(),
      address: address.trim(),
      price: Number(price) || 0,
      agent_id: user.id,
    } as const;

    const { error } = await supabase.from("properties").insert(payload);

    if (error) {
      toast.error("Error al crear propiedad", { description: error.message });
      return;
    }

    toast.success("¡Propiedad creada exitosamente!");
    setTitle("");
    setAddress("");
    setPrice("");
    await fetchProperties(user.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
        <main className="container mx-auto py-10">
          <p className="text-muted-foreground">Cargando panel de agente…</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
        <main className="container mx-auto py-10">
          <Card>
            <CardHeader>
              <CardTitle>Acceso denegado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Debes iniciar sesión para acceder al panel del agente.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <header className="container mx-auto py-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Panel del Agente Inmobiliario
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Gestiona tus propiedades: consulta el listado y añade nuevas.
        </p>
      </header>

      <main className="container mx-auto pb-16">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-labelledby="agent-dashboard">
          <h2 id="agent-dashboard" className="sr-only">Panel de agente</h2>

          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle>Mis propiedades</CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <p className="text-muted-foreground">Aún no tienes propiedades registradas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Dirección</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.title}</TableCell>
                          <TableCell>{p.address}</TableCell>
                          <TableCell className="text-right">${p.price.toLocaleString()}</TableCell>
                          <TableCell>{p.status ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Nueva propiedad</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProperty} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Apartamento luminoso en el centro"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle 123, Ciudad"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Precio</Label>
                  <Input
                    id="price"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="150000"
                    required
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={!isFormValid} className="w-full">
                    Añadir propiedad
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
