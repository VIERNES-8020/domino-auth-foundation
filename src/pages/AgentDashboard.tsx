import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Home, Cog, MapPin, Images } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  // Form state (multi-pestaña)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [propertyType, setPropertyType] = useState("");
  const [transactionType, setTransactionType] = useState("");

  const [bedrooms, setBedrooms] = useState<string>("");
  const [bathrooms, setBathrooms] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [hasPool, setHasPool] = useState<boolean>(false);
  const [hasGarage, setHasGarage] = useState<boolean>(false);
  const [petFriendly, setPetFriendly] = useState<boolean>(false);

  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [plansUrls, setPlansUrls] = useState<string[]>([]);
  const [newPlanUrl, setNewPlanUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const isFormValid = useMemo(
    () => Boolean(title && address && price !== "" && Number(price) >= 0),
    [title, address, price]
  );

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

    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        address: address.trim(),
        price: Number(price) || 0,
        property_type: propertyType || null,
        transaction_type: transactionType || null,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        area_m2: area ? Number(area) : undefined,
        has_pool: hasPool,
        has_garage: hasGarage,
        pet_friendly: petFriendly,
        image_urls: imageUrls.length ? imageUrls : null,
        video_url: videoUrl || null,
        plans_url: plansUrls.length ? plansUrls : null,
        agent_id: user.id,
      };

      const { error } = await supabase.from("properties").insert(payload);
      if (error) throw error;

      toast.success("¡Propiedad creada exitosamente!");
      // Reset form
      setTitle("");
      setDescription("");
      setAddress("");
      setPrice("");
      setPropertyType("");
      setTransactionType("");
      setBedrooms("");
      setBathrooms("");
      setArea("");
      setHasPool(false);
      setHasGarage(false);
      setPetFriendly(false);
      setLat("");
      setLng("");
      setImageUrls([]);
      setNewImageUrl("");
      setPlansUrls([]);
      setNewPlanUrl("");
      setVideoUrl("");

      await fetchProperties(user.id);
    } catch (err: any) {
      console.error("Error al crear propiedad", err);
      toast.error("Error al crear propiedad", { description: err.message });
    }
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Panel del Agente Inmobiliario
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Gestiona tus propiedades: consulta el listado y añade nuevas.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            ✨ AURA activado
          </span>
        </div>
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
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid grid-cols-4 w-full rounded-lg shadow-md">
                    <TabsTrigger value="general" className="gap-2">
                      <Home className="h-4 w-4" aria-hidden="true" />
                      General
                    </TabsTrigger>
                    <TabsTrigger value="features" className="gap-2">
                      <Cog className="h-4 w-4" aria-hidden="true" />
                      Características
                    </TabsTrigger>
                    <TabsTrigger value="location" className="gap-2">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      Ubicación
                    </TabsTrigger>
                    <TabsTrigger value="media" className="gap-2">
                      <Images className="h-4 w-4" aria-hidden="true" />
                      Multimedia
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4 animate-fade-in">
                    <Alert>
                      <AlertTitle>✨ AURA</AlertTitle>
                      <AlertDescription>
                        Generará descripciones de marketing persuasivas a partir de los datos ingresados. Puedes editar el resultado libremente.
                      </AlertDescription>
                    </Alert>
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="description">Descripción</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            const friendlyType = propertyType ? (
                              propertyType === "house" ? "casa" : propertyType === "apartment" ? "departamento" : propertyType === "land" ? "terreno" : "oficina"
                            ) : "propiedad";
                            const parts: string[] = [];
                            parts.push(`Descubre esta ${friendlyType}${address ? ` en ${address}` : ""}.`);
                            if (bedrooms) parts.push(`${bedrooms} habitaciones`);
                            if (bathrooms) parts.push(`${bathrooms} baños`);
                            if (area) parts.push(`${area} m² de confort`);
                            if (hasPool) parts.push("piscina");
                            if (hasGarage) parts.push("garaje");
                            if (petFriendly) parts.push("acepta mascotas");
                            const tail = parts.length > 1 ? ` Cuenta con ${parts.slice(1).join(", ")}.` : "";
                            setDescription(`${parts[0]}${tail} Vive la calidez de hogar con DOMINIO.`);
                            toast.info("AURA: descripción generada");
                          }}
                        >
                          ✨ Generar con AURA
                        </Button>
                      </div>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Escribe una descripción atractiva que resalte lo mejor de la propiedad..."
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                      <div className="space-y-2">
                        <Label>Tipo de Propiedad</Label>
                        <Select value={propertyType} onValueChange={setPropertyType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="house">Casa</SelectItem>
                            <SelectItem value="apartment">Departamento</SelectItem>
                            <SelectItem value="land">Terreno</SelectItem>
                            <SelectItem value="office">Oficina</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo de Transacción</Label>
                        <Select value={transactionType} onValueChange={setTransactionType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sale">Venta</SelectItem>
                            <SelectItem value="rent">Alquiler</SelectItem>
                            <SelectItem value="anticretico">Anticrético</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">Habitaciones</Label>
                        <Input id="bedrooms" type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bathrooms">Baños</Label>
                        <Input id="bathrooms" type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area">Superficie (m²)</Label>
                        <Input id="area" type="number" min={0} value={area} onChange={(e) => setArea(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={hasPool} onCheckedChange={(v) => setHasPool(!!v)} /> Piscina
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={hasGarage} onCheckedChange={(v) => setHasGarage(!!v)} /> Garaje
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={petFriendly} onCheckedChange={(v) => setPetFriendly(!!v)} /> Acepta mascotas
                      </label>
                    </div>
                  </TabsContent>

                  <TabsContent value="location" className="space-y-4 animate-fade-in">
                    <Alert>
                      <AlertTitle>✨ AURA</AlertTitle>
                      <AlertDescription>
                        Autocompletará la dirección y coordenadas desde el mapa y podrá sugerir usar tu ubicación actual. (Próxima fase)
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="address">Dirección</Label>
                        <Button type="button" variant="ghost" onClick={() => toast.message("AURA colocará el pin automáticamente (próximamente)")}>✨ AURA</Button>
                      </div>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Calle 123, Ciudad"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lat">Latitud</Label>
                        <Input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-16.5" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lng">Longitud</Label>
                        <Input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-68.15" />
                      </div>
                    </div>

                    <div className="h-40 rounded-md border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
                      Mapa interactivo — próximamente
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="space-y-4 animate-fade-in">
                    <Alert>
                      <AlertTitle>✨ AURA</AlertTitle>
                      <AlertDescription>
                        Evaluará calidad de fotos y convertirá formatos no válidos automáticamente. (UI lista, lógica en fase 4)
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label>Fotos (URLs por ahora)</Label>
                      <div className="flex gap-2">
                        <Input placeholder="https://..." value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} />
                        <Button type="button" variant="secondary" onClick={() => {
                          if (!newImageUrl.trim()) return;
                          setImageUrls((prev) => Array.from(new Set([...prev, newImageUrl.trim()])));
                          setNewImageUrl("");
                        }}>Añadir</Button>
                      </div>
                      {imageUrls.length > 0 && (
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {imageUrls.map((u) => (
                            <li key={u} className="flex items-center justify-between gap-2">
                              <span className="truncate">{u}</span>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrls((prev) => prev.filter((x) => x !== u))}>Quitar</Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="videoUrl">URL de Video</Label>
                      <Input id="videoUrl" placeholder="https://youtube.com/..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Planos (URLs por ahora)</Label>
                      <div className="flex gap-2">
                        <Input placeholder="https://.../plano.pdf" value={newPlanUrl} onChange={(e) => setNewPlanUrl(e.target.value)} />
                        <Button type="button" variant="secondary" onClick={() => {
                          if (!newPlanUrl.trim()) return;
                          setPlansUrls((prev) => Array.from(new Set([...prev, newPlanUrl.trim()])));
                          setNewPlanUrl("");
                        }}>Añadir</Button>
                      </div>
                      {plansUrls.length > 0 && (
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {plansUrls.map((u) => (
                            <li key={u} className="flex items-center justify-between gap-2">
                              <span className="truncate">{u}</span>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setPlansUrls((prev) => prev.filter((x) => x !== u))}>Quitar</Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="pt-2">
                  <Button type="submit" disabled={!isFormValid} className="w-full">
                    Guardar propiedad
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
