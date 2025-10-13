import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HardHat, FileText, CheckCircle, Clock, AlertCircle, Download } from "lucide-react";

export default function ARXISManagerDashboard() {
  const [activeTab, setActiveTab] = useState("proyectos");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [arxisRequests, setArxisRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Estadísticas
  const [activeProjects, setActiveProjects] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [completedProjects, setCompletedProjects] = useState(0);
  const [scheduledMaintenances, setScheduledMaintenances] = useState(0);

  useEffect(() => {
    document.title = "Panel de ARXIS - Dominio Inmobiliaria";
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchProfile(user.id);
        await fetchArxisRequests();
        await fetchStats();
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

  const fetchArxisRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('franchise_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArxisRequests(data || []);
    } catch (error) {
      console.error('Error fetching ARXIS requests:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Solicitudes pendientes
      const { count: pendingCount } = await supabase
        .from('franchise_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      setPendingRequests(pendingCount || 0);

      // Para los proyectos activos, completados y mantenimientos
      // Estos datos vendrían de tablas específicas de ARXIS cuando se implementen
      setActiveProjects(0);
      setCompletedProjects(0);
      setScheduledMaintenances(0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('franchise_applications')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(`Estado actualizado a: ${newStatus}`);
      await fetchArxisRequests();
      await fetchStats();
      setViewDialogOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendiente", variant: "outline" },
      in_progress: { label: "En Progreso", variant: "default" },
      completed: { label: "Completado", variant: "secondary" },
      rejected: { label: "Rechazado", variant: "destructive" },
    };

    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getProjectTypeBadge = (type: string) => {
    const typeMap: Record<string, string> = {
      'Nuevo': '🏗️ Nuevo',
      'Remodelación': '🔨 Remodelación',
      'Mantenimiento': '🔧 Mantenimiento',
      'Asesoría técnica': '📐 Asesoría'
    };

    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-[#C76C33]/5">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Modern Header Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#C76C33]/5 via-[#C76C33]/10 to-[#C76C33]/5 rounded-2xl border border-[#C76C33]/10 shadow-lg">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    {profile?.avatar_url && (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#C76C33]/20">
                        <img 
                          src={profile.avatar_url} 
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <HardHat className="w-8 h-8 text-[#C76C33]" />
                      <h1 className="text-3xl lg:text-4xl font-bold" style={{ color: '#C76C33' }}>
                        Panel de ARXIS
                      </h1>
                    </div>
                  </div>
                  {profile && (
                    <div className="space-y-2">
                      <p className="text-lg text-muted-foreground">
                        Bienvenido/a, <span className="font-semibold" style={{ color: '#C76C33' }}>{profile.full_name || user?.email}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Gestión técnica y constructiva del sistema DOMINIO
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-sm font-mono border-[#C76C33]/20" style={{ backgroundColor: 'rgba(199, 108, 51, 0.05)', color: '#C76C33' }}>
                          Administrador ARXIS
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {activeProjects} Proyectos activos
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {pendingRequests} Solicitudes
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeProjects}</div>
                <p className="text-xs text-muted-foreground">
                  En ejecución
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Solicitudes Recibidas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Pendientes de revisión
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proyectos Completados</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedProjects}</div>
                <p className="text-xs text-muted-foreground">
                  Finalizados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mantenimientos</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduledMaintenances}</div>
                <p className="text-xs text-muted-foreground">
                  Programados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="proyectos">Proyectos Activos</TabsTrigger>
              <TabsTrigger value="solicitudes">Solicitudes Recibidas</TabsTrigger>
              <TabsTrigger value="reportes">Reportes Técnicos</TabsTrigger>
              <TabsTrigger value="mantenimientos">Mantenimientos</TabsTrigger>
            </TabsList>

            {/* Proyectos Activos */}
            <TabsContent value="proyectos">
              <Card>
                <CardHeader>
                  <CardTitle>Proyectos en Curso</CardTitle>
                  <CardDescription>Lista de obras en ejecución con su estado actual</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    No hay proyectos activos en este momento.
                  </p>
                  <p className="text-center text-sm text-muted-foreground">
                    Los proyectos aparecerán aquí cuando se conviertan solicitudes en obras.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Solicitudes Recibidas */}
            <TabsContent value="solicitudes">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitudes de Servicio ARXIS</CardTitle>
                  <CardDescription>Formularios enviados desde "Solicitar ARXIS"</CardDescription>
                </CardHeader>
                <CardContent>
                  {arxisRequests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay solicitudes recibidas.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Tipo de Proyecto</TableHead>
                          <TableHead>Ubicación</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {arxisRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              {new Date(request.created_at).toLocaleDateString('es-ES')}
                            </TableCell>
                            <TableCell className="font-medium">{request.full_name}</TableCell>
                            <TableCell>{getProjectTypeBadge(request.country || 'N/A')}</TableCell>
                            <TableCell>{request.city || 'N/A'}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewRequest(request)}
                              >
                                Ver detalles
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reportes Técnicos */}
            <TabsContent value="reportes">
              <Card>
                <CardHeader>
                  <CardTitle>Reportes Técnicos</CardTitle>
                  <CardDescription>Documentos y avances de obra</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    No hay reportes técnicos disponibles.
                  </p>
                  <p className="text-center text-sm text-muted-foreground">
                    Los reportes aparecerán aquí cuando se carguen desde los proyectos activos.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mantenimientos Programados */}
            <TabsContent value="mantenimientos">
              <Card>
                <CardHeader>
                  <CardTitle>Mantenimientos Programados</CardTitle>
                  <CardDescription>Fechas y responsables de mantenimientos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    No hay mantenimientos programados.
                  </p>
                  <p className="text-center text-sm text-muted-foreground">
                    Los mantenimientos programados aparecerán aquí.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* View Request Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Solicitud</DialogTitle>
            <DialogDescription>
              Información completa del proyecto solicitado
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                  <p className="text-base font-semibold">{selectedRequest.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{selectedRequest.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p className="text-base">{selectedRequest.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Proyecto</p>
                  <p className="text-base">{getProjectTypeBadge(selectedRequest.country || 'N/A')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ciudad</p>
                  <p className="text-base">{selectedRequest.city || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Descripción del Proyecto</p>
                <p className="text-base p-3 bg-muted rounded-md">
                  {selectedRequest.message || 'Sin descripción'}
                </p>
              </div>

              {selectedRequest.photo_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Imagen/Plano Adjunto</p>
                  <img 
                    src={selectedRequest.photo_url} 
                    alt="Plano o imagen del proyecto" 
                    className="w-full rounded-md border"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'in_progress')}
                  disabled={selectedRequest.status === 'in_progress'}
                  style={{ backgroundColor: '#C76C33' }}
                  className="text-white hover:opacity-90"
                >
                  Marcar en Progreso
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'completed')}
                  disabled={selectedRequest.status === 'completed'}
                  variant="outline"
                >
                  Marcar Completado
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                  disabled={selectedRequest.status === 'rejected'}
                  variant="destructive"
                >
                  Rechazar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
