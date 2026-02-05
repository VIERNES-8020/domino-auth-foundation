import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Clock, CheckCircle, FileText, AlertCircle, Trash2, Plus, Eye } from "lucide-react";
import DocumentFileUpload from "@/components/DocumentFileUpload";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function ARXISContent({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState("proyectos");
  const [arxisRequests, setArxisRequests] = useState<any[]>([]);
  const [arxisProjects, setArxisProjects] = useState<any[]>([]);
  const [technicalReports, setTechnicalReports] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [completedProjects, setCompletedProjects] = useState(0);
  const [scheduledMaintenances, setScheduledMaintenances] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [projectToComplete, setProjectToComplete] = useState<any>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportDocumentUrls, setReportDocumentUrls] = useState<string[]>([]);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportDetailOpen, setReportDetailOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState('');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [maintenanceTime, setMaintenanceTime] = useState('');
  const [maintenanceAssignedTo, setMaintenanceAssignedTo] = useState('');
  const [maintenanceProjectId, setMaintenanceProjectId] = useState<string | null>(null);

  useEffect(() => {
    console.log('ARXISContent mounted with userId:', userId);
    if (userId) {
      fetchAllData();
    } else {
      console.warn('ARXISContent: No userId provided');
    }
  }, [userId]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchArxisRequests(),
      fetchArxisProjects(),
      fetchTechnicalReports(),
      fetchMaintenances(),
      fetchStats()
    ]);
  };

  const fetchArxisRequests = async () => {
    try {
      console.log('Fetching ARXIS requests...');
      const { data, error } = await supabase
        .from('franchise_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error in fetchArxisRequests:', error);
        throw error;
      }
      console.log('ARXIS requests fetched:', data?.length || 0);
      setArxisRequests(data || []);
    } catch (error) {
      console.error('Error fetching ARXIS requests:', error);
    }
  };

  const fetchArxisProjects = async () => {
    try {
      console.log('Fetching ARXIS projects...');
      const { data, error } = await supabase
        .from('arxis_projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error in fetchArxisProjects:', error);
        throw error;
      }
      console.log('ARXIS projects fetched:', data?.length || 0);
      setArxisProjects(data || []);
    } catch (error) {
      console.error('Error fetching ARXIS projects:', error);
    }
  };

  const fetchTechnicalReports = async () => {
    try {
      const { data, error } = await supabase
        .from('arxis_technical_reports')
        .select('*, arxis_projects(title, client_name, location, project_type)')
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
        .select('*, arxis_projects(title, location)')
        .order('scheduled_date', { ascending: true });
      if (error) throw error;
      setMaintenances(data || []);
    } catch (error) {
      console.error('Error fetching maintenances:', error);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching ARXIS stats...');
      const [pendingRes, activeRes, completedRes, maintenanceRes] = await Promise.all([
        supabase.from('franchise_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('arxis_projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('arxis_projects').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('arxis_maintenances').select('*', { count: 'exact', head: true }).eq('status', 'scheduled')
      ]);
      
      console.log('Stats fetched - Pending:', pendingRes.count, 'Active:', activeRes.count, 'Completed:', completedRes.count, 'Maintenances:', maintenanceRes.count);
      
      setPendingRequests(pendingRes.count || 0);
      setActiveProjects(activeRes.count || 0);
      setCompletedProjects(completedRes.count || 0);
      setScheduledMaintenances(maintenanceRes.count || 0);
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
      const { error } = await supabase.from('arxis_projects').insert({
        title: `Proyecto - ${request.full_name}`,
        description: request.message || 'Proyecto aceptado desde solicitud de servicio',
        project_type: 'Nuevo',
        client_name: request.full_name,
        client_email: request.email,
        client_phone: request.phone || request.whatsapp,
        location: `${request.city || 'N/A'}, ${request.country || 'N/A'}`,
        status: 'in_progress',
        created_by: userId
      });
      if (error) throw error;
      await supabase.from('franchise_applications').update({ status: 'approved' }).eq('id', request.id);
      toast.success('✅ Proyecto aceptado y movido a Proyectos Activos');
      await fetchAllData();
      setViewDialogOpen(false);
    } catch (error) {
      console.error('Error accepting project:', error);
      toast.error('Error al aceptar el proyecto');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta solicitud?')) return;
    try {
      const { error } = await supabase.from('franchise_applications').delete().eq('id', requestId);
      if (error) throw error;
      toast.success('Solicitud eliminada correctamente');
      await fetchAllData();
      setViewDialogOpen(false);
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Error al eliminar solicitud');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      const { error } = await supabase.from('arxis_projects').delete().eq('id', projectToDelete.id);
      if (error) throw error;
      toast.success('Proyecto eliminado correctamente');
      await fetchAllData();
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error al eliminar proyecto');
    }
  };

  const handleCompleteProject = async () => {
    if (!projectToComplete || !reportTitle.trim() || !reportDescription.trim()) {
      toast.error('Por favor completa el título y descripción del reporte');
      return;
    }
    try {
      await supabase.from('arxis_technical_reports').insert({
        title: reportTitle,
        description: reportDescription,
        document_url: reportDocumentUrls.length > 0 ? reportDocumentUrls[0] : null,
        project_id: projectToComplete.id,
        created_by: userId,
        report_date: new Date().toISOString()
      });
      await supabase.from('arxis_projects').update({ status: 'completed', end_date: new Date().toISOString() }).eq('id', projectToComplete.id);
      toast.success('✅ Proyecto finalizado y reporte técnico creado');
      setReportTitle('');
      setReportDescription('');
      setReportDocumentUrls([]);
      setCompleteDialogOpen(false);
      setProjectToComplete(null);
      await fetchAllData();
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
      await supabase.from('arxis_maintenances').insert({
        title: maintenanceTitle,
        description: maintenanceDescription,
        scheduled_date: scheduledDateTime.toISOString(),
        assigned_to: maintenanceAssignedTo || null,
        project_id: maintenanceProjectId,
        status: 'scheduled',
        created_by: userId
      });
      toast.success('✅ Mantenimiento creado exitosamente');
      setMaintenanceTitle('');
      setMaintenanceDescription('');
      setMaintenanceDate('');
      setMaintenanceTime('');
      setMaintenanceAssignedTo('');
      setMaintenanceProjectId(null);
      setMaintenanceDialogOpen(false);
      await fetchAllData();
    } catch (error) {
      console.error('Error creating maintenance:', error);
      toast.error('Error al crear mantenimiento');
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      await supabase.from('franchise_applications').update({ status: newStatus }).eq('id', requestId);
      toast.success(`Estado actualizado a: ${newStatus}`);
      await fetchAllData();
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">En ejecución</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Recibidas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Pendientes de revisión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects}</div>
            <p className="text-xs text-muted-foreground">Finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mantenimientos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledMaintenances}</div>
            <p className="text-xs text-muted-foreground">Programados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="relative -mx-3 sm:mx-0">
          <ScrollArea className="w-full px-3 sm:px-0">
            <TabsList className="bg-card border border-border inline-flex w-max h-auto p-1.5 gap-1 rounded-lg shadow-sm">
            <TabsTrigger value="proyectos" className="whitespace-nowrap text-[11px] sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-md">
              Proyectos Activos
            </TabsTrigger>
            <TabsTrigger value="solicitudes" className="whitespace-nowrap text-[11px] sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-md">
              Solicitudes Recibidas
            </TabsTrigger>
            <TabsTrigger value="reportes" className="whitespace-nowrap text-[11px] sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-md">
              Reportes Técnicos
            </TabsTrigger>
            <TabsTrigger value="mantenimientos" className="whitespace-nowrap text-[11px] sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-md">
              Mantenimientos
            </TabsTrigger>
          </TabsList>
            <ScrollBar orientation="horizontal" className="h-2.5 mt-1" />
          </ScrollArea>
        </div>

        {/* Proyectos Activos Tab */}
        <TabsContent value="proyectos">
          <Card>
            <CardHeader>
              <CardTitle>Proyectos en Curso</CardTitle>
              <CardDescription>Lista de obras en ejecución con su estado actual</CardDescription>
            </CardHeader>
            <CardContent>
              {arxisProjects.filter(p => p.status === 'in_progress').length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay proyectos activos en este momento.
                </p>
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

        {/* Solicitudes Tab */}
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
                        <TableCell>{request.full_name}</TableCell>
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

        {/* Reportes Técnicos Tab */}
        <TabsContent value="reportes">
          <Card>
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-lg sm:text-2xl">Reportes Técnicos - Proyectos Finalizados</CardTitle>
              <CardDescription>Trabajos completados con éxito</CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {technicalReports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay reportes técnicos disponibles.
                </p>
              ) : (
                <div className="space-y-4">
                  {technicalReports.map((report) => (
                    <Card key={report.id} className="border-green-200 bg-green-50/30 overflow-hidden">
                      <CardContent className="p-3 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                          <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                            {/* Badges row */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <Badge className="bg-green-600 hover:bg-green-700 text-[10px] sm:text-xs px-1.5 sm:px-2">
                                ✅ Finalizado
                              </Badge>
                              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                                {new Date(report.report_date).toLocaleDateString('es-ES', { 
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </Badge>
                            </div>
                            
                            {/* Title */}
                            <h3 className="font-semibold text-sm sm:text-lg text-green-900 line-clamp-2">{report.title}</h3>
                            
                            {/* Project reference */}
                            {report.arxis_projects?.title && (
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                🏗️ Proyecto: <span className="font-medium">{report.arxis_projects.title}</span>
                              </p>
                            )}
                            
                            {/* Description */}
                            <div className="border-l-2 sm:border-l-4 border-green-500 pl-2 sm:pl-4 py-1.5 sm:py-2 bg-white/50 rounded-r">
                              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1">Trabajo Realizado:</p>
                              <p className="text-xs sm:text-sm line-clamp-2">{report.description}</p>
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 sm:flex-none text-xs sm:text-sm h-8"
                              onClick={() => {
                                setSelectedReport(report);
                                setReportDetailOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Ver Detalles
                            </Button>
                            {report.document_url && (
                              <Button size="sm" className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-8" asChild>
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

        {/* Mantenimientos Tab */}
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
                <p className="text-center text-muted-foreground py-8">
                  No hay mantenimientos programados.
                </p>
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

                            <div className="border-l-4 border-blue-500 pl-4 py-2 bg-white/50 rounded-r">
                              <p className="text-sm font-medium text-muted-foreground mb-1">Descripción del Trabajo:</p>
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

      {/* View Request Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Solicitud</DialogTitle>
            <DialogDescription>
              Información completa del formulario de solicitud ARXIS
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
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
                  <p className="text-base">{selectedRequest.phone || 'No proporcionado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
                  <p className="text-base">{selectedRequest.whatsapp || 'No proporcionado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ubicación</p>
                  <p className="text-base">{selectedRequest.city || 'N/A'}, {selectedRequest.country || 'N/A'}</p>
                </div>
              </div>

              {selectedRequest.message && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Mensaje</p>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{selectedRequest.message}</p>
                  </div>
                </div>
              )}

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
                <Label htmlFor="report-description">Trabajo Realizado *</Label>
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
                  agentId={userId}
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

              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Trabajo Realizado</h4>
                <div className="p-4 bg-white border border-green-200 rounded-lg">
                  <p className="text-base whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
              </div>

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
