import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash, Archive, Plus, CheckCircle, ArchiveRestore, MoreVertical, Reply, Mail, MessageCircle, Bot, User, TrendingUp, Clock, CheckSquare, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import PropertyForm from "@/components/PropertyForm";
import ProfileForm from "@/components/ProfileForm";
import PropertyViewModal from "@/components/PropertyViewModal";
import DeletePropertyModal from "@/components/DeletePropertyModal";
import ArchivePropertyModal from "@/components/ArchivePropertyModal";
import NotificationResponseModal from "@/components/NotificationResponseModal";
import PropertyTypeStats from "@/components/PropertyTypeStats";
import SalesProcessStats from "@/components/SalesProcessStats";
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
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<{type: string; status: 'all' | 'active' | 'concluded'} | null>(null);

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
      // First get all property visits for the agent
      const { data: visits, error: visitsError } = await supabase
        .from('property_visits')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (visitsError) throw visitsError;

      if (visits && visits.length > 0) {
        // Get property IDs
        const propertyIds = visits.map(visit => visit.property_id);
        
        // Get property details
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('id, title, address')
          .in('id', propertyIds);

        if (propertiesError) throw propertiesError;

        // Combine visits with property data
        const visitsWithProperties = visits.map(visit => ({
          ...visit,
          properties: properties?.find(p => p.id === visit.property_id) || null
        }));

        setPropertyVisits(visitsWithProperties);
      } else {
        setPropertyVisits([]);
      }
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
    console.log("=== HANDLEPROPERTYSUBMIT INICIADO ===");
    console.log("User:", user ? "Existe" : "No existe");
    console.log("PropertyData recibida:", propertyData);
    
    if (!user) {
      console.error("No hay usuario autenticado");
      throw new Error("Usuario no autenticado");
    }
    
    try {
      console.log("EditingProperty:", editingProperty ? "Editando" : "Creando nueva");
      
      if (editingProperty) {
        // Get current edit count and increment it
        const { data: currentProperty, error: fetchError } = await supabase
          .from('properties')
          .select('edit_count')
          .eq('id', editingProperty.id)
          .single();

        if (fetchError) throw fetchError;

        // Update existing property with incremented edit count
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
            plans_url: propertyData.plans_url,
            edit_count: (currentProperty?.edit_count || 0) + 1
          })
          .eq('id', editingProperty.id)
          .eq('agent_id', user.id);

        if (error) {
          console.error("Error actualizando propiedad:", error);
          throw error;
        }
        console.log("Propiedad actualizada exitosamente");
        toast.success('Propiedad actualizada exitosamente');
      } else {
        // Create new property
        console.log("Creando nueva propiedad con datos:", {
          title: propertyData.title,
          price: parseFloat(propertyData.price),
          agent_id: user.id
        });
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

        if (error) {
          console.error("Error creando propiedad:", error);
          console.error("Detalles del error:", error.details, error.hint, error.code);
          throw error;
        }
        
        console.log("Propiedad creada exitosamente:", data);
        toast.success('Propiedad creada exitosamente');
      }
      
      console.log("Refrescando lista de propiedades...");
      // Refresh properties list
      await fetchProperties(user.id);
      setShowPropertyForm(false);
      setEditingProperty(null);
      console.log("=== HANDLEPROPERTYSUBMIT COMPLETADO EXITOSAMENTE ===");
    } catch (error: any) {
      console.error('=== ERROR EN HANDLEPROPERTYSUBMIT ===');
      console.error('Error saving property:', error);
      console.error('Error completo:', error);
      toast.error('Error al guardar la propiedad: ' + (error.message || 'Error desconocido'));
      // Re-throw the error so PropertyForm can catch it
      throw error;
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

  const handleDeleteProperty = async (reason: string) => {
    if (!user || !deletingProperty) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', deletingProperty.id)
        .eq('agent_id', user.id);

      if (error) throw error;
      
      // Log the deletion reason (you could save this to a deletion_log table if needed)
      console.log(`Property deleted: ${deletingProperty.title}, Reason: ${reason}`);
      
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

  const handlePropertyTypeFilter = (type: string, status: 'all' | 'active' | 'concluded') => {
    setPropertyTypeFilter({ type, status });
  };

  const getFilteredProperties = () => {
    let filtered = properties;
    
    // Apply archived/active filter first
    filtered = filtered.filter(property => showArchived ? property.is_archived : !property.is_archived);
    
    // Apply property type filter if active
    if (propertyTypeFilter) {
      // Filter by property type
      filtered = filtered.filter(p => 
        p.property_type?.toLowerCase() === propertyTypeFilter.type.toLowerCase()
      );
      
      // Filter by status (active vs concluded)
      if (propertyTypeFilter.status === 'active') {
        filtered = filtered.filter(p => !p.concluded_status);
      } else if (propertyTypeFilter.status === 'concluded') {
        filtered = filtered.filter(p => p.concluded_status);
      }
      // 'all' doesn't need additional filtering
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-transparent animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-primary">Cargando Panel de Agente</h3>
                <p className="text-muted-foreground">Preparando tu espacio de trabajo...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Modern Header Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5 rounded-2xl border border-primary/10 shadow-lg">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    {profile?.avatar_url && (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                        <img 
                          src={profile.avatar_url} 
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse"></div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-primary">
                        Panel de Agente
                      </h1>
                    </div>
                  </div>
                  {profile && (
                    <div className="space-y-2">
                      <p className="text-lg text-muted-foreground">
                        Bienvenido, <span className="font-semibold text-primary">{profile.full_name || 'Agente'}</span>
                      </p>
                      {profile.agent_code && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm font-mono bg-primary/5 border-primary/20 text-primary">
                            ID: {profile.agent_code}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {properties.length} Propiedades
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {propertyVisits.length} Citas
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => setShowPropertyForm(true)}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva Propiedad
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/">Portal Principal</Link>
                  </Button>
                  <Button variant="outline" onClick={signOut}>
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950 dark:to-blue-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Propiedades Activas</p>
                    <p className="text-2xl font-bold text-blue-600">{properties.filter(p => !p.is_archived).length}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Citas Pendientes</p>
                    <p className="text-2xl font-bold text-green-600">{propertyVisits.filter(v => v.status === 'pending').length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 dark:from-orange-950 dark:to-orange-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Notificaciones</p>
                    <p className="text-2xl font-bold text-orange-600">{notifications.filter(n => !n.read).length}</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950 dark:to-purple-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Citas Confirmadas</p>
                    <p className="text-2xl font-bold text-purple-600">{propertyVisits.filter(v => v.status === 'confirmed').length}</p>
                  </div>
                  <CheckSquare className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property Type Statistics */}
          <PropertyTypeStats 
            properties={properties}
            onFilterChange={handlePropertyTypeFilter}
          />

          {/* Sales Process Statistics */}
          <SalesProcessStats agentId={profile?.id || ''} />

          {/* Enhanced Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-background to-background/90 border-2 border-primary/10 shadow-lg rounded-xl p-1 backdrop-blur-sm">
              <TabsTrigger 
                value="propiedades" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg transition-all duration-300"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Mis Propiedades</span>
                <span className="sm:hidden">Props</span>
              </TabsTrigger>
              <TabsTrigger 
                value="citas" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg transition-all duration-300"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Citas Programadas</span>
                <span className="sm:hidden">Citas</span>
                {propertyVisits.filter(v => v.status === 'pending').length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full animate-pulse">
                    {propertyVisits.filter(v => v.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="caracteristicas" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg transition-all duration-300"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">Características</span>
                <span className="lg:hidden">Caract.</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notificaciones" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg transition-all duration-300"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Notificaciones</span>
                <span className="sm:hidden">Notifs</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full animate-pulse">
                    {notifications.filter(n => !n.read).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="perfil" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg transition-all duration-300"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Mi Perfil</span>
                <span className="sm:hidden">Perfil</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents with improved spacing */}
            <div className="mt-6">
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
                  <Card className="shadow-lg border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                      <div>
                        <CardTitle className="text-xl">{showArchived ? "Propiedades Archivadas" : "Mis Propiedades"}</CardTitle>
                        <CardDescription>
                          {showArchived 
                            ? "Propiedades que has archivado" 
                            : "Gestiona y supervisa todas tus propiedades"
                          }
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowArchived(!showArchived)}
                        >
                          {showArchived ? (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Activas
                            </>
                          ) : (
                            <>
                              <Archive className="h-4 w-4 mr-2" />
                              Ver Archivadas
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setShowPropertyForm(true)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Nueva Propiedad
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {properties.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Eye className="h-12 w-12 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No hay propiedades</h3>
                          <p className="text-muted-foreground mb-4">
                            {showArchived 
                              ? "No tienes propiedades archivadas." 
                              : "Comienza agregando tu primera propiedad."
                            }
                          </p>
                          {!showArchived && (
                            <Button onClick={() => setShowPropertyForm(true)} className="gap-2">
                              <Plus className="h-4 w-4" />
                              Agregar Primera Propiedad
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {getFilteredProperties().map((property) => (
                              <Card key={property.id} className="group hover:shadow-xl transition-all duration-300 border-primary/10 hover:border-primary/30">
                                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                                  <img
                                    src={property.image_urls?.[0] || '/default-placeholder.jpg'}
                                    alt={property.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/default-placeholder.jpg';
                                    }}
                                  />
                                  {property.concluded_status && (
                                    <Badge className="absolute top-2 left-2 bg-green-500">
                                      {property.concluded_status.toUpperCase()}
                                    </Badge>
                                  )}
                                </div>
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div>
                                      <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                        {property.title}
                                      </h3>
                                      <p className="text-sm text-muted-foreground line-clamp-1">{property.address}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="font-bold text-primary text-lg">
                                        {property.price_currency === 'USD' ? 'US$' : property.price_currency} {property.price?.toLocaleString()}
                                      </div>
                                      <Badge variant={property.status === 'approved' ? 'default' : 'secondary'}>
                                        {property.status}
                                      </Badge>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setViewingProperty(property)}
                                          className="gap-1"
                                        >
                                          <Eye className="h-3 w-3" />
                                          Ver
                                        </Button>
                                        {property.edit_count > 0 && (
                                          <Badge variant="secondary" className="text-xs px-2 py-1">
                                            Editado {property.edit_count} {property.edit_count === 1 ? 'vez' : 'veces'}
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                           <DropdownMenuItem onClick={() => {
                                             setEditingProperty(property);
                                             setShowPropertyForm(true);
                                           }}>
                                             <Edit className="mr-2 h-4 w-4" />
                                             Editar
                                           </DropdownMenuItem>
                                          {property.is_archived ? (
                                            <DropdownMenuItem onClick={() => handleArchiveProperty(property.id, false)}>
                                              <ArchiveRestore className="mr-2 h-4 w-4" />
                                              Desarchivar
                                            </DropdownMenuItem>
                                          ) : (
                                            <DropdownMenuItem onClick={() => setArchivingProperty(property)}>
                                              <Archive className="mr-2 h-4 w-4" />
                                              Archivar
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem
                                            onClick={() => setDeletingProperty(property)}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <Trash className="mr-2 h-4 w-4" />
                                            Eliminar
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="citas" className="space-y-6">
                <Card className="shadow-lg border-primary/10">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                    <CardTitle className="text-xl">Citas Programadas</CardTitle>
                    <CardDescription>Gestiona las visitas a tus propiedades solicitadas por clientes</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {propertyVisits.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                          <CheckCircle className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No hay citas programadas</h3>
                        <p className="text-muted-foreground">Las citas solicitadas por clientes aparecerán aquí.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {propertyVisits.map((visit) => (
                          <Card key={visit.id} className="border-l-4 border-l-primary/30 hover:border-l-primary transition-colors">
                            <CardContent className="p-4">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">{visit.properties?.title}</h4>
                                    <Badge variant={
                                      visit.status === 'pending' ? 'destructive' :
                                      visit.status === 'confirmed' ? 'default' : 'secondary'
                                    }>
                                      {visit.status === 'pending' ? 'Pendiente' :
                                       visit.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{visit.properties?.address}</p>
                                  <div className="space-y-1 text-sm">
                                    <p><strong>Cliente:</strong> {visit.client_name}</p>
                                    <p><strong>Email:</strong> {visit.client_email}</p>
                                    {visit.client_phone && <p><strong>Teléfono:</strong> {visit.client_phone}</p>}
                                    <p><strong>Fecha:</strong> {new Date(visit.scheduled_at).toLocaleDateString('es-ES', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}</p>
                                    {visit.message && (
                                      <p><strong>Mensaje:</strong> {visit.message}</p>
                                    )}
                                  </div>
                                </div>
                                
                                {visit.status === 'pending' && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleVisitStatusChange(visit.id, 'confirmed')}
                                      className="gap-1"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Confirmar
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleVisitStatusChange(visit.id, 'cancelled')}
                                      className="gap-1"
                                    >
                                      <X className="h-4 w-4" />
                                      Cancelar
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="caracteristicas" className="space-y-6">
                <Card className="shadow-lg border-primary/10">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                    <CardTitle className="text-xl">Gestión de Características</CardTitle>
                    <CardDescription>Administra las características disponibles para tus propiedades</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Funcionalidad de características próximamente...</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notificaciones" className="space-y-6">
                <Card className="shadow-lg border-primary/10">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                    <CardTitle className="text-xl">Mis Notificaciones</CardTitle>
                    <CardDescription>Mensajes y notificaciones importantes</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {notifications.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                          <MessageCircle className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
                        <p className="text-muted-foreground">Las notificaciones aparecerán aquí cuando las recibas.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notifications.map((notification) => (
                          <Card key={notification.id} className={`transition-all duration-300 ${!notification.read ? 'border-primary/20 bg-primary/5' : 'border-muted'}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                  {notification.title && (
                                    <h4 className="font-semibold">{notification.title}</h4>
                                  )}
                                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(notification.created_at).toLocaleDateString('es-ES', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setRespondingNotification(notification)}
                                    className="gap-1"
                                  >
                                    <Reply className="h-3 w-3" />
                                    Responder
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="perfil" className="space-y-6">
                <ProfileForm user={user} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

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
          propertyTitle={deletingProperty.title}
          isOpen={!!deletingProperty}
          onClose={() => setDeletingProperty(null)}
          onConfirm={handleDeleteProperty}
        />
      )}

      {archivingProperty && (
        <ArchivePropertyModal
          property={archivingProperty}
          isOpen={!!archivingProperty}
          onClose={() => setArchivingProperty(null)}
          onConfirm={(justification) => handleArchiveProperty(archivingProperty.id, true, justification)}
        />
      )}

      {respondingNotification && (
        <NotificationResponseModal
          notification={respondingNotification}
          isOpen={!!respondingNotification}
          onClose={() => setRespondingNotification(null)}
        />
      )}
    </div>
  );
}