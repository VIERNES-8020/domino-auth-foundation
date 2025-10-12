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
import { UserCheck, UserX, Users, Bell, CheckCircle, XCircle, Clock, History, Edit, Power } from "lucide-react";

export default function SupervisorDashboard() {
  const [activeTab, setActiveTab] = useState("agentes");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [archiveRequests, setArchiveRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: '', agent_code: '' });
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState<{ agentId: string; newStatus: boolean } | null>(null);

  useEffect(() => {
    document.title = "Panel de Supervisión - Dominio Inmobiliaria";
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchProfile(user.id);
        await fetchAgents();
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
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-blue-500/5 rounded-2xl border border-blue-500/10 shadow-lg">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    {profile?.avatar_url && (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500/20">
                        <img 
                          src={profile.avatar_url} 
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full animate-pulse"></div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-blue-600">
                        Panel de Supervisión
                      </h1>
                    </div>
                  </div>
                  {profile && (
                    <div className="space-y-2">
                      <p className="text-lg text-muted-foreground">
                        Bienvenido, <span className="font-semibold text-blue-600">{profile.full_name || user?.email}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-sm font-mono bg-blue-500/5 border-blue-500/20 text-blue-600">
                          Supervisión (Auxiliar)
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {agents.filter(a => !a.is_archived).length} Agentes Activos
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {archiveRequests.length} Solicitudes
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
              <CardTitle className="text-sm font-medium">Agentes Inactivos</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents.filter(a => a.is_archived).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Agentes</CardTitle>
            <CardDescription>Control de estado de agentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay agentes registrados</p>
              ) : (
                agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{agent.full_name || 'Sin nombre'}</p>
                        <p className="text-sm text-muted-foreground">Código: {agent.agent_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={agent.is_archived ? "destructive" : "default"}>
                        {agent.is_archived ? 'Inactivo' : 'Activo'}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(agent)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant={agent.is_archived ? "default" : "destructive"}
                          size="sm"
                          onClick={() => openStatusModal(agent.id, agent.is_archived)}
                        >
                          <Power className="h-4 w-4 mr-1" />
                          {agent.is_archived ? 'Activar' : 'Desactivar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
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
    </div>
  );
}
