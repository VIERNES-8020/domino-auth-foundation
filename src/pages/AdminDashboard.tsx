import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Building2, TrendingUp, Archive, Plus, Edit, Trash } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newFranchise, setNewFranchise] = useState({ name: "", description: "", admin_id: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useUser();

  // Check if user is super admin
  const { data: isSuperAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["check-super-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (error || !data) return false;
      return true;
    },
    enabled: !!user?.id,
  });

  // Fetch all users with their profiles and roles
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles (
            role
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return profiles || [];
    },
    enabled: isSuperAdmin,
  });

  // Fetch franchises
  const { data: franchises = [] } = useQuery({
    queryKey: ["admin-franchises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franchises")
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isSuperAdmin,
  });

  // Fetch archived properties
  const { data: archivedProperties = [] } = useQuery({
    queryKey: ["admin-archived-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq("is_archived", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isSuperAdmin,
  });

  // Fetch global stats
  const { data: globalStats } = useQuery({
    queryKey: ["admin-global-stats"],
    queryFn: async () => {
      const [agentsRes, propertiesRes, salesRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("properties").select("id, price, franchise_id", { count: "exact" }),
        supabase.from("agent_performance").select("properties_sold_month").not("properties_sold_month", "is", null)
      ]);

      const totalSales = salesRes.data?.reduce((sum, agent) => sum + (agent.properties_sold_month || 0), 0) || 0;
      const avgPropertyPrice = propertiesRes.data?.length ? 
        propertiesRes.data.reduce((sum, prop) => sum + (prop.price || 0), 0) / propertiesRes.data.length : 0;

      return {
        totalAgents: agentsRes.count || 0,
        totalProperties: propertiesRes.count || 0,
        totalSales,
        avgPropertyPrice,
      };
    },
    enabled: isSuperAdmin,
  });

  // Create franchise mutation
  const createFranchiseMutation = useMutation({
    mutationFn: async (franchise: typeof newFranchise) => {
      const { error } = await supabase
        .from("franchises")
        .insert([franchise]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Franquicia creada",
        description: "La franquicia ha sido creada exitosamente.",
      });
      setNewFranchise({ name: "", description: "", admin_id: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-franchises"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la franquicia.",
        variant: "destructive",
      });
      console.error("Error creating franchise:", error);
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "agent" | "client" | "admin" }) => {
      // Delete existing role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario.",
        variant: "destructive",
      });
      console.error("Error updating user role:", error);
    },
  });

  if (checkingAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Verificando permisos...</div>;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard/agent" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Super Administrador</h1>
          <p className="text-muted-foreground">Control total de la plataforma</p>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats?.totalAgents || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats?.totalProperties || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Mensuales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats?.totalSales || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(globalStats?.avgPropertyPrice || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
          <TabsTrigger value="franchises">Gestión de Franquicias</TabsTrigger>
          <TabsTrigger value="reports">Reportes Globales</TabsTrigger>
          <TabsTrigger value="archived">Propiedades Archivadas</TabsTrigger>
        </TabsList>

        {/* Users Management */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Administra todos los usuarios de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.full_name || "Sin nombre"}</TableCell>
                      <TableCell>usuario@{user.id.substring(0, 8)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {Array.isArray(user.user_roles) && user.user_roles.length > 0 ? user.user_roles[0].role : "usuario"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Usuario</DialogTitle>
                              <DialogDescription>
                                Modifica la información y rol del usuario
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="role">Rol</Label>
                                <Select
                                  onValueChange={(value: "agent" | "client" | "admin") => 
                                    updateUserRoleMutation.mutate({ 
                                      userId: user.id, 
                                      role: value 
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar rol" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">Usuario</SelectItem>
                                    <SelectItem value="agent">Agente</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Franchises Management */}
        <TabsContent value="franchises" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestión de Franquicias</CardTitle>
                <CardDescription>
                  Crea y administra franquicias
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Franquicia
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nueva Franquicia</DialogTitle>
                    <DialogDescription>
                      Completa la información de la nueva franquicia
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        value={newFranchise.name}
                        onChange={(e) => setNewFranchise(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nombre de la franquicia"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Input
                        id="description"
                        value={newFranchise.description}
                        onChange={(e) => setNewFranchise(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descripción de la franquicia"
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin">Administrador</Label>
                      <Select
                        onValueChange={(value) => setNewFranchise(prev => ({ ...prev, admin_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar administrador" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || `Usuario ${user.id.substring(0, 8)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={() => createFranchiseMutation.mutate(newFranchise)}
                      disabled={!newFranchise.name || createFranchiseMutation.isPending}
                      className="w-full"
                    >
                      Crear Franquicia
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Administrador</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {franchises.map((franchise) => (
                    <TableRow key={franchise.id}>
                      <TableCell className="font-medium">{franchise.name}</TableCell>
                      <TableCell>{franchise.description}</TableCell>
                      <TableCell>{Array.isArray(franchise.profiles) && franchise.profiles.length > 0 ? franchise.profiles[0].full_name : "Sin asignar"}</TableCell>
                      <TableCell>
                        {new Date(franchise.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reporte de Agentes</CardTitle>
                <CardDescription>
                  Métricas de rendimiento de agentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total de Agentes Activos:</span>
                    <span className="font-semibold">{globalStats?.totalAgents || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ventas Totales del Mes:</span>
                    <span className="font-semibold">{globalStats?.totalSales || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reporte de Propiedades</CardTitle>
                <CardDescription>
                  Estadísticas del inventario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total de Propiedades:</span>
                    <span className="font-semibold">{globalStats?.totalProperties || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio Promedio:</span>
                    <span className="font-semibold">
                      ${Math.round(globalStats?.avgPropertyPrice || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Archived Properties */}
        <TabsContent value="archived" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Propiedades Archivadas</CardTitle>
              <CardDescription>
                Auditoría de propiedades archivadas por los agentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.title}</TableCell>
                      <TableCell>{Array.isArray(property.profiles) && property.profiles.length > 0 ? property.profiles[0].full_name : "Agente desconocido"}</TableCell>
                      <TableCell>
                        ${property.price?.toLocaleString()} {property.price_currency}
                      </TableCell>
                      <TableCell>{property.address}</TableCell>
                      <TableCell>
                        {new Date(property.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {archivedProperties.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay propiedades archivadas.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;