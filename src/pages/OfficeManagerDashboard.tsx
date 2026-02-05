import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Home, CheckCircle, Building2, Eye, CheckCircle2, XCircle, DollarSign, Download, FileText, Calendar, User, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";

export default function OfficeManagerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [officeProperties, setOfficeProperties] = useState<any[]>([]);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [closures, setClosures] = useState<any[]>([]);
  const [viewingClosure, setViewingClosure] = useState<any>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    document.title = "Panel de Administración - Dominio Inmobiliaria";
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchProfile(user.id);
        await fetchProperties();
        await fetchChangeRequests();
        await fetchClosures();
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

  const fetchProperties = async () => {
    try {
      // Primero obtenemos las propiedades
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (propertiesError) throw propertiesError;

      // Luego obtenemos la información de los agentes
      if (properties && properties.length > 0) {
        const agentIds = [...new Set(properties.map(p => p.agent_id))];
        const { data: agents, error: agentsError } = await supabase
          .from('profiles')
          .select('id, full_name, agent_code')
          .in('id', agentIds);
        
        if (agentsError) throw agentsError;

        // Combinamos los datos
        const enrichedProperties = properties.map(property => ({
          ...property,
          profiles: agents?.find(agent => agent.id === property.agent_id)
        }));

        setOfficeProperties(enrichedProperties);
      } else {
        setOfficeProperties([]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Error al cargar las propiedades');
      setOfficeProperties([]);
    }
  };

  const handleUpdatePropertyStatus = async (propertyId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId);

      if (error) throw error;
      
      toast.success(`Propiedad ${newStatus === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`);
      await fetchProperties();
    } catch (error) {
      console.error('Error updating property status:', error);
      toast.error('Error al actualizar el estado de la propiedad');
    }
  };

  const fetchChangeRequests = async () => {
    try {
      // Primero obtenemos las solicitudes
      const { data: requests, error: requestsError } = await supabase
        .from('property_change_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (requestsError) throw requestsError;

      if (requests && requests.length > 0) {
        // Obtenemos las propiedades relacionadas
        const propertyIds = [...new Set(requests.map(r => r.property_id))];
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('id, title, property_code, address')
          .in('id', propertyIds);
        
        if (propertiesError) throw propertiesError;

        // Obtenemos los agentes relacionados
        const agentIds = [...new Set(requests.map(r => r.agent_id))];
        const { data: agents, error: agentsError } = await supabase
          .from('profiles')
          .select('id, full_name, agent_code')
          .in('id', agentIds);
        
        if (agentsError) throw agentsError;

        // Combinamos los datos
        const enrichedRequests = requests.map(request => ({
          ...request,
          properties: properties?.find(p => p.id === request.property_id),
          profiles: agents?.find(a => a.id === request.agent_id)
        }));

        setChangeRequests(enrichedRequests);
      } else {
        setChangeRequests([]);
      }
    } catch (error) {
      console.error('Error fetching change requests:', error);
      toast.error('Error al cargar las solicitudes');
      setChangeRequests([]);
    }
  };

  const handleApproveRequest = async (request: any) => {
    try {
      // Primero aprobar la solicitud
      const { error: updateError } = await supabase
        .from('property_change_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Ejecutar la acción según el tipo de solicitud
      if (request.request_type === 'archive') {
        const { error } = await supabase
          .from('properties')
          .update({
            is_archived: true,
            archive_reason: request.request_data?.reason || 'Archivado'
          })
          .eq('id', request.property_id);
        if (error) throw error;
      } else if (request.request_type === 'delete') {
        const { error } = await supabase
          .from('properties')
          .delete()
          .eq('id', request.property_id);
        if (error) throw error;
      } else if (request.request_type === 'edit') {
        const { error } = await supabase
          .from('properties')
          .update(request.request_data)
          .eq('id', request.property_id);
        if (error) throw error;
      }

      toast.success('Solicitud aprobada exitosamente');
      await fetchChangeRequests();
      await fetchProperties();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Error al aprobar la solicitud');
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('property_change_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Solicitud rechazada');
      await fetchChangeRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Error al rechazar la solicitud');
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      edit: 'Editar',
      archive: 'Archivar',
      assign: 'Asignar',
      delete: 'Eliminar'
    };
    return labels[type] || type;
  };

  const fetchClosures = async () => {
    try {
      const { data, error } = await supabase
        .from("sale_closures")
        .select(`
          *,
          property:properties(title, address, property_code, property_type),
          agent_captador:profiles!agent_captador_id(full_name, agent_code),
          agent_vendedor:profiles!agent_vendedor_id(full_name, agent_code),
          validated_by_profile:profiles!validated_by(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClosures(data || []);
    } catch (error: any) {
      console.error("Error al obtener cierres:", error);
      toast.error("Error al cargar los cierres de venta");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "validated":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" /> Validado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" /> Rechazado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" /> Pendiente
          </Badge>
        );
    }
  };

  const handleValidate = async (closureId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      const { data, error } = await supabase
        .from("sale_closures")
        .update({
          status: "validated",
          validated_by: user.id,
          validated_at: new Date().toISOString(),
        })
        .eq("id", closureId)
        .select()
        .single();

      if (error) throw error;

      const { data: updatedClosure } = await supabase
        .from("sale_closures")
        .select(`
          *,
          property:properties(title, address, property_code, property_type),
          agent_captador:profiles!agent_captador_id(full_name, agent_code),
          agent_vendedor:profiles!agent_vendedor_id(full_name, agent_code),
          validated_by_profile:profiles!validated_by(full_name)
        `)
        .eq("id", closureId)
        .single();

      if (updatedClosure && viewingClosure?.id === closureId) {
        setViewingClosure(updatedClosure);
      }

      toast.success("✅ Cierre validado exitosamente");
      fetchClosures();
    } catch (error: any) {
      console.error("Error al validar:", error);
      toast.error("Error al validar el cierre");
    }
  };

  const handleRejectClosure = async (closureId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Debe ingresar un motivo de rechazo");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      const { data, error } = await supabase
        .from("sale_closures")
        .update({
          status: "rejected",
          validated_by: user.id,
          validated_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", closureId)
        .select()
        .single();

      if (error) throw error;

      const { data: updatedClosure } = await supabase
        .from("sale_closures")
        .select(`
          *,
          property:properties(title, address, property_code, property_type),
          agent_captador:profiles!agent_captador_id(full_name, agent_code),
          agent_vendedor:profiles!agent_vendedor_id(full_name, agent_code),
          validated_by_profile:profiles!validated_by(full_name)
        `)
        .eq("id", closureId)
        .single();

      if (updatedClosure && viewingClosure?.id === closureId) {
        setViewingClosure(updatedClosure);
      }

      toast.success("❌ Cierre rechazado");
      setShowRejectDialog(false);
      setRejectionReason("");
      fetchClosures();
    } catch (error: any) {
      console.error("Error al rechazar:", error);
      toast.error("Error al rechazar el cierre");
    }
  };

  const downloadExcelReport = () => {
    const validatedClosures = closures.filter(c => c.status === "validated");
    
    const reportData = validatedClosures.map(closure => ({
      "Fecha": format(new Date(closure.closure_date), "dd/MM/yyyy", { locale: es }),
      "Tipo de Inmueble": closure.property?.property_type || "N/A",
      "Código": closure.property?.property_code || "N/A",
      "Dirección": closure.property?.address || "N/A",
      "Tipo de Operación": closure.transaction_type === "sale" ? "Venta" : closure.transaction_type === "rent" ? "Alquiler" : "Anticretico",
      "Precio Publicado": `${closure.currency} ${parseFloat(closure.published_price).toLocaleString()}`,
      "Precio de Cierre": `${closure.currency} ${parseFloat(closure.closure_price).toLocaleString()}`,
      "Agente Captador": closure.agent_captador?.full_name || "N/A",
      "Código Captador": closure.agent_captador?.agent_code || "N/A",
      "Monto Captador": `${closure.currency} ${parseFloat(closure.captador_amount || 0).toLocaleString()}`,
      "Agente Vendedor": closure.agent_vendedor?.full_name || "N/A",
      "Código Vendedor": closure.agent_vendedor?.agent_code || "N/A",
      "Monto Vendedor": `${closure.currency} ${parseFloat(closure.vendedor_amount || 0).toLocaleString()}`,
      "Monto Oficina": `${closure.currency} ${parseFloat(closure.office_amount || 0).toLocaleString()}`,
      "Notas": closure.notes || ""
    }));

    // Agregar totales por tipo de operación
    const totalVenta = validatedClosures
      .filter(c => c.transaction_type === "sale")
      .reduce((sum, c) => sum + parseFloat(c.closure_price || 0), 0);
    const totalAlquiler = validatedClosures
      .filter(c => c.transaction_type === "rent")
      .reduce((sum, c) => sum + parseFloat(c.closure_price || 0), 0);
    const totalAnticretico = validatedClosures
      .filter(c => c.transaction_type === "anticretico")
      .reduce((sum, c) => sum + parseFloat(c.closure_price || 0), 0);

    reportData.push({} as any);
    reportData.push({
      "Fecha": "TOTALES POR TIPO",
      "Tipo de Inmueble": "",
      "Código": "",
      "Dirección": "",
      "Tipo de Operación": "",
      "Precio Publicado": "",
      "Precio de Cierre": "",
      "Agente Captador": "",
      "Código Captador": "",
      "Monto Captador": "",
      "Agente Vendedor": "",
      "Código Vendedor": "",
      "Monto Vendedor": "",
      "Monto Oficina": "",
      "Notas": ""
    } as any);
    reportData.push({
      "Fecha": "Ventas",
      "Precio de Cierre": `USD ${totalVenta.toLocaleString()}`,
    } as any);
    reportData.push({
      "Fecha": "Alquileres",
      "Precio de Cierre": `USD ${totalAlquiler.toLocaleString()}`,
    } as any);
    reportData.push({
      "Fecha": "Anticreticos",
      "Precio de Cierre": `USD ${totalAnticretico.toLocaleString()}`,
    } as any);
    reportData.push({
      "Fecha": "TOTAL GENERAL",
      "Precio de Cierre": `USD ${(totalVenta + totalAlquiler + totalAnticretico).toLocaleString()}`,
    } as any);

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cierres Validados");
    
    const fileName = `Reporte_Cierres_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success("Reporte descargado exitosamente");
  };

  const approvedProperties = officeProperties.filter(p => p.status === 'approved');
  const pendingProperties = officeProperties.filter(p => p.status === 'pending');
  const pendingRequestsCount = changeRequests.length;
  
  const totalClosures = closures.length;
  const validatedClosures = closures.filter((c) => c.status === "validated");
  const totalSales = validatedClosures.reduce((sum, c) => sum + parseFloat(c.closure_price || 0), 0);
  const pendingClosuresCount = closures.filter((c) => c.status === "pending").length;
  const validatedCount = validatedClosures.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Modern Header Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 rounded-xl sm:rounded-2xl border border-amber-500/10 shadow-lg">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3 w-full lg:w-auto">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {profile?.avatar_url && (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-amber-500/20 flex-shrink-0">
                        <img 
                          src={profile.avatar_url} 
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full animate-pulse flex-shrink-0"></div>
                      <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-amber-600 truncate">
                        Panel de Administración
                      </h1>
                    </div>
                  </div>
                  {profile && (
                    <div className="space-y-1.5 sm:space-y-2">
                      <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                        Bienvenido, <span className="font-semibold text-amber-600 break-words">{profile.full_name || user?.email}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <Badge variant="outline" className="text-[10px] sm:text-xs lg:text-sm font-mono bg-amber-500/5 border-amber-500/20 text-amber-600 px-1.5 sm:px-2 py-0.5 sm:py-1">
                          <span className="hidden sm:inline">Administración (Encargado de Oficina)</span>
                          <span className="sm:hidden">Encargado de Oficina</span>
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                          {profile?.franchises?.name || 'Sin asignar'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3 mt-2 lg:mt-0">
                  <Button variant="outline" className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm" asChild>
                    <Link to="/">Portal Principal</Link>
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm text-red-600 border-red-200 hover:bg-red-50" onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  }}>
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </div>
          </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium truncate pr-2">Inmuebles Cargados</CardTitle>
              <Home className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold">{approvedProperties.length}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium truncate pr-2">Pendientes Aprobar</CardTitle>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold">{pendingProperties.length}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium truncate pr-2">Solicitudes Agentes</CardTitle>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-amber-600">{pendingRequestsCount}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium truncate pr-2">Mi Oficina</CardTitle>
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xs sm:text-sm font-semibold truncate">{profile?.franchises?.name || 'Sin asignar'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para diferentes secciones */}
        <Tabs defaultValue="propiedades" className="space-y-4 sm:space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/60 p-1 sm:p-1.5 rounded-lg sm:rounded-xl shadow-sm">
              <TabsTrigger 
                value="propiedades"
                className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-md data-[state=active]:bg-[#C76C33] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                Propiedades
              </TabsTrigger>
              <TabsTrigger 
                value="cierres"
                className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-md data-[state=active]:bg-[#C76C33] data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex items-center justify-center gap-1"
              >
                <span className="hidden sm:inline">Cierres de Venta</span>
                <span className="sm:hidden">Cierres</span>
                {pendingClosuresCount > 0 && (
                  <Badge className="ml-1 bg-red-500 text-[10px] px-1 py-0 h-4">{pendingClosuresCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="propiedades" className="space-y-6">
            {/* Solicitudes de Cambios de Agentes */}
            {changeRequests.length > 0 && (
              <Card className="mb-6 sm:mb-8 shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Solicitudes de Agentes</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Revisa y aprueba las solicitudes de cambios de los agentes</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    {changeRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg bg-amber-50/50 dark:bg-amber-950/20 gap-3"
                      >
                        <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                          <div className="flex flex-wrap items-start sm:items-center gap-1.5 sm:gap-2">
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0">
                              {getRequestTypeLabel(request.request_type)}
                            </Badge>
                            <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{request.properties?.title}</h3>
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1">
                            <p className="truncate">Código: {request.properties?.property_code}</p>
                            <p className="line-clamp-1">Agente: {request.profiles?.full_name} <span className="text-[10px] sm:text-xs">({request.profiles?.agent_code})</span></p>
                            <p className="text-[10px] sm:text-xs italic line-clamp-2">Dirección: {request.properties?.address}</p>
                            {request.request_data?.reason && (
                              <p className="text-[10px] sm:text-xs italic line-clamp-1">Motivo: {request.request_data.reason}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproveRequest(request)}
                            className="flex-1 sm:flex-none h-8 text-xs sm:text-sm bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span>Aprobar</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1 sm:flex-none h-8 text-xs sm:text-sm"
                            onClick={() => {
                              const reason = prompt('Motivo del rechazo:');
                              if (reason) handleRejectRequest(request.id, reason);
                            }}
                          >
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">Rechazar</span>
                            <span className="sm:hidden">No</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Inmuebles de la Oficina</CardTitle>
                <CardDescription>Gestiona las propiedades de tu oficina</CardDescription>
              </CardHeader>
              <CardContent>
                {officeProperties.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay inmuebles registrados
                  </p>
                ) : (
                  <div className="space-y-4">
                    {officeProperties.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{property.title}</h3>
                            <Badge variant={property.status === 'approved' ? 'default' : 'secondary'}>
                              {property.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {property.address}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Agente: {property.profiles?.full_name || 'N/A'}
                            </span>
                            <span className="text-muted-foreground">
                              Código: {property.property_code || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/propiedad/${property.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Link>
                          </Button>
                          {property.status === 'pending' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleUpdatePropertyStatus(property.id, 'approved')}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleUpdatePropertyStatus(property.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cierres" className="space-y-6">
            {/* Resumen de Cierres */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6" />
                    Cierres de Venta
                  </span>
                  {validatedCount > 0 && (
                    <Button onClick={downloadExcelReport} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Reporte Excel
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Cierres</p>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{totalClosures}</p>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Ventas Validadas</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400 flex items-center justify-center gap-1">
                      <DollarSign className="h-5 w-5" />
                      {totalSales.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Pendientes</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{pendingClosuresCount}</p>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Validados</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{validatedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Cierres */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Historial de Cierres</CardTitle>
              </CardHeader>
              <CardContent>
                {closures.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No hay cierres registrados aún
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Propiedad</TableHead>
                          <TableHead>Agente Captador</TableHead>
                          <TableHead>Agente Vendedor</TableHead>
                          <TableHead>Precio Cierre</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {closures.map((closure) => (
                          <TableRow key={closure.id}>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(closure.closure_date), "dd/MM/yyyy", { locale: es })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{closure.property?.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {closure.property?.property_code || "N/A"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{closure.agent_captador?.full_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{closure.agent_vendedor?.full_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">
                                {closure.currency} {parseFloat(closure.closure_price).toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(closure.status)}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingClosure(closure)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Detalles del Cierre */}
        <Dialog open={!!viewingClosure} onOpenChange={() => setViewingClosure(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Cierre de Venta</DialogTitle>
            </DialogHeader>
            {viewingClosure && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Inmueble</label>
                    <p className="font-semibold">{viewingClosure.property?.title}</p>
                    <p className="text-sm text-muted-foreground">{viewingClosure.property?.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado</label>
                    <div className="mt-1">{getStatusBadge(viewingClosure.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Precio Publicado</label>
                    <p className="font-semibold">
                      {viewingClosure.currency} {parseFloat(viewingClosure.published_price).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Precio de Cierre</label>
                    <p className="font-semibold text-lg text-green-600">
                      {viewingClosure.currency} {parseFloat(viewingClosure.closure_price).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipo de Operación</label>
                    <p className="font-semibold capitalize">
                      {viewingClosure.transaction_type === "sale" ? "Venta" : viewingClosure.transaction_type === "rent" ? "Alquiler" : "Anticretico"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Agente Captador</label>
                    <p className="font-semibold">{viewingClosure.agent_captador?.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Agente Vendedor</label>
                    <p className="font-semibold">{viewingClosure.agent_vendedor?.full_name}</p>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    División de Ingresos
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded">
                      <p className="text-muted-foreground mb-1">Oficina ({viewingClosure.office_percentage}%)</p>
                      <p className="text-xl font-bold text-blue-600">
                        {viewingClosure.currency} {parseFloat(viewingClosure.office_amount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded">
                      <p className="text-muted-foreground mb-1">Captador ({viewingClosure.captador_percentage}%)</p>
                      <p className="text-xl font-bold text-green-600">
                        {viewingClosure.currency} {parseFloat(viewingClosure.captador_amount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded">
                      <p className="text-muted-foreground mb-1">Vendedor ({viewingClosure.vendedor_percentage}%)</p>
                      <p className="text-xl font-bold text-purple-600">
                        {viewingClosure.currency} {parseFloat(viewingClosure.vendedor_amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {viewingClosure.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notas</label>
                    <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{viewingClosure.notes}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Documentos</label>
                  <div className="flex flex-wrap gap-2">
                    {viewingClosure.contract_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(viewingClosure.contract_url, "_blank")}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Contrato
                      </Button>
                    )}
                    {viewingClosure.voucher_urls?.map((url: string, i: number) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(url, "_blank")}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Comprobante {i + 1}
                      </Button>
                    ))}
                  </div>
                </div>

                {viewingClosure.status === "pending" && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleValidate(viewingClosure.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Validar Cierre
                    </Button>
                    <Button
                      onClick={() => setShowRejectDialog(true)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                  </div>
                )}

                {viewingClosure.status === "rejected" && viewingClosure.rejection_reason && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
                      Motivo de Rechazo:
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {viewingClosure.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog para Rechazar */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rechazar Cierre de Venta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Motivo del Rechazo</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ingrese el motivo del rechazo..."
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => viewingClosure && handleRejectClosure(viewingClosure.id)}
                  variant="destructive"
                  className="flex-1"
                >
                  Confirmar Rechazo
                </Button>
                <Button
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectionReason("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  );
}
