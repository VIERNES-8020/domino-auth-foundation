import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HardHat, FileText, CheckCircle, Clock, AlertCircle, Trash2, Plus } from "lucide-react";

export default function ARXISManagerDashboard() {
  const [activeTab, setActiveTab] = useState("proyectos");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [arxisRequests, setArxisRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<any>(null);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [projectToComplete, setProjectToComplete] = useState<any>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportDocumentUrl, setReportDocumentUrl] = useState('');
  
  // Proyectos, reportes y mantenimientos
  const [arxisProjects, setArxisProjects] = useState<any[]>([]);
  const [technicalReports, setTechnicalReports] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);

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
        await fetchArxisProjects();
        await fetchTechnicalReports();
        await fetchMaintenances();
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

  const fetchArxisProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('arxis_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArxisProjects(data || []);
    } catch (error) {
      console.error('Error fetching ARXIS projects:', error);
    }
  };

  const fetchTechnicalReports = async () => {
    try {
      const { data, error } = await supabase
        .from('arxis_technical_reports')
        .select('*, arxis_projects(title)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTechnicalReports(data || []);
    } catch (error) {
      console.error('Error fetching technical reports:', error);
    }
  };

  const fetchMaintenances = async () => {
    try {
      const { data, error } = await supabase
        .from('arxis_maintenances')
        .select('*, arxis_projects(title)')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setMaintenances(data || []);
    } catch (error) {
      console.error('Error fetching maintenances:', error);
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

      // Proyectos activos
      const { count: activeCount } = await supabase
        .from('arxis_projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');
      
      setActiveProjects(activeCount || 0);

      // Proyectos completados
      const { count: completedCount } = await supabase
        .from('arxis_projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      
      setCompletedProjects(completedCount || 0);

      // Mantenimientos programados
      const { count: maintenanceCount } = await supabase
        .from('arxis_maintenances')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');
      
      setScheduledMaintenances(maintenanceCount || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleAcceptProject = async (request: any) => {
    try {
      const { error } = await supabase
        .from('arxis_projects')
        .insert({
          title: `Proyecto - ${request.full_name}`,
          description: request.message || 'Proyecto aceptado desde solicitud de servicio',
          project_type: 'Nuevo',
          client_name: request.full_name,
          client_email: request.email,
          client_phone: request.phone || request.whatsapp,
          location: `${request.city || 'N/A'}, ${request.country || 'N/A'}`,
          status: 'in_progress',
          created_by: user.id
        });

      if (error) throw error;

      // Actualizar estado de la solicitud a aprobado
      await supabase
        .from('franchise_applications')
        .update({ status: 'approved' })
        .eq('id', request.id);

      toast.success('✅ Proyecto aceptado y movido a Proyectos Activos');
      await fetchArxisRequests();
      await fetchArxisProjects();
      await fetchStats();
      setViewDialogOpen(false);
    } catch (error) {
      console.error('Error accepting project:', error);
      toast.error('Error al aceptar el proyecto');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta solicitud? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('franchise_applications')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Solicitud eliminada correctamente');
      await fetchArxisRequests();
      await fetchStats();
      setViewDialogOpen(false);
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Error al eliminar solicitud');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const { error } = await supabase
        .from('arxis_projects')
        .delete()
        .eq('id', projectToDelete.id);

      if (error) throw error;

      toast.success('Proyecto eliminado correctamente');
      await fetchArxisProjects();
      await fetchStats();
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error al eliminar proyecto');
    }
  };

  const handleCompleteProject = async () => {
    if (!projectToComplete) return;

    if (!reportTitle.trim() || !reportDescription.trim()) {
      toast.error('Por favor completa el título y descripción del reporte');
      return;
    }

    try {
      // Crear el reporte técnico
      const { error: reportError } = await supabase
        .from('arxis_technical_reports')
        .insert({
          title: reportTitle,
          description: reportDescription,
          document_url: reportDocumentUrl || null,
          project_id: projectToComplete.id,
          created_by: user.id,
          report_date: new Date().toISOString()
        });

      if (reportError) throw reportError;

      // Actualizar el estado del proyecto a completado
      const { error: updateError } = await supabase
        .from('arxis_projects')
        .update({ status: 'completed', end_date: new Date().toISOString() })
        .eq('id', projectToComplete.id);

      if (updateError) throw updateError;

      toast.success('✅ Proyecto finalizado y reporte técnico creado');
      
      // Limpiar formulario
      setReportTitle('');
      setReportDescription('');
      setReportDocumentUrl('');
      setCompleteDialogOpen(false);
      setProjectToComplete(null);
      
      await fetchArxisProjects();
      await fetchTechnicalReports();
      await fetchStats();
    } catch (error) {
      console.error('Error completing project:', error);
      toast.error('Error al finalizar proyecto');
    }
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
      approved: { label: "Aprobado", variant: "secondary" },
      in_progress: { label: "En Progreso", variant: "default" },
      completed: { label: "Completado", variant: "secondary" },
      rejected: { label: "Rechazado", variant: "destructive" },
      scheduled: { label: "Programado", variant: "outline" },
      on_hold: { label: "En Pausa", variant: "outline" },
      cancelled: { label: "Cancelado", variant: "destructive" },
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

    return typeMap[type] || '🏗️ ' + type;
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
                  {arxisProjects.filter(p => p.status === 'in_progress').length === 0 ? (
                    <>
                      <p className="text-center text-muted-foreground py-8">
                        No hay proyectos activos en este momento.
                      </p>
                      <p className="text-center text-sm text-muted-foreground">
                        Los proyectos aparecerán aquí cuando se conviertan solicitudes en obras.
                      </p>
                    </>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Ubicación</TableHead>
                          <TableHead>Fecha Inicio</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {arxisProjects.filter(p => p.status === 'in_progress').map((project) => (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.title}</TableCell>
                            <TableCell>{project.client_name}</TableCell>
                            <TableCell>{getProjectTypeBadge(project.project_type)}</TableCell>
                            <TableCell>{project.location || 'N/A'}</TableCell>
                            <TableCell>
                              {new Date(project.start_date).toLocaleDateString('es-ES')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => {
                                    setProjectToComplete(project);
                                    setReportTitle(`Reporte - ${project.title}`);
                                    setCompleteDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Finalizar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setProjectToDelete(project);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
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
                          <TableCell>{request.city || 'N/A'}, {request.country || 'N/A'}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewRequest(request)}
                                >
                                  Ver detalles
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteRequest(request.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
                  <CardTitle>Reportes Técnicos - Proyectos Finalizados</CardTitle>
                  <CardDescription>Trabajos completados con éxito</CardDescription>
                </CardHeader>
                <CardContent>
                  {technicalReports.length === 0 ? (
                    <>
                      <p className="text-center text-muted-foreground py-8">
                        No hay reportes técnicos disponibles.
                      </p>
                      <p className="text-center text-sm text-muted-foreground">
                        Los reportes de proyectos finalizados aparecerán aquí.
                      </p>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {technicalReports.map((report) => (
                        <Card key={report.id} className="border-green-200 bg-green-50/30">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-green-600 hover:bg-green-700">
                                    ✅ Proyecto Finalizado con Éxito
                                  </Badge>
                                  <Badge variant="outline">
                                    {new Date(report.report_date).toLocaleDateString('es-ES', { 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </Badge>
                                </div>
                                <h3 className="font-semibold text-lg text-green-900">{report.title}</h3>
                                {report.arxis_projects?.title && (
                                  <p className="text-sm text-muted-foreground">
                                    🏗️ Proyecto: <span className="font-medium">{report.arxis_projects.title}</span>
                                  </p>
                                )}
                                <div className="border-l-4 border-green-500 pl-4 py-2 bg-white/50 rounded-r">
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Trabajo Realizado:</p>
                                  <p className="text-sm">{report.description}</p>
                                </div>
                              </div>
                              {report.document_url && (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 shrink-0" asChild>
                                  <a href={report.document_url} target="_blank" rel="noopener noreferrer">
                                    📄 Ver Informe Completo
                                  </a>
                                </Button>
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

            {/* Mantenimientos Programados */}
            <TabsContent value="mantenimientos">
              <Card>
                <CardHeader>
                  <CardTitle>Mantenimientos Programados</CardTitle>
                  <CardDescription>Trabajos de mantenimiento solicitados por clientes</CardDescription>
                </CardHeader>
                <CardContent>
                  {maintenances.length === 0 ? (
                    <>
                      <p className="text-center text-muted-foreground py-8">
                        No hay mantenimientos programados.
                      </p>
                      <p className="text-center text-sm text-muted-foreground">
                        Los mantenimientos solicitados aparecerán aquí.
                      </p>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {maintenances.map((maintenance) => (
                        <Card key={maintenance.id} className="border-blue-200">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={
                                    maintenance.status === 'completed' ? 'secondary' : 
                                    maintenance.status === 'in_progress' ? 'default' : 
                                    'outline'
                                  }>
                                    {maintenance.status === 'scheduled' && '📋 Programado'}
                                    {maintenance.status === 'in_progress' && '⚙️ En Progreso'}
                                    {maintenance.status === 'completed' && '✅ Completado'}
                                  </Badge>
                                  <Badge variant="outline">
                                    📅 {new Date(maintenance.scheduled_date).toLocaleDateString('es-ES', { 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </Badge>
                                </div>

                                <h3 className="font-semibold text-lg">{maintenance.title}</h3>

                                {maintenance.arxis_projects?.title && (
                                  <p className="text-sm text-muted-foreground">
                                    🏗️ Proyecto relacionado: <span className="font-medium">{maintenance.arxis_projects.title}</span>
                                  </p>
                                )}

                                <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r">
                                  <p className="text-sm font-medium text-muted-foreground mb-1">
                                    Descripción del Mantenimiento a Realizar:
                                  </p>
                                  <p className="text-sm">{maintenance.description}</p>
                                </div>

                                {maintenance.assigned_to && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium text-muted-foreground">👤 Asignado a:</span>
                                    <span className="font-semibold">{maintenance.assigned_to}</span>
                                  </div>
                                )}
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
                  <p className="text-sm font-medium text-muted-foreground">Ciudad/País</p>
                  <p className="text-base">{selectedRequest.city || 'N/A'}, {selectedRequest.country || 'N/A'}</p>
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

              {selectedRequest.cv_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">CV Adjunto</p>
                  <Button size="sm" variant="outline" asChild>
                    <a href={selectedRequest.cv_url} target="_blank" rel="noopener noreferrer">
                      Descargar CV
                    </a>
                  </Button>
                </div>
              )}

              <div className="flex gap-2 pt-4 flex-wrap">
                <Button
                  onClick={() => handleAcceptProject(selectedRequest)}
                  disabled={selectedRequest.status === 'approved'}
                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aceptar Proyecto
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'in_progress')}
                  disabled={selectedRequest.status === 'in_progress'}
                  variant="outline"
                >
                  Marcar en Progreso
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                  disabled={selectedRequest.status === 'rejected'}
                  variant="outline"
                >
                  Rechazar
                </Button>
                <Button
                  onClick={() => handleDeleteRequest(selectedRequest.id)}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Project Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Finalizar Proyecto y Crear Reporte Técnico</DialogTitle>
            <DialogDescription>
              Completa la información del proyecto finalizado
            </DialogDescription>
          </DialogHeader>

          {projectToComplete && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Proyecto: {projectToComplete.title}</p>
                <p className="text-sm text-muted-foreground">Cliente: {projectToComplete.client_name}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-title">Título del Reporte *</Label>
                <Input
                  id="report-title"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Ej: Reporte Final - Construcción Exitosa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-description">Trabajo Realizado * </Label>
                <Textarea
                  id="report-description"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe detalladamente el trabajo realizado, resultados obtenidos, y cualquier información relevante..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-document">URL del Documento (opcional)</Label>
                <Input
                  id="report-document"
                  value={reportDocumentUrl}
                  onChange={(e) => setReportDocumentUrl(e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Puedes agregar un enlace a un documento, PDF o informe completo
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCompleteProject}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar Proyecto y Guardar Reporte
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCompleteDialogOpen(false);
                    setReportTitle('');
                    setReportDescription('');
                    setReportDocumentUrl('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto
              {projectToDelete && `: "${projectToDelete.title}"`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
