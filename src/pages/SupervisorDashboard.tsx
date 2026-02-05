import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserCheck, UserX, Users, Bell, CheckCircle, XCircle, Clock, History, Edit, Power, Home, UserPlus } from "lucide-react";
import AssignPropertyModal from "@/components/AssignPropertyModal";

export default function SupervisorDashboard() {
  const [activeTab, setActiveTab] = useState("agentes");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [archiveRequests, setArchiveRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: '', agent_code: '' });
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState<{ agentId: string; newStatus: boolean } | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    document.title = "Panel de Supervisión - Dominio Inmobiliaria";
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchProfile(user.id);
        await Promise.all([fetchAgents(), fetchProperties()]);
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

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('agent_code', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_agent_id_fkey(full_name, agent_code)
        `)
        .eq('status', 'approved')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const openStatusModal = (agentId: string, currentStatus: boolean) => {
    setPendingStatusChange({ agentId, newStatus: !currentStatus });
    setStatusChangeReason('');
    setStatusModalOpen(true);
  };

  const handleStatusChange = async () => {
    if (!pendingStatusChange) return;
    if (!statusChangeReason.trim()) {
      toast.error('Por favor ingrese un motivo para el cambio');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_archived: pendingStatusChange.newStatus,
          archive_reason: statusChangeReason.trim()
        })
        .eq('id', pendingStatusChange.agentId);

      if (error) throw error;

      const message = pendingStatusChange.newStatus 
        ? `Agente desactivado por: ${statusChangeReason}`
        : 'Agente activado con éxito';
      
      toast.success(message);
      setStatusModalOpen(false);
      setStatusChangeReason('');
      setPendingStatusChange(null);
      await fetchAgents();
    } catch (error) {
      console.error('Error changing agent status:', error);
      toast.error('No se pudo cambiar el estado del agente');
    }
  };

  const openEditModal = (agent: any) => {
    setSelectedAgent(agent);
    setEditForm({
      full_name: agent.full_name || '',
      agent_code: agent.agent_code || ''
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedAgent) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          agent_code: editForm.agent_code
        })
        .eq('id', selectedAgent.id);

      if (error) throw error;

      toast.success('Agente actualizado correctamente');
      setEditModalOpen(false);
      await fetchAgents();
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('No se pudo guardar los cambios');
    }
  };

  const openAssignModal = (property: any) => {
    setSelectedProperty(property);
    setAssignModalOpen(true);
  };

  const handleAssignProperty = async (agentCode: string, reason: string) => {
    if (!selectedProperty || !user) return;

    setIsAssigning(true);
    try {
      // Find the agent by code
      const { data: targetAgent, error: agentError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('agent_code', agentCode)
        .single();

      if (agentError || !targetAgent) {
        toast.error('No se encontró un agente con ese código');
        return;
      }

      // Create the assignment record
      const { error: assignError } = await supabase
        .from('property_assignments')
        .insert({
          property_id: selectedProperty.id,
          from_agent_id: selectedProperty.agent_id,
          to_agent_id: targetAgent.id,
          reason: reason
        });

      if (assignError) throw assignError;

      // Update the property's agent
      const { error: updateError } = await supabase
        .from('properties')
        .update({ agent_id: targetAgent.id })
        .eq('id', selectedProperty.id);

      if (updateError) throw updateError;

      // Create notification for the new agent
      await supabase
        .from('agent_notifications')
        .insert({
          from_agent_id: user.id,
          to_agent_id: targetAgent.id,
          property_id: selectedProperty.id,
          message: `Se te ha asignado la propiedad: ${selectedProperty.title}. Motivo: ${reason}`
        });

      toast.success(`Propiedad asignada exitosamente a ${targetAgent.full_name}`);
      setAssignModalOpen(false);
      setSelectedProperty(null);
      await fetchProperties();
    } catch (error: any) {
      console.error('Error assigning property:', error);
      toast.error('Error al asignar la propiedad: ' + error.message);
    } finally {
      setIsAssigning(false);
    }
  };

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
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-blue-500/5 rounded-xl sm:rounded-2xl border border-blue-500/10 shadow-sm sm:shadow-lg">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-4 sm:gap-6">
                {/* Title and Avatar Row */}
                <div className="flex items-center gap-3">
                  {profile?.avatar_url && (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-blue-500/20 flex-shrink-0">
                      <img 
                        src={profile.avatar_url} 
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full animate-pulse flex-shrink-0"></div>
                    <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-blue-600 truncate">
                      Panel de Supervisión
                    </h1>
                  </div>
                </div>
                
                {/* User Info */}
                {profile && (
                  <div className="space-y-2 sm:space-y-3">
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Bienvenido, <span className="font-semibold text-blue-600">{profile.full_name || user?.email}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <Badge variant="outline" className="text-[10px] sm:text-xs font-mono bg-blue-500/5 border-blue-500/20 text-blue-600 px-2 py-0.5">
                        Supervisión
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5">
                        {agents.filter(a => !a.is_archived).length} Activos
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5">
                        {archiveRequests.length} Solicitudes
                      </Badge>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3 pt-1">
                  <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none" asChild>
                    <Link to="/">Portal Principal</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none" onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  }}>
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agentes Activos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents.filter(a => !a.is_archived).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Propiedades Activas</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {properties.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agentes Inactivos</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents.filter(a => a.is_archived).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-center">
            <TabsList className="bg-muted/50 p-1 h-auto">
              <TabsTrigger 
                value="agentes" 
                className="text-xs sm:text-sm px-4 sm:px-6 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
              >
                <Users className="h-4 w-4 mr-1.5 sm:mr-2" />
                Agentes
              </TabsTrigger>
              <TabsTrigger 
                value="propiedades"
                className="text-xs sm:text-sm px-4 sm:px-6 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
              >
                <Home className="h-4 w-4 mr-1.5 sm:mr-2" />
                Propiedades
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="agentes">
            <Card className="border-0 sm:border shadow-none sm:shadow-sm">
              <CardHeader className="px-3 sm:px-6 py-4">
                <CardTitle className="text-base sm:text-lg">Lista de Agentes</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Control de estado de agentes</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-3">
                  {agents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No hay agentes registrados</p>
                  ) : (
                    agents.map((agent) => (
                      <div key={agent.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                        {/* Agent Info Row */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
                                {agent.full_name || 'Sin nombre'}
                              </p>
                              <Badge 
                                variant={agent.is_archived ? "destructive" : "default"}
                                className="text-[10px] sm:text-xs px-1.5 py-0 h-5"
                              >
                                {agent.is_archived ? 'Inactivo' : 'Activo'}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              Código: {agent.agent_code}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 ml-auto sm:ml-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-2 sm:px-3"
                            onClick={() => openEditModal(agent)}
                          >
                            <Edit className="h-3.5 w-3.5 sm:mr-1" />
                            <span className="hidden sm:inline">Editar</span>
                          </Button>
                          <Button
                            variant={agent.is_archived ? "default" : "destructive"}
                            size="sm"
                            className="h-8 text-xs px-2 sm:px-3"
                            onClick={() => openStatusModal(agent.id, agent.is_archived)}
                          >
                            <Power className="h-3.5 w-3.5 sm:mr-1" />
                            <span className="hidden sm:inline">{agent.is_archived ? 'Activar' : 'Desactivar'}</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="propiedades">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Propiedades</CardTitle>
                <CardDescription>Asigna propiedades a diferentes agentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {properties.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No hay propiedades disponibles</p>
                  ) : (
                    properties.map((property) => (
                      <div key={property.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Home className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{property.title}</p>
                            <p className="text-sm text-muted-foreground">{property.address}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {property.property_type}
                              </Badge>
                              {property.profiles && (
                                <span className="text-xs text-muted-foreground">
                                  Agente: {property.profiles.full_name} ({property.profiles.agent_code})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAssignModal(property)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Asignar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Edit Agent Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Agente</DialogTitle>
            <DialogDescription>
              Actualiza la información del agente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="Ingrese el nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent_code">Código de Agente</Label>
              <Input
                id="agent_code"
                value={editForm.agent_code}
                onChange={(e) => setEditForm({ ...editForm, agent_code: e.target.value })}
                placeholder="Ingrese el código"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingStatusChange?.newStatus ? 'Desactivar' : 'Activar'} Agente
            </DialogTitle>
            <DialogDescription>
              Por favor ingrese el motivo del cambio de estado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Textarea
                id="reason"
                value={statusChangeReason}
                onChange={(e) => setStatusChangeReason(e.target.value)}
                placeholder={pendingStatusChange?.newStatus 
                  ? "Ej: inactividad prolongada" 
                  : "Ej: reincorporación al equipo"}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setStatusModalOpen(false);
              setStatusChangeReason('');
              setPendingStatusChange(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleStatusChange}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Property Modal */}
      <AssignPropertyModal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedProperty(null);
        }}
        onAssign={handleAssignProperty}
        property={selectedProperty}
        isLoading={isAssigning}
      />
    </div>
  );
}
