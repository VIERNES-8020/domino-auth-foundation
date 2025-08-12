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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useQuery } from "@tanstack/react-query";
import MapPicker from "@/components/MapPicker";

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
  price_currency?: string | null;
  status: string | null;
}

interface OtherAgent {
  id: string;
  full_name: string | null;
  agent_code: string | null;
}

type OtherProperty = Property & { agent_id?: string };

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
  const [priceCurrency, setPriceCurrency] = useState<string>("USD");
  const [propertyType, setPropertyType] = useState("");
  const [transactionType, setTransactionType] = useState("");

  const [bedrooms, setBedrooms] = useState<string>("");
  const [bathrooms, setBathrooms] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [constructedArea, setConstructedArea] = useState<string>("");
  const [hasPool, setHasPool] = useState<boolean>(false);
  const [hasGarage, setHasGarage] = useState<boolean>(false);
  const [petFriendly, setPetFriendly] = useState<boolean>(false);
  const [hasGarden, setHasGarden] = useState<boolean>(false);
  // Amenidades dinámicas
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [otherAmenities, setOtherAmenities] = useState<string>("");
  const { data: amenities, isLoading: amenitiesLoading } = useQuery({
    queryKey: ["amenities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("amenities").select("id, name, icon_svg");
      if (error) throw error;
      return data as { id: string; name: string; icon_svg: string | null }[];
    },
  });

  const [lat, setLat] = useState<string>("-17.39");
  const [lng, setLng] = useState<string>("-66.15");

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [plansUrls, setPlansUrls] = useState<string[]>([]);
  const [newPlanUrl, setNewPlanUrl] = useState("");
const [videoUrl, setVideoUrl] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);

  // Colaboración entre agentes
  const [agentCodeQuery, setAgentCodeQuery] = useState("");
  const [foundAgent, setFoundAgent] = useState<OtherAgent | null>(null);
  const [collabProps, setCollabProps] = useState<Property[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; created_at: string; read: boolean }>>([]);

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
        await fetchNotifications(data.user.id);
      }
      setIsLoading(false);
    };

    init();

    // Subscribe to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProperties(session.user.id);
        fetchNotifications(session.user.id);
      } else {
        setProperties([]);
        setNotifications([]);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const fetchProperties = async (agentId: string) => {
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, address, price, price_currency, status")
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

  const fetchNotifications = async (_uid: string) => {
    const { data, error } = await supabase
      .from('agent_notifications')
      .select('id, message, created_at, read')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }
    setNotifications((data ?? []) as any);
  };

  const searchAgentByCode = async () => {
    try {
      setLoadingSearch(true);
      setFoundAgent(null);
      setCollabProps([]);
      const code = agentCodeQuery.trim();
      if (!code) return;
      const { data: prof, error: pErr } = await supabase
        .from('profiles')
        .select('id, full_name, agent_code')
        .eq('agent_code', code)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!prof) {
        toast.message('No se encontró un agente con ese código');
        return;
      }
      setFoundAgent(prof as OtherAgent);
      const { data: props, error: rpcErr } = await supabase.rpc('get_agent_properties_secure', { _agent_id: (prof as any).id });
      if (rpcErr) throw rpcErr;
      setCollabProps((props ?? []) as Property[]);
      toast.success('Propiedades del agente cargadas');
    } catch (e: any) {
      console.error(e);
      toast.error('No fue posible cargar propiedades del agente', { description: e.message });
    } finally {
      setLoadingSearch(false);
    }
  };

  const shareWithClient = async (prop: Property) => {
    try {
      if (!user || !foundAgent) return;
      const message = `El agente ${user.user_metadata?.full_name ?? 'Desconocido'} ha compartido tu propiedad '${prop.title}' con uno de sus clientes.`;
      const { error } = await supabase.from('agent_notifications').insert({
        to_agent_id: foundAgent.id,
        from_agent_id: user.id,
        property_id: (prop as any).id,
        message,
      });
      if (error) throw error;
      toast.success('Compartido con tu cliente');
      await fetchNotifications(user.id);
    } catch (e: any) {
      console.error(e);
      toast.error('No se pudo registrar la notificación', { description: e.message });
    }
  };
  // ======== File Upload Helpers (frontend resize + Storage uploads) ========
  async function resizeImage(file: File, maxWidth = 1920): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.naturalWidth);
        const width = Math.round(img.naturalWidth * scale);
        const height = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('No blob'));
        }, 'image/jpeg', 0.9);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  const handleSelectPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files: FileList | null = e.target.files;
      if (!files || !user) return;
      const arr = Array.from(files);
      if (arr.length + imageUrls.length > 10) {
        toast.error('Puedes subir hasta 10 fotos');
        return;
      }
      const valid = arr.every((f) => f.type === 'image/jpeg' || /\.jpe?g$/i.test(f.name));
      if (!valid) {
        toast.error('Solo se permiten imágenes JPG/JPEG');
        return;
      }
      const base = `${user.id}/${Date.now()}`;
      const uploaded: string[] = [];
      for (let i = 0; i < arr.length; i++) {
        const blob = await resizeImage(arr[i], 1920);
        const path = `${base}/photo-${i}.jpg`;
        const { error } = await supabase.storage.from('property-photos').upload(path, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });
        if (error) {
          console.error(error);
          toast.error('Error subiendo foto', { description: error.message });
          continue;
        }
        const { data } = supabase.storage.from('property-photos').getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      if (uploaded.length) {
        setImageUrls((prev) => Array.from(new Set([...prev, ...uploaded])));
        toast.success(`Subidas ${uploaded.length} foto(s)`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error al subir fotos', { description: err.message });
    } finally {
      if (e?.target) e.target.value = '';
    }
  };

  const handleSelectPlans = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files: FileList | null = e.target.files;
      if (!files || !user) return;
      const arr = Array.from(files);
      const valid = arr.every((f) => f.type === 'image/jpeg' || f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
      if (!valid) {
        toast.error('Solo se permiten JPG/JPEG o PDF para planos');
        return;
      }
      const base = `${user.id}/${Date.now()}`;
      const uploaded: string[] = [];
      for (let i = 0; i < arr.length; i++) {
        const f = arr[i];
        if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) {
          const path = `${base}/plan-${i}.pdf`;
          const { error } = await supabase.storage.from('property-plans').upload(path, f, {
            contentType: 'application/pdf',
            upsert: false,
          });
          if (error) {
            console.error(error);
            toast.error('Error subiendo plano', { description: error.message });
            continue;
          }
          const { data } = supabase.storage.from('property-plans').getPublicUrl(path);
          uploaded.push(data.publicUrl);
        } else {
          const blob = await resizeImage(f, 1920);
          const path = `${base}/plan-${i}.jpg`;
          const { error } = await supabase.storage.from('property-plans').upload(path, blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });
          if (error) {
            console.error(error);
            toast.error('Error subiendo plano', { description: error.message });
            continue;
          }
          const { data } = supabase.storage.from('property-plans').getPublicUrl(path);
          uploaded.push(data.publicUrl);
        }
      }
      if (uploaded.length) {
        setPlansUrls((prev) => Array.from(new Set([...prev, ...uploaded])));
        toast.success(`Subidos ${uploaded.length} archivo(s) de planos`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error al subir planos', { description: err.message });
    } finally {
      if (e?.target) e.target.value = '';
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const selectedNames = (amenities ?? [])
        .filter((a) => selectedAmenities.includes(a.id))
        .map((a) => a.name);
      const has_pool = selectedNames.includes("Piscina");
      const has_garage = selectedNames.includes("Garaje");
      const has_garden = selectedNames.includes("Jardín");
      const pet_friendly = selectedNames.includes("Acepta Mascotas");

      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        address: address.trim(),
        price: Number(price) || 0,
        price_currency: (priceCurrency || 'USD'),
        property_type: propertyType || null,
        transaction_type: transactionType || null,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        area_m2: area ? Number(area) : undefined,
        constructed_area_m2: constructedArea ? Number(constructedArea) : undefined,
        has_pool,
        has_garage,
        pet_friendly,
        image_urls: imageUrls.length ? imageUrls : null,
        video_url: videoUrl || null,
        plans_url: plansUrls.length ? plansUrls : null,
        agent_id: user.id,
        other_amenities: otherAmenities.trim() ? otherAmenities.trim() : null,
      };

      const { data: inserted, error } = await supabase
        .from("properties")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      const newPropertyId = (inserted as any)?.id as string | undefined;
      if (newPropertyId && selectedAmenities.length > 0) {
        const rows = selectedAmenities.map((amenityId) => ({
          property_id: newPropertyId,
          amenity_id: amenityId,
        }));
        const { error: linkError } = await supabase.from("property_amenities").insert(rows);
        if (linkError) {
          console.error("No se pudieron vincular amenidades", linkError);
        }
      }

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
        setConstructedArea("");
        setHasPool(false);
        setHasGarage(false);
        setPetFriendly(false);
      setHasGarden(false);
      setLat("");
      setLng("");
      setImageUrls([]);
      setNewImageUrl("");
      setPlansUrls([]);
      setNewPlanUrl("");
      setVideoUrl("");
      setSelectedAmenities([]);
      setOtherAmenities("");

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
        <div className="flex flex-wrap items-center justify-between gap-4">
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
              <div className="mb-6 space-y-2">
                <Label htmlFor="agentCode">Colaboración entre agentes</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="agentCode"
                    placeholder="Ingresa código ej. LMG4567"
                    value={agentCodeQuery}
                    onChange={(e) => setAgentCodeQuery(e.target.value)}
                  />
                  <Button type="button" onClick={searchAgentByCode} disabled={loadingSearch || !agentCodeQuery.trim()}>
                    {loadingSearch ? 'Buscando…' : 'Buscar'}
                  </Button>
                </div>
                {foundAgent && (
                  <p className="text-sm text-muted-foreground">
                    Agente: {foundAgent.full_name ?? '—'} ({foundAgent.agent_code ?? '—'})
                  </p>
                )}
                {collabProps.length > 0 && (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Dirección</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {collabProps.map((cp) => (
                          <TableRow key={cp.id}>
                            <TableCell className="font-medium">{cp.title}</TableCell>
                            <TableCell>{cp.address}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="secondary" onClick={() => shareWithClient(cp)}>Compartir con mi cliente</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-semibold">Mis notificaciones</h3>
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tienes notificaciones</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {notifications.slice(0, 5).map((n) => (
                      <li key={n.id} className="rounded-md border p-2 bg-background/50">
                        <span className="block">{n.message}</span>
                        <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

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
                          <TableCell className="text-right">{(p.price_currency === 'BOB' ? 'Bs.' : '$us.')} {p.price.toLocaleString()}</TableCell>
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
                  <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full rounded-lg shadow-md">
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
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isGenerating}
                          onClick={async () => {
                            try {
                              setIsGenerating(true);
                              const selectedNames = (amenities ?? [])
                                .filter((a) => selectedAmenities.includes(a.id))
                                .map((a) => a.name);
                              const has_pool = selectedNames.includes("Piscina");
                              const has_garage = selectedNames.includes("Garaje");
                              const has_garden = selectedNames.includes("Jardín");
                              const pet_friendly = selectedNames.includes("Acepta Mascotas");

                              const { data, error } = await supabase.functions.invoke('aura-generate-description', {
                                body: {
                                  property: {
                                    title: title || "",
                                    address: address || "",
                                    price: price === "" ? null : Number(price),
                                    property_type: propertyType || null,
                                    transaction_type: transactionType || null,
                                    bedrooms: bedrooms ? Number(bedrooms) : null,
                                    bathrooms: bathrooms ? Number(bathrooms) : null,
                                    area_m2: area ? Number(area) : null,
                                    has_pool,
                                    has_garage,
                                    has_garden,
                                    pet_friendly,
                                    lat: lat || null,
                                    lng: lng || null,
                                  },
                                  language: 'es',
                                  brand: 'DOMINIO',
                                  tone: 'premium inmobiliario persuasivo',
                                  style: '80-120 palabras, frases cortas, enfocado en beneficios, sin emojis, sin mayúsculas excesivas'
                                }
                              });
                              if (error) throw error;
                              const generated = (data as any)?.generatedText || (data as any)?.text || '';
                              if (generated) {
                                setDescription(generated.trim());
                                toast.success('AURA generó la descripción');
                              } else {
                                toast.message('AURA no pudo generar contenido. Intenta completando más campos.');
                              }
                            } catch (err: any) {
                              console.error(err);
                              toast.error('Error con AURA', { description: err.message ?? 'Intenta nuevamente' });
                            } finally {
                              setIsGenerating(false);
                            }
                          }}
                        >
                          {isGenerating ? 'Generando…' : '✨ Generar con AURA'}
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
                        <Label>Moneda</Label>
                        <Select value={priceCurrency} onValueChange={setPriceCurrency}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">$us.</SelectItem>
                            <SelectItem value="BOB">Bs.</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo de Propiedad</Label>
                        <Select value={propertyType} onValueChange={setPropertyType}>
                          <SelectTrigger className="w-full">
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
                          <SelectTrigger className="w-full">
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      <div className="space-y-2">
                        <Label htmlFor="constructedArea">Superficie Construida (m²)</Label>
                        <Input id="constructedArea" type="number" min={0} value={constructedArea} onChange={(e) => setConstructedArea(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Amenidades</Label>
                      {amenitiesLoading ? (
                        <p className="text-sm text-muted-foreground">Cargando amenidades…</p>
                      ) : (amenities && amenities.length > 0 ? (
                        <ToggleGroup
                          type="multiple"
                          value={selectedAmenities}
                          onValueChange={(v) => setSelectedAmenities(v as string[])}
                          className="flex flex-wrap gap-2"
                        >
                          {amenities.map((a) => (
                            <ToggleGroupItem key={a.id} value={a.id} aria-label={a.name}>
                              {a.name}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay amenidades configuradas.</p>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otherAmenities">Otras Características Especiales</Label>
                      <Textarea
                        id="otherAmenities"
                        value={otherAmenities}
                        onChange={(e) => setOtherAmenities(e.target.value)}
                        placeholder="Ej: vista al mar, domótica, paneles solares..."
                        rows={3}
                      />
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
                        <Input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-17.39" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lng">Longitud</Label>
                        <Input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-66.15" />
                      </div>
                    </div>

                    <MapPicker
                      lat={lat ? Number(lat) : null}
                      lng={lng ? Number(lng) : null}
                      onChange={({ lat: newLat, lng: newLng }) => {
                        setLat(String(newLat));
                        setLng(String(newLng));
                      }}
                      className="h-64 rounded-md border"
                    />
                  </TabsContent>

                  <TabsContent value="media" className="space-y-4 animate-fade-in">
                    <Alert>
                      <AlertTitle>✨ AURA</AlertTitle>
                      <AlertDescription>
                        Evaluará calidad de fotos y convertirá formatos no válidos automáticamente. (UI lista, lógica en fase 4)
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label>Fotos</Label>
                      <Input id="photoFiles" type="file" accept="image/jpeg" multiple onChange={handleSelectPhotos} />
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
                      <Label>Planos</Label>
                      <Input id="planFiles" type="file" accept="image/jpeg,application/pdf" multiple onChange={handleSelectPlans} />
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
