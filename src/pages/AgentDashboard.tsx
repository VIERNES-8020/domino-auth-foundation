import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, Edit, Trash, Archive, Plus, CheckCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import PropertyForm from "@/components/PropertyForm";
import ProfileForm from "@/components/ProfileForm";
import PropertyViewModal from "@/components/PropertyViewModal";
import DeletePropertyModal from "@/components/DeletePropertyModal";
import ArchivePropertyModal, { ArchivePropertyModalProps } from "@/components/ArchivePropertyModal";
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
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProperties(user.id);
        await fetchNotifications(user.id);
      }
    };
    getCurrentUser();
  }, []);

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
          read: lead.status !== 'new'
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(combinedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
            tags: propertyData.features
          })
          .eq('id', editingProperty.id)
          .eq('agent_id', user.id);

        if (error) throw error;
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
            tags: propertyData.features
          })
          .select();

        if (error) throw error;
      }
      
      // Refresh properties list
      await fetchProperties(user.id);
      setShowPropertyForm(false);
      setEditingProperty(null);
      
      // Reset form and return to first tab
      setActiveTab("propiedades");
    } catch (error: any) {
      console.error('Error saving property:', error);
    }
  };

  const handleArchiveProperty = async (propertyId: string, isArchived: boolean, justification?: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          is_archived: isArchived,
          // You could add an archive_reason field to store justification
        })
        .eq('id', propertyId)
        .eq('agent_id', user.id);

      if (error) throw error;
      
      // Refresh properties list
      await fetchProperties(user.id);
    } catch (error: any) {
      console.error('Error archiving property:', error);
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
      
      // Refresh properties list
      await fetchProperties(user.id);
      setDeletingProperty(null);
    } catch (error: any) {
      console.error('Error deleting property:', error);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel del Agente</h1>
          <p className="text-muted-foreground">Gestiona tus propiedades y perfil</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger 
            value="propiedades" 
            className={`${activeTab === 'propiedades' ? 'bg-primary text-primary-foreground border-b-2 border-primary' : ''}`}
          >
            Mis Propiedades
          </TabsTrigger>
          <TabsTrigger 
            value="caracteristicas"
            className={`${activeTab === 'caracteristicas' ? 'bg-primary text-primary-foreground border-b-2 border-primary' : ''}`}
          >
            Características
          </TabsTrigger>
          <TabsTrigger 
            value="notificaciones"
            className={`${activeTab === 'notificaciones' ? 'bg-primary text-primary-foreground border-b-2 border-primary' : ''}`}
          >
            Mis Notificaciones
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="ml-2 bg-red-500 text-white rounded-full text-xs px-2 py-1">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="concluidas"
            className={`${activeTab === 'concluidas' ? 'bg-primary text-primary-foreground border-b-2 border-primary' : ''}`}
          >
            Propiedades Concluidas
          </TabsTrigger>
          <TabsTrigger 
            value="perfil"
            className={`${activeTab === 'perfil' ? 'bg-primary text-primary-foreground border-b-2 border-primary' : ''}`}
          >
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
                      {!showArchived && (
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
                        {showArchived ? <Eye className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
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
                Mensajes de clientes interesados en tus propiedades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tienes notificaciones nuevas.
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">
                            {notification.message}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            Nuevo
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="concluidas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mis Propiedades Concluidas</CardTitle>
              <CardDescription>
                Propiedades que has vendido, alquilado o puesto en anticrético
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {properties.filter(p => p.concluded_status).map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-green-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{property.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {property.address}
                      </p>
                      <p className="text-lg font-bold">
                        ${property.price?.toLocaleString()} {property.price_currency || 'USD'}
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {property.concluded_status === 'vendido' && 'VENDIDO'}
                          {property.concluded_status === 'alquilado' && 'ALQUILADO'}
                          {property.concluded_status === 'anticretico' && 'EN ANTICRÉTICO'}
                        </span>
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
                    </div>
                  </div>
                ))}
                {properties.filter(p => p.concluded_status).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No tienes propiedades concluidas aún.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perfil" className="space-y-6">
          {user ? (
            <ProfileForm user={user} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Mi Perfil</CardTitle>
                <CardDescription>
                  Gestiona tu información personal y profesional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Cargando perfil...
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PropertyViewModal
        property={viewingProperty}
        isOpen={!!viewingProperty}
        onClose={() => setViewingProperty(null)}
      />
      
      <DeletePropertyModal
        isOpen={!!deletingProperty}
        onClose={() => setDeletingProperty(null)}
        onConfirm={handleDeleteProperty}
        propertyTitle={deletingProperty?.title || ""}
      />
      
      <ArchivePropertyModal
        property={archivingProperty}
        isOpen={!!archivingProperty}
        onClose={() => setArchivingProperty(null)}
        onConfirm={(justification) => {
          if (archivingProperty) {
            handleArchiveProperty(
              archivingProperty.id, 
              !archivingProperty.is_archived, 
              justification
            );
            setArchivingProperty(null);
          }
        }}
      />
    </div>
  );
}