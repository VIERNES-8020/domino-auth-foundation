import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash, Archive, Plus, CheckCircle, ArchiveRestore, MoreVertical, Reply, Mail, MessageCircle, Bot } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import PropertyForm from "@/components/PropertyForm";
import ProfileForm from "@/components/ProfileForm";
import PropertyViewModal from "@/components/PropertyViewModal";
import DeletePropertyModal from "@/components/DeletePropertyModal";
import ArchivePropertyModal from "@/components/ArchivePropertyModal";
import NotificationResponseModal from "@/components/NotificationResponseModal";
import { supabase } from "@/integrations/supabase/client";

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState("propiedades");
  const [showArchived, setShowArchived] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [viewingProperty, setViewingProperty] = useState<any>(null);
  const [deletingProperty, setDeletingProperty] = useState<any>(null);
  const [archivingProperty, setArchivingProperty] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [propertyVisits, setPropertyVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingNotification, setRespondingNotification] = useState<any>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProfile(user.id);
        await fetchProperties(user.id);
        await fetchNotifications(user.id);
        await fetchPropertyVisits(user.id);
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

  const fetchProperties = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Error al cargar propiedades');
    }
  };

  const fetchNotifications = async (agentId: string) => {
    try {
      // Fetch both agent notifications and leads
      const [notificationsResult, leadsResult] = await Promise.all([
        supabase
          .from('agent_notifications')
          .select('*')
          .eq('to_agent_id', agentId)
          .order('created_at', { ascending: false }),
        supabase
          .from('agent_leads')
          .select('*')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false })
      ]);

      if (notificationsResult.error) throw notificationsResult.error;
      if (leadsResult.error) throw leadsResult.error;

        // Combine notifications and leads
        const combinedNotifications = [
          ...(notificationsResult.data || []),
          ...(leadsResult.data || []).map(lead => ({
            id: lead.id,
            message: `Nuevo contacto de ${lead.client_name} (${lead.client_email}): ${lead.message}`,
            created_at: lead.created_at,
            read: lead.status !== 'new',
            client_name: lead.client_name,
            client_email: lead.client_email,
            client_phone: lead.client_phone,
            type: 'lead'
          }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(combinedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchPropertyVisits = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('property_visits')
        .select(`
          *,
          properties (
            title,
            address
          )
        `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPropertyVisits(data || []);
    } catch (error) {
      console.error('Error fetching property visits:', error);
    }
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handlePropertySubmit = async (propertyData: any) => {
    if (!user) return;
    
    try {
      if (editingProperty) {
        // Update existing property
        const { error } = await supabase
          .from('properties')
          .update({
            title: propertyData.title,
            description: propertyData.description,
            price: parseFloat(propertyData.price),
            price_currency: propertyData.currency,
            property_type: propertyData.property_type,
            bedrooms: propertyData.bedrooms ? parseInt(propertyData.bedrooms) : null,
            bathrooms: propertyData.bathrooms ? parseInt(propertyData.bathrooms) : null,
            area_m2: propertyData.area ? parseFloat(propertyData.area) : null,
            constructed_area_m2: propertyData.constructed_area_m2 ? parseFloat(propertyData.constructed_area_m2) : null,
            address: propertyData.address,
            geolocation: propertyData.latitude && propertyData.longitude 
              ? `POINT(${propertyData.longitude} ${propertyData.latitude})` 
              : null,
            tags: propertyData.features,
            image_urls: propertyData.image_urls,
            video_url: propertyData.video_url,
            plans_url: propertyData.plans_url
          })
          .eq('id', editingProperty.id)
          .eq('agent_id', user.id);

        if (error) throw error;
        toast.success('Propiedad actualizada exitosamente');
      } else {
        // Create new property
        const { data, error } = await supabase
          .from('properties')
          .insert({
            title: propertyData.title,
            description: propertyData.description,
            price: parseFloat(propertyData.price),
            price_currency: propertyData.currency,
            property_type: propertyData.property_type,
            bedrooms: propertyData.bedrooms ? parseInt(propertyData.bedrooms) : null,
            bathrooms: propertyData.bathrooms ? parseInt(propertyData.bathrooms) : null,
            area_m2: propertyData.area ? parseFloat(propertyData.area) : null,
            constructed_area_m2: propertyData.constructed_area_m2 ? parseFloat(propertyData.constructed_area_m2) : null,
            address: propertyData.address,
            geolocation: propertyData.latitude && propertyData.longitude 
              ? `POINT(${propertyData.longitude} ${propertyData.latitude})` 
              : null,
            agent_id: user.id,
            status: 'approved',
            tags: propertyData.features,
            image_urls: propertyData.image_urls,
            video_url: propertyData.video_url,
            plans_url: propertyData.plans_url
          })
          .select();

        if (error) throw error;
        toast.success('Propiedad creada exitosamente');
      }
      
      // Refresh properties list
      await fetchProperties(user.id);
      setShowPropertyForm(false);
      setEditingProperty(null);
    } catch (error: any) {
      console.error('Error saving property:', error);
      toast.error('Error al guardar la propiedad: ' + error.message);
    }
  };

  const handleArchiveProperty = async (propertyId: string, isArchived: boolean, justification?: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          is_archived: isArchived,
          archive_reason: justification
        })
        .eq('id', propertyId)
        .eq('agent_id', user.id);

      if (error) throw error;
      
      toast.success(`Propiedad ${isArchived ? 'archivada' : 'desarchivada'} exitosamente`);
      
      // Refresh properties list
      await fetchProperties(user.id);
      setArchivingProperty(null);
    } catch (error: any) {
      console.error('Error archiving property:', error);
      toast.error('Error al archivar la propiedad');
    }
  };

  const handleDeleteProperty = async () => {
    if (!user || !deletingProperty) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', deletingProperty.id)
        .eq('agent_id', user.id);

      if (error) throw error;
      
      toast.success('Propiedad eliminada exitosamente');
      
      // Refresh properties list
      await fetchProperties(user.id);
      setDeletingProperty(null);
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast.error('Error al eliminar la propiedad');
      throw error; // Re-throw for modal to handle
    }
  };

  const handleConcludeProperty = async (propertyId: string, status: 'vendido' | 'alquilado' | 'anticretico') => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          concluded_status: status,
          concluded_at: new Date().toISOString()
        })
        .eq('id', propertyId)
        .eq('agent_id', user.id);

      if (error) throw error;
      
      toast.success(`Propiedad marcada como ${status.toUpperCase()}`);
      
      // Refresh properties list
      await fetchProperties(user.id);
    } catch (error: any) {
      console.error('Error concluding property:', error);
      toast.error('Error al marcar la propiedad como concluida');
    }
  };

  const handleVisitStatusChange = async (visitId: string, newStatus: 'confirmed' | 'cancelled') => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('property_visits')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', visitId)
        .eq('agent_id', user.id);

      if (error) throw error;
      
      toast.success(`Cita ${newStatus === 'confirmed' ? 'confirmada' : 'cancelada'} exitosamente`);
      
      // Refresh property visits list
      await fetchPropertyVisits(user.id);
    } catch (error: any) {
      console.error('Error updating visit status:', error);
      toast.error('Error al actualizar el estado de la cita');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p>Cargando panel del agente...</p>
        </div>
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
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/">Portal Principal</Link>
          </Button>
          <Button variant="outline" onClick={signOut}>
            Cerrar Sesión
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="propiedades">
            Mis Propiedades
          </TabsTrigger>
          <TabsTrigger value="citas">
            Citas Programadas
            {propertyVisits.filter(v => v.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {propertyVisits.filter(v => v.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="caracteristicas">
            Características
          </TabsTrigger>
          <TabsTrigger value="notificaciones">
            Mis Notificaciones
            {notifications.filter(n => !n.read).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {notifications.filter(n => !n.read).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="perfil">
            Mi Perfil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="propiedades" className="space-y-6">
          {showPropertyForm ? (
            <PropertyForm 
              onClose={() => {
                setShowPropertyForm(false);
                setEditingProperty(null);
              }}
              onSubmit={handlePropertySubmit}
              initialData={editingProperty}
            />
          ) : (
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
                    onClick={() => setShowPropertyForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva Propiedad
                  </Button>
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
                  {(!showArchived ? properties.filter(p => !p.is_archived && !p.concluded_status) : properties.filter(p => p.is_archived)).map((property) => (
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
                          ${property.price?.toLocaleString()} {property.price_currency || 'USD'}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={property.status === 'approved' ? 'default' : 'secondary'}>
                            {property.status}
                          </Badge>
                          {property.concluded_status && (
                            <Badge variant="destructive">
                              {property.concluded_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setViewingProperty(property)}
                          title="Ver propiedad"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingProperty(property);
                            setShowPropertyForm(true);
                          }}
                          title="Editar propiedad"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!showArchived && !property.concluded_status && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" title="Marcar como concluida">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleConcludeProperty(property.id, 'vendido')}>
                                Marcar como Vendido
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleConcludeProperty(property.id, 'alquilado')}>
                                Marcar como Alquilado
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleConcludeProperty(property.id, 'anticretico')}>
                                Marcar como En Anticrético
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <Button
                          variant={showArchived ? "default" : "secondary"}
                          size="sm"
                          onClick={() => setArchivingProperty(property)}
                          title={showArchived ? "Desarchivar" : "Archivar"}
                        >
                          {showArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setDeletingProperty(property)}
                          title="Eliminar propiedad"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(showArchived ? properties.filter(p => p.is_archived) : properties.filter(p => !p.is_archived && !p.concluded_status)).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {showArchived 
                        ? "No tienes propiedades archivadas." 
                        : "No tienes propiedades publicadas aún."}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="citas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Citas Programadas</CardTitle>
              <CardDescription>
                Gestiona las visitas a tus propiedades solicitadas por clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {propertyVisits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tienes citas programadas
                  </div>
                ) : (
                  propertyVisits.map((visit) => (
                    <div
                      key={visit.id}
                      className={`p-4 border rounded-lg ${visit.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : visit.status === 'confirmed' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} transition-all duration-200`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{visit.properties?.title}</h3>
                            <Badge variant={
                              visit.status === 'pending' ? 'secondary' : 
                              visit.status === 'confirmed' ? 'default' : 
                              'destructive'
                            }>
                              {visit.status === 'pending' ? 'Pendiente' : 
                               visit.status === 'confirmed' ? 'Confirmada' : 
                               'Cancelada'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            📍 {visit.properties?.address}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <p><strong>Cliente:</strong> {visit.client_name}</p>
                            <p><strong>Email:</strong> {visit.client_email}</p>
                            <p><strong>Teléfono:</strong> {visit.client_phone || 'No proporcionado'}</p>
                            <p><strong>Fecha programada:</strong> {new Date(visit.scheduled_at).toLocaleDateString()} {new Date(visit.scheduled_at).toLocaleTimeString()}</p>
                          </div>
                          {visit.message && (
                            <div className="mt-3 p-2 bg-muted rounded">
                              <p className="text-sm"><strong>Mensaje:</strong> {visit.message}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Solicitada el {new Date(visit.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {visit.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleVisitStatusChange(visit.id, 'confirmed')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              ✓ Confirmar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleVisitStatusChange(visit.id, 'cancelled')}
                            >
                              ✗ Cancelar
                            </Button>
                          </div>
                        )}
                        
                        {visit.status !== 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRespondingNotification({
                              id: visit.id,
                              client_name: visit.client_name,
                              client_email: visit.client_email,
                              client_phone: visit.client_phone,
                              type: 'visit',
                              property_title: visit.properties?.title
                            })}
                          >
                            <Reply className="h-4 w-4 mr-1" />
                            Contactar Cliente
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["Piscina", "Gym", "Estacionamiento", "Jardín", "Balcón", "Terraza", "Seguridad 24h", "Ascensor", "Aire Acondicionado", "Calefacción", "Parrillero", "Cochera"].map((feature) => (
                  <Button
                    key={feature}
                    variant={selectedFeatures.includes(feature) ? "default" : "outline"}
                    onClick={() => toggleFeature(feature)}
                    className="p-3 h-auto"
                  >
                    <p className="text-sm font-medium">{feature}</p>
                  </Button>
                ))}
              </div>
              {selectedFeatures.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Características seleccionadas:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFeatures.join(", ")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mis Notificaciones</CardTitle>
              <CardDescription>
                Mensajes y leads recibidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tienes notificaciones
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg ${!notification.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/20'} transition-all duration-200`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-sm mb-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                          {notification.type === 'lead' && (
                            <div className="flex gap-1 mt-2">
                              {notification.client_email && (
                                <Badge variant="outline" className="text-xs">
                                  📧 {notification.client_email}
                                </Badge>
                              )}
                              {notification.client_phone && (
                                <Badge variant="outline" className="text-xs">
                                  📱 {notification.client_phone}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {notification.type === 'lead' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRespondingNotification(notification)}
                              className="flex items-center gap-1 text-xs"
                            >
                              <Reply className="h-3 w-3" />
                              Responder
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perfil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mi Perfil</CardTitle>
              <CardDescription>
                Actualiza tu información personal y profesional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {viewingProperty && (
        <PropertyViewModal
          property={viewingProperty}
          isOpen={!!viewingProperty}
          onClose={() => setViewingProperty(null)}
        />
      )}

      {deletingProperty && (
        <DeletePropertyModal
          isOpen={!!deletingProperty}
          onClose={() => setDeletingProperty(null)}
          onConfirm={handleDeleteProperty}
          propertyTitle={deletingProperty?.title || ""}
        />
      )}

      {archivingProperty && (
        <ArchivePropertyModal
          property={archivingProperty}
          isOpen={!!archivingProperty}
          onClose={() => setArchivingProperty(null)}
          onConfirm={(justification) => {
            handleArchiveProperty(archivingProperty.id, !archivingProperty.is_archived, justification);
          }}
        />
      )}

      {respondingNotification && (
        <NotificationResponseModal
          isOpen={!!respondingNotification}
          onClose={() => setRespondingNotification(null)}
          notification={respondingNotification}
          clientEmail={respondingNotification.client_email}
          clientName={respondingNotification.client_name}
          clientPhone={respondingNotification.client_phone}
          agentProfile={profile}
        />
      )}
    </div>
  );
}