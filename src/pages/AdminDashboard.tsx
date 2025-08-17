import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, CheckCircle, XCircle, Bell, MailIcon, Users, Building2, TrendingUp, Image } from "lucide-react";
import TestimonialManagement from "@/components/admin/TestimonialManagement";
import AboutPageManagement from "@/components/admin/AboutPageManagement";
import WatermarkManagement from "@/components/admin/WatermarkManagement";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("propiedades");
  const [properties, setProperties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [franchiseApplications, setFranchiseApplications] = useState<any[]>([]);
  const [listingLeads, setListingLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch properties
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
      
      setProperties(propertiesData || []);

      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      setUsers(usersData || []);

      // Fetch contact messages
      const { data: messagesData } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      setContactMessages(messagesData || []);

      // Fetch admin notifications
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { data: notificationsData } = await supabase
          .from('admin_notifications')
          .select('*')
          .eq('user_id', auth.user.id)
          .order('created_at', { ascending: false });
        
        setNotifications(notificationsData || []);
      }

      // Fetch franchise applications
      const { data: franchiseData } = await supabase
        .from('franchise_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      setFranchiseApplications(franchiseData || []);

      // Fetch listing leads
      const { data: listingData } = await supabase
        .from('listing_leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      setListingLeads(listingData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updatePropertyStatus = async (propertyId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status })
        .eq('id', propertyId);

      if (error) throw error;
      
      await fetchAllData();
      toast.success(`Propiedad ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`);
    } catch (error: any) {
      toast.error('Error actualizando propiedad: ' + error.message);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Super Administrador</h1>
          <p className="text-muted-foreground">Control total de la plataforma DOMINIO</p>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes Contacto</CardTitle>
            <MailIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactMessages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.filter(n => !n.read).length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="propiedades">Propiedades</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="mensajes" className="relative">
            Mensajes de Contacto
            {contactMessages.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {contactMessages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="franquicias" className="relative">
            Solicitudes de Franquicia
            {franchiseApplications.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {franchiseApplications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leads" className="relative">
            Leads Venta/Alquiler
            {listingLeads.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {listingLeads.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="testimonios">
            Testimonios
          </TabsTrigger>
          <TabsTrigger value="sobre-nosotros">
            Sobre Nosotros
          </TabsTrigger>
          <TabsTrigger value="marca-agua">
            <Image className="h-4 w-4 mr-1" />
            Marca de Agua
          </TabsTrigger>
          <TabsTrigger value="notificaciones" className="relative">
            Notificaciones
            {notifications.filter(n => !n.read).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {notifications.filter(n => !n.read).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="propiedades" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Propiedades</CardTitle>
              <CardDescription>
                Aprueba o rechaza las propiedades publicadas por los agentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando propiedades...
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay propiedades registradas
                  </div>
                ) : (
                  properties.map((property) => (
                    <div key={property.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">{property.title}</h4>
                          <p className="text-sm text-muted-foreground">{property.address}</p>
                          <p className="text-lg font-bold">
                            ${property.price?.toLocaleString()} {property.price_currency}
                          </p>
                          <Badge 
                            variant={property.status === 'approved' ? 'default' : 
                                   property.status === 'rejected' ? 'destructive' : 'secondary'}
                          >
                            {property.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updatePropertyStatus(property.id, 'approved')}
                            disabled={property.status === 'approved'}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updatePropertyStatus(property.id, 'rejected')}
                            disabled={property.status === 'rejected'}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Lista de todos los usuarios registrados en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando usuarios...
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay usuarios registrados
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{user.full_name || 'Sin nombre'}</h4>
                          <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                          <p className="text-sm">Agente: {user.agent_code || 'No asignado'}</p>
                          <span className="text-xs text-muted-foreground">
                            Registrado: {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {user.is_super_admin ? 'Super Admin' : 'Usuario'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mensajes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailIcon className="h-5 w-5" />
                Mensajes de Contacto
              </CardTitle>
              <CardDescription>
                Mensajes recibidos desde el formulario de contacto del sitio web
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contactMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay mensajes de contacto
                  </div>
                ) : (
                  contactMessages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{message.name}</h4>
                          <p className="text-sm text-muted-foreground">{message.email}</p>
                          {message.phone && (
                            <p className="text-sm text-muted-foreground">Tel: {message.phone}</p>
                          )}
                          {message.whatsapp && (
                            <p className="text-sm text-muted-foreground">WhatsApp: {message.whatsapp}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="franquicias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de Franquicia</CardTitle>
              <CardDescription>
                Gestiona las solicitudes de nuevas franquicias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {franchiseApplications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay solicitudes de franquicia.
                  </div>
                ) : (
                  franchiseApplications.map((application) => (
                    <div
                      key={application.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">{application.full_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {application.email} | {application.phone}
                          </p>
                          <p className="text-sm">
                            <strong>Ciudad:</strong> {application.city}, {application.country}
                          </p>
                          {application.message && (
                            <p className="text-sm mt-2">
                              <strong>Mensaje:</strong> {application.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Recibido: {new Date(application.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            application.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : application.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {application.status === 'pending' ? 'Pendiente' : 
                             application.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                          </span>
                          {application.photo_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={application.photo_url} target="_blank" rel="noreferrer">
                                Ver Foto
                              </a>
                            </Button>
                          )}
                          {application.cv_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={application.cv_url} target="_blank" rel="noreferrer">
                                Ver CV
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leads de Venta/Alquiler</CardTitle>
              <CardDescription>
                Clientes que quieren vender o alquilar su propiedad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {listingLeads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay leads de venta/alquiler aún.
                  </div>
                ) : (
                  listingLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{lead.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{lead.email}</p>
                          {lead.phone && (
                            <p className="text-sm text-muted-foreground">Tel: {lead.phone}</p>
                          )}
                          {lead.whatsapp && (
                            <p className="text-sm text-muted-foreground">WhatsApp: {lead.whatsapp}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.request_type === 'venta' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {lead.request_type === 'venta' ? 'VENTA' : 'ALQUILER'}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {lead.city_country && (
                        <p className="text-sm"><strong>Ciudad:</strong> {lead.city_country}</p>
                      )}
                      {lead.property_location && (
                        <p className="text-sm"><strong>Ubicación:</strong> {lead.property_location}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testimonios" className="space-y-6">
          <TestimonialManagement />
        </TabsContent>

        <TabsContent value="marca-agua" className="space-y-6">
          <WatermarkManagement />
        </TabsContent>

        <TabsContent value="sobre-nosotros" className="space-y-6">
          <AboutPageManagement />
        </TabsContent>

        <TabsContent value="notificaciones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones del Sistema
              </CardTitle>
              <CardDescription>
                Notificaciones administrativas y alertas del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay notificaciones
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`border rounded-lg p-4 ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {!notification.read && (
                          <Badge variant="destructive">Nuevo</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}