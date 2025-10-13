import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Home, CheckCircle, Building2, Eye, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function OfficeManagerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [officeProperties, setOfficeProperties] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Panel de Administración - Dominio Inmobiliaria";
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchProfile(user.id);
        await fetchProperties();
      }
      setLoading(false);
    };
    getCurrentUser();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      // Primero obtenemos las propiedades
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (propertiesError) throw propertiesError;

      // Luego obtenemos la información de los agentes
      if (properties && properties.length > 0) {
        const agentIds = [...new Set(properties.map(p => p.agent_id))];
        const { data: agents, error: agentsError } = await supabase
          .from('profiles')
          .select('id, full_name, agent_code')
          .in('id', agentIds);
        
        if (agentsError) throw agentsError;

        // Combinamos los datos
        const enrichedProperties = properties.map(property => ({
          ...property,
          profiles: agents?.find(agent => agent.id === property.agent_id)
        }));

        setOfficeProperties(enrichedProperties);
      } else {
        setOfficeProperties([]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Error al cargar las propiedades');
      setOfficeProperties([]);
    }
  };

  const handleUpdatePropertyStatus = async (propertyId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId);

      if (error) throw error;
      
      toast.success(`Propiedad ${newStatus === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`);
      await fetchProperties();
    } catch (error) {
      console.error('Error updating property status:', error);
      toast.error('Error al actualizar el estado de la propiedad');
    }
  };

  const approvedProperties = officeProperties.filter(p => p.status === 'approved');
  const pendingProperties = officeProperties.filter(p => p.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Modern Header Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 rounded-2xl border border-amber-500/10 shadow-lg">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    {profile?.avatar_url && (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/20">
                        <img 
                          src={profile.avatar_url} 
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full animate-pulse"></div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-amber-600">
                        Panel de Administración
                      </h1>
                    </div>
                  </div>
                  {profile && (
                    <div className="space-y-2">
                      <p className="text-lg text-muted-foreground">
                        Bienvenido, <span className="font-semibold text-amber-600">{profile.full_name || user?.email}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-sm font-mono bg-amber-500/5 border-amber-500/20 text-amber-600">
                          Administración (Encargado de Oficina)
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {profile?.franchises?.name || 'Sin oficina'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <Link to="/">Portal Principal</Link>
                  </Button>
                  <Button variant="outline" onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  }}>
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </div>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inmuebles Cargados</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedProperties.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingProperties.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mi Oficina</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold">{profile?.franchises?.name || 'Sin asignar'}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inmuebles de la Oficina</CardTitle>
            <CardDescription>Gestiona las propiedades de tu oficina</CardDescription>
          </CardHeader>
          <CardContent>
            {officeProperties.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay inmuebles registrados
              </p>
            ) : (
              <div className="space-y-4">
                {officeProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{property.title}</h3>
                        <Badge variant={property.status === 'approved' ? 'default' : 'secondary'}>
                          {property.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {property.address}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Agente: {property.profiles?.full_name || 'N/A'}
                        </span>
                        <span className="text-muted-foreground">
                          Código: {property.property_code || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/propiedad/${property.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Link>
                      </Button>
                      {property.status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleUpdatePropertyStatus(property.id, 'approved')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUpdatePropertyStatus(property.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
