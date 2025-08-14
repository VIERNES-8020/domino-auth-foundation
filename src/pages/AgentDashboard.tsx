import { useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit, Trash, Upload, Archive } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProfileForm from "@/components/ProfileForm";

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState("propiedades");
  const [showArchived, setShowArchived] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const user = useUser();

  const { data: properties = [], refetch: refetchProperties } = useQuery({
    queryKey: ["agent-properties", user?.id, showArchived],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("agent_id", user.id)
        .eq("is_archived", showArchived)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId);

      if (error) throw error;

      toast({
        title: "Propiedad eliminada",
        description: "La propiedad ha sido eliminada exitosamente.",
      });

      refetchProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la propiedad. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleArchiveProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from("properties")
        .update({ is_archived: !showArchived })
        .eq("id", propertyId);

      if (error) throw error;

      toast({
        title: showArchived ? "Propiedad restaurada" : "Propiedad archivada",
        description: showArchived 
          ? "La propiedad ha sido restaurada exitosamente." 
          : "La propiedad ha sido archivada exitosamente.",
      });

      refetchProperties();
    } catch (error) {
      console.error("Error archiving property:", error);
      toast({
        title: "Error",
        description: "No se pudo archivar la propiedad. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
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
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel del Agente</h1>
          <p className="text-muted-foreground">Gestiona tus propiedades y perfil</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="propiedades">Mis Propiedades</TabsTrigger>
          <TabsTrigger value="caracteristicas">Características</TabsTrigger>
          <TabsTrigger value="perfil">Mi Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="propiedades" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{showArchived ? "Propiedades Archivadas" : "Mis Propiedades"}</CardTitle>
                <CardDescription>
                  {showArchived 
                    ? "Propiedades que has archivado" 
                    : "Gestiona todas tus propiedades publicadas"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={!showArchived ? "default" : "outline"}
                  onClick={() => setShowArchived(false)}
                >
                  Activas
                </Button>
                <Button
                  variant={showArchived ? "default" : "outline"}
                  onClick={() => setShowArchived(true)}
                >
                  Archivadas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{property.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {property.address}
                      </p>
                      <p className="text-lg font-bold">
                        ${property.price?.toLocaleString()} {property.price_currency}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/property/${property.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => console.log("Edit property", property.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={showArchived ? "default" : "secondary"}
                        size="sm"
                        onClick={() => handleArchiveProperty(property.id)}
                      >
                        {showArchived ? <Eye className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProperty(property.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {properties.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {showArchived 
                      ? "No tienes propiedades archivadas." 
                      : "No tienes propiedades publicadas aún."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caracteristicas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Características de las Propiedades</CardTitle>
              <CardDescription>
                Gestiona las amenidades y características disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidad de características en desarrollo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perfil" className="space-y-6">
          <ProfileForm user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}