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
import { HardHat, FileText, CheckCircle, Clock, AlertCircle, Trash2, Plus, Eye, Upload, X } from "lucide-react";
import DocumentFileUpload from "@/components/DocumentFileUpload";

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
  const [reportDocumentUrls, setReportDocumentUrls] = useState<string[]>([]);
  
  // Estado para el modal de vista detallada de reportes
  const [reportDetailOpen, setReportDetailOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  // Estado para el formulario de mantenimiento
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState('');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [maintenanceTime, setMaintenanceTime] = useState('');
  const [maintenanceAssignedTo, setMaintenanceAssignedTo] = useState('');
  const [maintenanceProjectId, setMaintenanceProjectId] = useState<string | null>(null);
  
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
          document_url: reportDocumentUrls.length > 0 ? reportDocumentUrls[0] : null,
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
      setReportDocumentUrls([]);
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

  const handleCreateMaintenance = async () => {
    if (!maintenanceTitle.trim() || !maintenanceDescription.trim() || !maintenanceDate || !maintenanceTime) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const scheduledDateTime = new Date(`${maintenanceDate}T${maintenanceTime}`);
      
      const { error } = await supabase
        .from('arxis_maintenances')
        .insert({
          title: maintenanceTitle,
          description: maintenanceDescription,
          scheduled_date: scheduledDateTime.toISOString(),
          assigned_to: maintenanceAssignedTo || null,
          project_id: maintenanceProjectId,
          status: 'scheduled',
          created_by: user.id
        });

      if (error) throw error;

      toast.success('✅ Mantenimiento creado exitosamente');
      
      // Limpiar formulario
      setMaintenanceTitle('');
      setMaintenanceDescription('');
      setMaintenanceDate('');
      setMaintenanceTime('');
      setMaintenanceAssignedTo('');
      setMaintenanceProjectId(null);
      setMaintenanceDialogOpen(false);
      
      await fetchMaintenances();
      await fetchStats();
    } catch (error) {
      console.error('Error creating maintenance:', error);
      toast.error('Error al crear mantenimiento');
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
                                  <p className="text-sm line-clamp-2">{report.description}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setReportDetailOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver Detalles
                                </Button>
                                {report.document_url && (
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700" asChild>
                                    <a href={report.document_url} target="_blank" rel="noopener noreferrer">
                                      📄 Documento
                                    </a>
                                  </Button>
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

            {/* Mantenimientos Programados */}
            <TabsContent value="mantenimientos">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Mantenimientos Programados</CardTitle>
                      <CardDescription>Trabajos de mantenimiento solicitados por clientes</CardDescription>
                    </div>
                    <Button 
                      onClick={() => setMaintenanceDialogOpen(true)}
                      className="bg-[#C76C33] hover:bg-[#C76C33]/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Mantenimiento
                    </Button>
                  </div>
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
                                      weekday: 'long',
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </Badge>
                                  <Badge variant="outline">
                                    🕐 {new Date(maintenance.scheduled_date).toLocaleTimeString('es-ES', { 
                                      hour: '2-digit', 
                                      minute: '2-digit'
                                    })}
                                  </Badge>
                                </div>

                                <h3 className="font-semibold text-lg">{maintenance.title}</h3>

                                {maintenance.arxis_projects?.title && (
                                  <p className="text-sm text-muted-foreground">
                                    🏗️ Proyecto relacionado: <span className="font-medium">{maintenance.arxis_projects.title}</span>
                                  </p>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  {maintenance.assigned_to && (
                                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                                      <span className="font-medium text-muted-foreground">👤 Responsable:</span>
                                      <span className="font-semibold">{maintenance.assigned_to}</span>
                                    </div>
                                  )}
                                  {maintenance.arxis_projects?.location && (
                                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                                      <span className="font-medium text-muted-foreground">📍 Ubicación:</span>
                                      <span className="font-semibold">{maintenance.arxis_projects.location}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r">
                                  <p className="text-sm font-medium text-muted-foreground mb-1">
                                    Descripción del Mantenimiento:
                                  </p>
                                  <p className="text-sm">{maintenance.description}</p>
                                </div>
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Proyecto y Crear Reporte Técnico</DialogTitle>
            <DialogDescription>
              Completa la información del proyecto finalizado
            </DialogDescription>
          </DialogHeader>

          {projectToComplete && (
            <div className="space-y-4 pb-4">
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
                <Label>Documentos/Fotos del Reporte (opcional)</Label>
                <DocumentFileUpload
                  files={reportDocumentUrls}
                  onFilesChange={setReportDocumentUrls}
                  type="voucher"
                  maxFiles={5}
                  maxSizeMB={10}
                  bucket="sale-documents"
                  label="Subir Fotos o Documentos"
                  description="Sube imágenes del proyecto finalizado o documentos PDF (máx. 5 archivos)"
                  agentId={user?.id || 'system'}
                />
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
                    setReportDocumentUrls([]);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Maintenance Dialog */}
      <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Mantenimiento</DialogTitle>
            <DialogDescription>
              Programa un trabajo de mantenimiento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance-title">Título del Mantenimiento *</Label>
              <Input
                id="maintenance-title"
                value={maintenanceTitle}
                onChange={(e) => setMaintenanceTitle(e.target.value)}
                placeholder="Ej: Revisión de instalaciones eléctricas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-description">Descripción del Trabajo *</Label>
              <Textarea
                id="maintenance-description"
                value={maintenanceDescription}
                onChange={(e) => setMaintenanceDescription(e.target.value)}
                placeholder="Describe el trabajo de mantenimiento a realizar..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintenance-date">Fecha *</Label>
                <Input
                  id="maintenance-date"
                  type="date"
                  value={maintenanceDate}
                  onChange={(e) => setMaintenanceDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance-time">Hora *</Label>
                <Input
                  id="maintenance-time"
                  type="time"
                  value={maintenanceTime}
                  onChange={(e) => setMaintenanceTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-assigned">Persona Responsable</Label>
              <Input
                id="maintenance-assigned"
                value={maintenanceAssignedTo}
                onChange={(e) => setMaintenanceAssignedTo(e.target.value)}
                placeholder="Nombre del técnico o responsable"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-project">Proyecto Relacionado (opcional)</Label>
              <select
                id="maintenance-project"
                value={maintenanceProjectId || ''}
                onChange={(e) => setMaintenanceProjectId(e.target.value || null)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Sin proyecto asociado</option>
                {arxisProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreateMaintenance}
                className="bg-[#C76C33] hover:bg-[#C76C33]/90"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Crear Mantenimiento
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMaintenanceDialogOpen(false);
                  setMaintenanceTitle('');
                  setMaintenanceDescription('');
                  setMaintenanceDate('');
                  setMaintenanceTime('');
                  setMaintenanceAssignedTo('');
                  setMaintenanceProjectId(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
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

      {/* Report Detail Dialog */}
      <Dialog open={reportDetailOpen} onOpenChange={setReportDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Reporte Técnico</DialogTitle>
            <DialogDescription>
              Información completa del proyecto finalizado
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Encabezado */}
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-600 hover:bg-green-700">
                    ✅ Proyecto Completado con Éxito
                  </Badge>
                  <Badge variant="outline">
                    {new Date(selectedReport.report_date).toLocaleDateString('es-ES', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-green-900">{selectedReport.title}</h3>
              </div>

              {/* Información del Proyecto */}
              {selectedReport.arxis_projects && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Información del Proyecto</h4>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Proyecto</p>
                      <p className="text-base font-semibold">{selectedReport.arxis_projects.title}</p>
                    </div>
                    {selectedReport.arxis_projects.client_name && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                        <p className="text-base">{selectedReport.arxis_projects.client_name}</p>
                      </div>
                    )}
                    {selectedReport.arxis_projects.location && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Ubicación</p>
                        <p className="text-base">{selectedReport.arxis_projects.location}</p>
                      </div>
                    )}
                    {selectedReport.arxis_projects.project_type && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tipo de Proyecto</p>
                        <p className="text-base">{getProjectTypeBadge(selectedReport.arxis_projects.project_type)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Trabajo Realizado */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Trabajo Realizado</h4>
                <div className="p-4 bg-white border border-green-200 rounded-lg">
                  <p className="text-base whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
              </div>

              {/* Documento Adjunto */}
              {selectedReport.document_url && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Documento/Foto Adjunta</h4>
                  {selectedReport.document_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="border rounded-lg overflow-hidden">
                      <img 
                        src={selectedReport.document_url} 
                        alt="Documento del reporte" 
                        className="w-full h-auto"
                      />
                    </div>
                  ) : (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" asChild>
                      <a href={selectedReport.document_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Descargar Documento Completo
                      </a>
                    </Button>
                  )}
                </div>
              )}

              {/* Botón Cerrar */}
              <div className="flex justify-end pt-4">
                <Button onClick={() => setReportDetailOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
