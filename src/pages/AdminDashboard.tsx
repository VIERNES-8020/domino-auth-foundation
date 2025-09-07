import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PropertyTypeStats from "@/components/PropertyTypeStats";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  TrendingUp, 
  MessageSquare, 
  Star, 
  FileText, 
  Image, 
  BarChart3,
  UserCheck, 
  UserX, 
  CheckCircle, 
  XCircle,
  Eye,
  Filter,
  Search,
  Calendar,
  DollarSign,
  Activity,
  Crown,
  Shield,
  Home,
  Briefcase,
  MapPin,
  X
} from "lucide-react";
import TestimonialManagement from "@/components/admin/TestimonialManagement";
import AboutPageManagement from "@/components/admin/AboutPageManagement";
import WatermarkManagement from "@/components/admin/WatermarkManagement";
import AdminUserManagement from "@/pages/AdminUserManagement";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [properties, setProperties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [franchiseApplications, setFranchiseApplications] = useState<any[]>([]);
  const [selectedFranchiseApplication, setSelectedFranchiseApplication] = useState<any>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>("");
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>("");
  const [listingLeads, setListingLeads] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<{type: string; status: 'all' | 'active' | 'concluded'} | null>(null);

  useEffect(() => {
    checkUserPermissions();
  }, []);

  const checkUserPermissions = async () => {
    setLoading(true);
    try {
      // Check current user role first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuario no autenticado');
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      
      // Check if user is super admin with timeout
      const profilePromise = Promise.race([
        supabase
          .from('profiles')
          .select('is_super_admin')
          .eq('id', user.id)
          .maybeSingle(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);

      const { data: profileData } = await profilePromise as any;
      const isSuper = profileData?.is_super_admin === true;
      setIsSuperAdmin(isSuper);
      
      // If not super admin, check if they have admin role in user_roles
      if (!isSuper) {
        const rolePromise = Promise.race([
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);

        const { data: roleData } = await rolePromise as any;
        
        // Only allow access if they have super_admin role
        if (roleData?.role !== 'super_admin') {
          toast.error('No tienes permisos para acceder a esta sección');
          setLoading(false);
          return;
        }
      }

      // If we reach here, user has permissions - now load data
      await fetchAllData(user);
    } catch (error) {
      console.error('Error checking permissions:', error);
      toast.error('Error verificando permisos');
      setLoading(false);
    }
  };

  const fetchAllData = async (user?: any) => {
    try {
      const userToUse = user || currentUser;
      if (!userToUse) {
        console.error('No user available for data fetching');
        setLoading(false);
        return;
      }

      // Fetch all data in parallel with timeout protection
      const fetchPromises = [
        Promise.race([
          supabase.from('properties').select('*').order('created_at', { ascending: false }).limit(100),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Properties timeout')), 8000))
        ]),
        Promise.race([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Users timeout')), 8000))
        ]),
        Promise.race([
          supabase.from('user_roles').select('*').limit(100),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Roles timeout')), 8000))
        ]),
        Promise.race([
          supabase.from('franchises').select('*').order('created_at', { ascending: false }).limit(50),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Franchises timeout')), 8000))
        ]),
        Promise.race([
          supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(50),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Messages timeout')), 8000))
        ]),
        Promise.race([
          supabase.from('admin_notifications').select('*').eq('user_id', userToUse.id).order('created_at', { ascending: false }).limit(20),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Notifications timeout')), 8000))
        ]),
        Promise.race([
          supabase.from('franchise_applications').select('*').order('created_at', { ascending: false }).limit(50),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Applications timeout')), 8000))
        ]),
        Promise.race([
          supabase.from('listing_leads').select('*').order('created_at', { ascending: false }).limit(50),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Leads timeout')), 8000))
        ])
      ];

      const results = await Promise.allSettled(fetchPromises);
      
      // Process results
      const [propertiesResult, usersResult, rolesResult, franchisesResult, messagesResult, notificationsResult, applicationsResult, leadsResult] = results;
      
      if (propertiesResult.status === 'fulfilled') {
        setProperties((propertiesResult.value as any)?.data || []);
      } else {
        console.error('Properties fetch failed:', propertiesResult.reason);
        setProperties([]);
      }
      
      if (usersResult.status === 'fulfilled') {
        setUsers((usersResult.value as any)?.data || []);
      } else {
        console.error('Users fetch failed:', usersResult.reason);
        setUsers([]);
      }
      
      if (rolesResult.status === 'fulfilled') {
        setUserRoles((rolesResult.value as any)?.data || []);
      } else {
        console.error('Roles fetch failed:', rolesResult.reason);
        setUserRoles([]);
      }
      
      if (franchisesResult.status === 'fulfilled') {
        setFranchises((franchisesResult.value as any)?.data || []);
      } else {
        console.error('Franchises fetch failed:', franchisesResult.reason);
        setFranchises([]);
      }
      
      if (messagesResult.status === 'fulfilled') {
        setContactMessages((messagesResult.value as any)?.data || []);
      } else {
        console.error('Messages fetch failed:', messagesResult.reason);
        setContactMessages([]);
      }
      
      if (notificationsResult.status === 'fulfilled') {
        setNotifications((notificationsResult.value as any)?.data || []);
      } else {
        console.error('Notifications fetch failed:', notificationsResult.reason);
        setNotifications([]);
      }
      
      if (applicationsResult.status === 'fulfilled') {
        setFranchiseApplications((applicationsResult.value as any)?.data || []);
      } else {
        console.error('Applications fetch failed:', applicationsResult.reason);
        setFranchiseApplications([]);
      }
      
      if (leadsResult.status === 'fulfilled') {
        setListingLeads((leadsResult.value as any)?.data || []);
      } else {
        console.error('Leads fetch failed:', leadsResult.reason);
        setListingLeads([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error cargando datos del dashboard. Reintentando...');
      
      // Set empty arrays to prevent UI issues
      setProperties([]);
      setUsers([]);
      setUserRoles([]);
      setFranchises([]);
      setContactMessages([]);
      setNotifications([]);
      setFranchiseApplications([]);
      setListingLeads([]);
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

  const handlePropertyTypeFilter = (type: string, status: 'all' | 'active' | 'concluded') => {
    setPropertyTypeFilter({ type, status });
  };

  const getFilteredProperties = () => {
    let filtered = properties;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(property => 
        property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(property => property.status === selectedStatus);
    }
    
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

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const getUserRole = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.is_super_admin) return 'Super Admin';
    
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || 'client';
  };

  // Función para calcular estadísticas avanzadas
  const getPropertyStats = () => {
    const totalProperties = properties.length;
    const approvedProperties = properties.filter(p => p.status === 'approved').length;
    const rejectedProperties = properties.filter(p => p.status === 'rejected').length;
    const pendingProperties = properties.filter(p => p.status === 'pending').length;
    const concludedProperties = properties.filter(p => p.concluded_status).length;
    
    const propertyTypes = properties.reduce((acc, prop) => {
      const type = prop.property_type || 'Sin categoría';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const totalValue = properties
      .filter(p => p.status === 'approved' && p.price)
      .reduce((sum, p) => sum + Number(p.price), 0);

    return {
      totalProperties,
      approvedProperties,
      rejectedProperties,
      pendingProperties,
      concludedProperties,
      propertyTypes,
      totalValue,
      approvalRate: totalProperties > 0 ? ((approvedProperties / totalProperties) * 100).toFixed(1) : 0
    };
  };

  const getUserStats = () => {
    const totalUsers = users.length;
    const superAdmins = users.filter(u => u.is_super_admin).length;
    const agents = userRoles.filter(r => r.role === 'agent').length;
    const clients = userRoles.filter(r => r.role === 'client').length;
    
    return {
      totalUsers,
      superAdmins,
      agents,
      clients,
      unassignedUsers: totalUsers - superAdmins - agents - clients
    };
  };

  const getRecentActivity = () => {
    const recent = [...properties, ...contactMessages, ...franchiseApplications]
      .map(item => ({
        ...item,
        type: item.title ? 'property' : item.message ? 'contact' : 'franchise',
        date: item.created_at
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    
    return recent;
  };

  const propertyStats = getPropertyStats();
  const userStats = getUserStats();
  const recentActivity = getRecentActivity();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <Card className="w-96 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Cargando Panel de Control</h3>
            <p className="text-muted-foreground">Preparando tu dashboard administrativo...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Crown className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-primary">
                    Super Admin Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground">Control total de DOMINIO</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                <Shield className="h-4 w-4 mr-2" />
                Administrador
              </Badge>
              <Button variant="outline" onClick={signOut} size="sm">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <Card className="shadow-lg border-0 bg-background/95 backdrop-blur">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full h-14 bg-muted/50 ${isSuperAdmin ? 'grid-cols-9' : 'grid-cols-8'}`}>
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="propiedades" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Propiedades
              </TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="usuarios" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Usuarios
                </TabsTrigger>
              )}
              <TabsTrigger value="franquicias" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Franquicias
              </TabsTrigger>
              <TabsTrigger value="mensajes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Mensajes
                {contactMessages.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 text-xs">
                    {contactMessages.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="testimonios" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Testimonios
              </TabsTrigger>
              <TabsTrigger value="sobre-nosotros" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contenido
              </TabsTrigger>
              <TabsTrigger value="marca-agua" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Marca de Agua
              </TabsTrigger>
              <TabsTrigger value="reportes" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Reportes
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6 mt-6">
              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/20 border-blue-200/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-700">{propertyStats.totalProperties}</div>
                    <div className="flex items-center mt-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-green-600">{propertyStats.approvalRate}% aprobadas</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-green-600/20 border-green-200/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                    <Users className="h-5 w-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-700">{userStats.totalUsers}</div>
                    <div className="flex items-center mt-2 text-sm">
                      <Crown className="h-4 w-4 text-yellow-600 mr-1" />
                      <span className="text-yellow-600">{userStats.superAdmins} admins</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/20 border-purple-200/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-700">
                      ${(propertyStats.totalValue / 1000000).toFixed(1)}M
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                      <Activity className="h-4 w-4 text-purple-600 mr-1" />
                      <span className="text-purple-600">En propiedades activas</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-orange-600/20 border-orange-200/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
                    <MessageSquare className="h-5 w-5 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-700">{contactMessages.length}</div>
                    <div className="flex items-center mt-2 text-sm">
                      <Calendar className="h-4 w-4 text-orange-600 mr-1" />
                      <span className="text-orange-600">Pendientes de revisar</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Property Types Distribution */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Distribución por Tipo de Propiedad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(propertyStats.propertyTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(Number(count) / propertyStats.totalProperties) * 100} 
                            className="w-20"
                          />
                          <Badge variant="secondary">{String(count)}</Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* User Roles Distribution */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Distribución de Usuarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">Super Admins</span>
                      </div>
                      <Badge variant="default">{userStats.superAdmins}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Agentes</span>
                      </div>
                      <Badge variant="secondary">{userStats.agents}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Clientes</span>
                      </div>
                      <Badge variant="outline">{userStats.clients}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">Sin asignar</span>
                      </div>
                      <Badge variant="destructive">{userStats.unassignedUsers}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Actividad Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.slice(0, 8).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {activity.type === 'property' && <Building2 className="h-4 w-4 text-blue-600" />}
                          {activity.type === 'contact' && <MessageSquare className="h-4 w-4 text-green-600" />}
                          {activity.type === 'franchise' && <TrendingUp className="h-4 w-4 text-purple-600" />}
                          <div>
                            <p className="font-medium text-sm">
                              {activity.type === 'property' && activity.title}
                              {activity.type === 'contact' && `Mensaje de ${activity.name}`}
                              {activity.type === 'franchise' && `Solicitud de ${activity.full_name}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.date).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {activity.type === 'property' ? 'Propiedad' : 
                           activity.type === 'contact' ? 'Contacto' : 'Franquicia'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


            {/* Properties Management Tab */}
            <TabsContent value="propiedades" className="space-y-6 mt-6">
              {/* Property Type Statistics */}
              <PropertyTypeStats 
                properties={properties}
                onFilterChange={handlePropertyTypeFilter}
              />
              
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar propiedades..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="approved">Aprobadas</SelectItem>
                    <SelectItem value="rejected">Rechazadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {getFilteredProperties().map((property) => (
                    <Card key={property.id} className="shadow-lg hover:shadow-xl transition-all duration-300 group">
                      <div className="relative">
                        {property.image_urls && property.image_urls[0] && (
                          <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                            <img 
                              src={property.image_urls[0]} 
                              alt={property.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge 
                            variant={property.status === 'approved' ? 'default' : 
                                   property.status === 'rejected' ? 'destructive' : 'secondary'}
                            className="shadow-lg"
                          >
                            {property.status === 'approved' ? 'Aprobada' :
                             property.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.address}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-primary">
                              ${property.price?.toLocaleString()} 
                              <span className="text-sm font-normal text-muted-foreground ml-1">
                                {property.price_currency}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              {property.property_type}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{property.bedrooms} hab</span>
                            <span>{property.bathrooms} baños</span>
                            <span>{property.area_m2} m²</span>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updatePropertyStatus(property.id, 'approved')}
                              disabled={property.status === 'approved'}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updatePropertyStatus(property.id, 'rejected')}
                              disabled={property.status === 'rejected'}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              
              {properties.length === 0 && (
                <Card className="shadow-lg">
                  <CardContent className="p-12 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay propiedades</h3>
                    <p className="text-muted-foreground">Cuando los agentes publiquen propiedades, aparecerán aquí para su revisión.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Users Management Tab - Only for Super Admins */}
            {isSuperAdmin && (
              <TabsContent value="usuarios" className="mt-6">
                <AdminUserManagement />
              </TabsContent>
            )}

            {/* Franchises Management Tab */}
            <TabsContent value="franquicias" className="space-y-6 mt-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Gestión de Franquicias
                  </CardTitle>
                  <CardDescription>
                    Administra las franquicias y solicitudes de la red DOMINIO
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Franchise Applications */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Solicitudes de Franquicia ({franchiseApplications.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {franchiseApplications.map((application) => (
                         <Card key={application.id} className="border-l-4 border-l-orange-500">
                           <CardContent className="p-4">
                             <div className="flex justify-between items-start mb-2">
                               <h4 className="font-semibold">{application.full_name}</h4>
                               <div className="flex items-center gap-2">
                                 <Badge variant="outline">{application.status}</Badge>
                                 <Button 
                                   size="sm" 
                                   variant="outline"
                                   onClick={() => setSelectedFranchiseApplication(application)}
                                 >
                                   <Eye className="h-4 w-4 mr-1" />
                                   Ver
                                 </Button>
                               </div>
                             </div>
                             <p className="text-sm text-muted-foreground mb-2">{application.email}</p>
                             <p className="text-sm text-muted-foreground">{application.city}, {application.country}</p>
                             <p className="text-xs text-muted-foreground mt-2">
                               {new Date(application.created_at).toLocaleDateString('es-ES')}
                             </p>
                           </CardContent>
                         </Card>
                      ))}
                    </div>
                  </div>

                  {/* Active Franchises */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Franquicias Activas ({franchises.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {franchises.map((franchise) => (
                        <Card key={franchise.id} className="hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{franchise.name}</h4>
                                <p className="text-sm text-muted-foreground">{franchise.description}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Creada: {new Date(franchise.created_at).toLocaleDateString('es-ES')}
                                </p>
                              </div>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="mensajes" className="space-y-6 mt-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
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
                        <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No hay mensajes</h3>
                        <p>Los mensajes de contacto aparecerán aquí cuando los usuarios se comuniquen.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {contactMessages.map((message) => (
                          <Card key={message.id} className="hover:shadow-lg transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                                    <MessageSquare className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{message.name}</h4>
                                    <p className="text-sm text-muted-foreground">{message.email}</p>
                                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                      {message.phone && <span>Tel: {message.phone}</span>}
                                      {message.whatsapp && <span>WhatsApp: {message.whatsapp}</span>}
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline">
                                  {new Date(message.created_at).toLocaleDateString('es-ES')}
                                </Badge>
                              </div>
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <p className="text-sm">{message.message}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other Tabs */}
            <TabsContent value="testimonios" className="space-y-6 mt-6">
              <TestimonialManagement />
            </TabsContent>

            <TabsContent value="sobre-nosotros" className="space-y-6 mt-6">
              <AboutPageManagement />
            </TabsContent>

            <TabsContent value="marca-agua" className="space-y-6 mt-6">
              <WatermarkManagement />
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reportes" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Global Statistics */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Estadísticas Generales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">{propertyStats.totalProperties}</div>
                        <p className="text-sm text-blue-600">Propiedades</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">{propertyStats.approvalRate}%</div>
                        <p className="text-sm text-green-600">Tasa Aprobación</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-700">{userStats.totalUsers}</div>
                        <p className="text-sm text-purple-600">Usuarios</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-700">{franchises.length}</div>
                        <p className="text-sm text-orange-600">Franquicias</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Métricas de Rendimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Propiedades Aprobadas</span>
                        <span className="text-sm">{propertyStats.approvedProperties}/{propertyStats.totalProperties}</span>
                      </div>
                      <Progress value={Number(propertyStats.approvalRate)} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Usuarios con Roles</span>
                        <span className="text-sm">{userStats.agents + userStats.clients}/{userStats.totalUsers}</span>
                      </div>
                      <Progress value={((userStats.agents + userStats.clients) / userStats.totalUsers) * 100} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Solicitudes Franquicia</span>
                        <Badge variant="outline">{franchiseApplications.length}</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Mensajes sin leer</span>
                        <Badge variant="destructive">{contactMessages.length}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Reports */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Reportes Detallados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Propiedades por Estado</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Aprobadas:</span>
                          <Badge variant="default">{propertyStats.approvedProperties}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Pendientes:</span>
                          <Badge variant="secondary">{propertyStats.pendingProperties}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Rechazadas:</span>
                          <Badge variant="destructive">{propertyStats.rejectedProperties}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Vendidas:</span>
                          <Badge variant="outline">{propertyStats.concludedProperties}</Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Distribución de Usuarios</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Super Admins:</span>
                          <Badge variant="default">{userStats.superAdmins}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Agentes:</span>
                          <Badge variant="secondary">{userStats.agents}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Clientes:</span>
                          <Badge variant="outline">{userStats.clients}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Sin asignar:</span>
                          <Badge variant="destructive">{userStats.unassignedUsers}</Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Actividad del Sistema</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Solicitudes Franquicia:</span>
                          <Badge variant="outline">{franchiseApplications.length}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Leads Generados:</span>
                          <Badge variant="secondary">{listingLeads.length}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Mensajes Contacto:</span>
                          <Badge variant="destructive">{contactMessages.length}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Valor Total Portfolio:</span>
                          <Badge variant="default">${(propertyStats.totalValue / 1000000).toFixed(1)}M</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Modal de Detalles de Solicitud de Franquicia */}
      <Dialog open={!!selectedFranchiseApplication} onOpenChange={() => setSelectedFranchiseApplication(null)}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Solicitud de Franquicia</DialogTitle>
          </DialogHeader>
          {selectedFranchiseApplication && (
            <div className="space-y-6">
              {/* Información Personal y Ubicación */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Información Personal</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
                      <p className="text-sm font-medium">{selectedFranchiseApplication.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Correo Electrónico</label>
                      <p className="text-sm">{selectedFranchiseApplication.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                      <p className="text-sm">{selectedFranchiseApplication.phone || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                      <p className="text-sm">{selectedFranchiseApplication.whatsapp || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3">Ubicación</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ciudad</label>
                      <p className="text-sm">{selectedFranchiseApplication.city || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">País</label>
                      <p className="text-sm">{selectedFranchiseApplication.country || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Estado</label>
                      <Badge variant="outline">{selectedFranchiseApplication.status}</Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fecha de Solicitud</label>
                      <p className="text-sm">{new Date(selectedFranchiseApplication.created_at).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensaje */}
              {selectedFranchiseApplication.message && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Motivación</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedFranchiseApplication.message}</p>
                  </div>
                </div>
              )}

              {/* Documentos */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Documentos</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Foto del Solicitante */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Foto del Solicitante
                    </h4>
                    {selectedFranchiseApplication.photo_url ? (
                      <div className="space-y-3">
                        <div className="flex justify-center">
                          <img 
                            src={selectedFranchiseApplication.photo_url} 
                            alt="Foto del solicitante" 
                            className="w-full max-w-[200px] h-[200px] object-cover rounded-lg border shadow-sm"
                            onError={(e) => {
                              e.currentTarget.src = "/default-placeholder.jpg";
                              e.currentTarget.alt = "Error al cargar imagen";
                            }}
                          />
                        </div>
                        <div className="flex justify-center">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setCurrentPhotoUrl(selectedFranchiseApplication.photo_url);
                              setShowPhotoModal(true);
                            }}
                            className="w-full sm:w-auto"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Foto
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No se subió foto</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Curriculum Vitae */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Curriculum Vitae (PDF)
                    </h4>
                    {selectedFranchiseApplication.cv_url ? (
                      <div className="space-y-3">
                        {/* Preview del PDF */}
                        <div className="bg-gray-50 rounded-lg p-4 text-center min-h-[120px] flex flex-col justify-center">
                          <FileText className="h-16 w-16 mx-auto mb-3 text-red-500" />
                          <p className="text-sm font-medium mb-1">Documento PDF</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedFranchiseApplication.cv_url.split('/').pop()?.split('?')[0] || 'curriculum.pdf'}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setCurrentPdfUrl(selectedFranchiseApplication.cv_url);
                              setShowPdfModal(true);
                            }}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver PDF
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = selectedFranchiseApplication.cv_url;
                              link.download = `CV_${selectedFranchiseApplication.full_name.replace(/\s+/g, '_')}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="w-full"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Descargar PDF
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground min-h-[120px] flex flex-col justify-center">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No se subió CV</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedFranchiseApplication(null)}
                  className="w-full sm:w-auto"
                >
                  Cerrar
                </Button>
                <Button 
                  onClick={() => {
                    // Aquí se podría añadir funcionalidad para cambiar el estado
                    toast.success("Funcionalidad de gestión próximamente");
                  }}
                  className="w-full sm:w-auto"
                >
                  Gestionar Solicitud
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para Ver Foto */}
      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setShowPhotoModal(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img 
              src={currentPhotoUrl} 
              alt="Foto del solicitante" 
              className="w-full h-auto max-h-[85vh] object-contain"
              onError={(e) => {
                e.currentTarget.src = "/default-placeholder.jpg";
                e.currentTarget.alt = "Error al cargar imagen";
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Ver PDF */}
      <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Curriculum Vitae</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPdfModal(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 min-h-[70vh]">
            <iframe
              src={currentPdfUrl}
              className="w-full h-full border rounded-lg"
              title="PDF Viewer"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}