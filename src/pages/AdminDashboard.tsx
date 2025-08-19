import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, CheckCircle, XCircle, Bell, MailIcon, Users, Building2, TrendingUp, Image, UserCheck, UserX, Settings } from "lucide-react";
import TestimonialManagement from "@/components/admin/TestimonialManagement";
import AboutPageManagement from "@/components/admin/AboutPageManagement";
import WatermarkManagement from "@/components/admin/WatermarkManagement";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("propiedades");
  const [properties, setProperties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [franchiseApplications, setFranchiseApplications] = useState<any[]>([]);
  const [listingLeads, setListingLeads] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
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

      // Fetch users with profiles
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      setUsers(usersData || []);

      // Fetch user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*');
      
      setUserRoles(rolesData || []);

      // Fetch franchises
      const { data: franchisesData } = await supabase
        .from('franchises')
        .select('*')
        .order('created_at', { ascending: false });
      
      setFranchises(franchisesData || []);

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

  const updateUserRole = async (userId: string, newRole: "agent" | "client") => {
    try {
      // Check if user already has a role
      const existingRole = userRoles.find(r => r.user_id === userId);
      
      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole as any })
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole as any });
        
        if (error) throw error;
      }
      
      // If setting as agent, make sure they're not super admin
      if (newRole === 'agent') {
        await supabase
          .from('profiles')
          .update({ is_super_admin: false })
          .eq('id', userId);
      }
      
      await fetchAllData();
      toast.success('Rol de usuario actualizado exitosamente');
    } catch (error: any) {
      toast.error('Error actualizando rol: ' + error.message);
    }
  };

  const toggleSuperAdmin = async (userId: string, isSuperAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_super_admin: isSuperAdmin })
        .eq('id', userId);

      if (error) throw error;
      
      // If making super admin, remove from user_roles
      if (isSuperAdmin) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
      }
      
      await fetchAllData();
      toast.success(`Usuario ${isSuperAdmin ? 'promovido a' : 'removido de'} Super Administrador`);
    } catch (error: any) {
      toast.error('Error actualizando Super Admin: ' + error.message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const getUserRole = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.is_super_admin) return 'Super Admin';
    
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || 'client';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Super Administrador</h1>
          <p className="text-muted-foreground">Control total de la plataforma DOMINIO</p>
        </div>
        <Button variant="outline" onClick={signOut}>
          Cerrar Sesión
        </Button>
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
            <p className="text-xs text-muted-foreground">
              {properties.filter(p => p.status === 'approved').length} aprobadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.is_super_admin).length} super admins
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes Contacto</CardTitle>
            <MailIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactMessages.length}</div>
            <p className="text-xs text-muted-foreground">
              Nuevos mensajes recibidos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Franquicias</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{franchises.length}</div>
            <p className="text-xs text-muted-foreground">
              Franquicias activas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="propiedades">Propiedades</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="franquicias">Franquicias</TabsTrigger>
          <TabsTrigger value="mensajes">
            Mensajes
            {contactMessages.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {contactMessages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="testimonios">Testimonios</TabsTrigger>
          <TabsTrigger value="sobre-nosotros">Sobre Nosotros</TabsTrigger>
          <TabsTrigger value="marca-agua">
            <Image className="h-4 w-4 mr-1" />
            Marca de Agua
          </TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
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
                {properties.length === 0 ? (
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
                Administra los roles y permisos de todos los usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol Actual</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name || 'Sin nombre'}</div>
                          <div className="text-sm text-muted-foreground">ID: {user.id.substring(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{user.agent_code || 'No disponible'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_super_admin ? 'default' : 'secondary'}>
                          {getUserRole(user.id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!user.is_super_admin && (
                            <Select 
                              value={getUserRole(user.id)} 
                              onValueChange={(value) => updateUserRole(user.id, value as "agent" | "client")}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="client">Cliente</SelectItem>
                                <SelectItem value="agent">Agente</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            size="sm"
                            variant={user.is_super_admin ? "destructive" : "default"}
                            onClick={() => toggleSuperAdmin(user.id, !user.is_super_admin)}
                          >
                            {user.is_super_admin ? (
                              <>
                                <UserX className="h-4 w-4 mr-1" />
                                Remover Admin
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-1" />
                                Hacer Admin
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="franquicias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Franquicias</CardTitle>
              <CardDescription>
                Administra las franquicias de la red DOMINIO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {franchises.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay franquicias registradas
                  </div>
                ) : (
                  franchises.map((franchise) => (
                    <div key={franchise.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{franchise.name}</h4>
                          <p className="text-sm text-muted-foreground">{franchise.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Creada: {new Date(franchise.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-1" />
                          Gestionar
                        </Button>
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

        <TabsContent value="testimonios" className="space-y-6">
          <TestimonialManagement />
        </TabsContent>

        <TabsContent value="sobre-nosotros" className="space-y-6">
          <AboutPageManagement />
        </TabsContent>

        <TabsContent value="marca-agua" className="space-y-6">
          <WatermarkManagement />
        </TabsContent>

        <TabsContent value="reportes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reportes Globales</CardTitle>
              <CardDescription>
                Estadísticas y métricas de rendimiento de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Propiedades por Estado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Aprobadas:</span>
                        <span className="font-medium">{properties.filter(p => p.status === 'approved').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Pendientes:</span>
                        <span className="font-medium">{properties.filter(p => p.status === 'pending').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Rechazadas:</span>
                        <span className="font-medium">{properties.filter(p => p.status === 'rejected').length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Usuarios por Rol</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Super Admins:</span>
                        <span className="font-medium">{users.filter(u => u.is_super_admin).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Agentes:</span>
                        <span className="font-medium">{userRoles.filter(r => r.role === 'agent').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Clientes:</span>
                        <span className="font-medium">{users.length - users.filter(u => u.is_super_admin).length - userRoles.filter(r => r.role === 'agent').length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Actividad Reciente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Solicitudes Franquicia:</span>
                        <span className="font-medium">{franchiseApplications.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Leads de Listado:</span>
                        <span className="font-medium">{listingLeads.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Mensajes de Contacto:</span>
                        <span className="font-medium">{contactMessages.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}