import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eye, Edit, Trash, Archive, Plus, CheckCircle, ArchiveRestore, MoreVertical, Reply, Mail, MessageCircle, Bot, User, TrendingUp, Clock, CheckSquare, X, UserPlus, UserCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import PropertyForm from "@/components/PropertyForm";
import ProfileForm from "@/components/ProfileForm";
import PropertyViewModal from "@/components/PropertyViewModal";
import DeletePropertyModal from "@/components/DeletePropertyModal";
import ArchivePropertyModal from "@/components/ArchivePropertyModal";
import AssignPropertyModal from "@/components/AssignPropertyModal";
import NotificationResponseModal from "@/components/NotificationResponseModal";
import PropertyTypeStats from "@/components/PropertyTypeStats";
import SalesProcessStats from "@/components/SalesProcessStats";
import AmenitiesManagement from "@/components/AmenitiesManagement";
import { supabase } from "@/integrations/supabase/client";

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState("propiedades");
  const [showArchived, setShowArchived] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [viewingProperty, setViewingProperty] = useState<any>(null);
  const [deletingProperty, setDeletingProperty] = useState<any>(null);
  const [archivingProperty, setArchivingProperty] = useState<any>(null);
  const [assigningProperty, setAssigningProperty] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [propertyVisits, setPropertyVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingNotification, setRespondingNotification] = useState<any>(null);
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'confirmed' | 'cancelled' | 'pending' | 'rescheduled' | 'effective' | 'denied'>('all');
  const [cancellingVisit, setCancellingVisit] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [reschedulingVisit, setReschedulingVisit] = useState<any>(null);
  const [newScheduledDate, setNewScheduledDate] = useState<Date>();
  const [reschedulingReason, setReschedulingReason] = useState('');
  const [dateConflict, setDateConflict] = useState(false);
  const [dateChanged, setDateChanged] = useState(false);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<{type: string; status: 'all' | 'active' | 'concluded'} | null>(null);
  
  // Estados para el modal de Propiedad Efectiva
  const [effectivePropertyModal, setEffectivePropertyModal] = useState<any>(null);
  const [saleAmount, setSaleAmount] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState('');
  const [transactionType, setTransactionType] = useState('venta');
  
  // Estados para el modal de Propiedad Negada
  const [deniedPropertyModal, setDeniedPropertyModal] = useState<any>(null);
  const [denialReason, setDenialReason] = useState('');

  // Estados para el modal de Archivar Visita
  const [archivingVisit, setArchivingVisit] = useState<any>(null);
  const [archiveReason, setArchiveReason] = useState('');

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchProfile(user.id);
        await fetchProperties(user.id);
        await fetchNotifications(user.id);
        await fetchPropertyVisits(user.id);
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

  const fetchProperties = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchNotifications = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('agent_notifications')
        .select('*')
        .eq('to_agent_id', agentId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchPropertyVisits = async (agentId: string) => {
    try {
      const { data: visits, error: visitsError } = await supabase
        .from('property_visits')
        .select('*')
        .eq('agent_id', agentId)
        .order('scheduled_at', { ascending: true });

      if (visitsError) throw visitsError;

      if (visits && visits.length > 0) {
        const propertyIds = visits.map(visit => visit.property_id);
        
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('id, title, address')
          .in('id', propertyIds);

        if (propertiesError) throw propertiesError;

        const visitsWithProperties = visits.map(visit => ({
          ...visit,
          properties: properties?.find(p => p.id === visit.property_id) || null
        }));

        setPropertyVisits(visitsWithProperties);
      } else {
        setPropertyVisits([]);
      }
    } catch (error) {
      console.error('Error fetching property visits:', error);
    }
  };

  const handlePropertySubmit = async (propertyData: any) => {
    if (!user) return;
    
    try {
      console.log("=== HANDLEPROPERTYSUBMIT INICIADO ===");
      console.log("User ID:", user.id);
      console.log("Property data received:", propertyData);
      
      if (editingProperty) {
        const { data: currentProperty, error: fetchError } = await supabase
          .from('properties')
          .select('edit_count')
          .eq('id', editingProperty.id)
          .single();

        if (fetchError) throw fetchError;

        const { error } = await supabase
          .from('properties')
          .update({
            title: propertyData.title,
            description: propertyData.description,
            price: parseFloat(propertyData.price),
            price_currency: propertyData.currency,
            property_type: propertyData.property_type,
            bedrooms: propertyData.bedrooms ? parseInt(propertyData.bedrooms) : null,
            bathrooms: propertyData.bathrooms ? parseInt(propertyData.bathrooms) : null,
            area_m2: propertyData.area ? parseFloat(propertyData.area) : null,
            constructed_area_m2: propertyData.constructed_area_m2 ? parseFloat(propertyData.constructed_area_m2) : null,
            address: propertyData.address,
            geolocation: propertyData.latitude && propertyData.longitude 
              ? `POINT(${propertyData.longitude} ${propertyData.latitude})` 
              : null,
            tags: propertyData.features,
            image_urls: propertyData.image_urls,
            video_url: propertyData.video_url,
            plans_url: propertyData.plans_url,
            edit_count: (currentProperty?.edit_count || 0) + 1
          })
          .eq('id', editingProperty.id)
          .eq('agent_id', user.id);

        if (error) {
          console.error("Error actualizando propiedad:", error);
          throw error;
        }
        console.log("Propiedad actualizada exitosamente");
        toast.success('Propiedad actualizada exitosamente');
      } else {
        console.log("Creando nueva propiedad con datos:", {
          title: propertyData.title,
          price: parseFloat(propertyData.price),
          agent_id: user.id
        });
        const { data, error } = await supabase
          .from('properties')
          .insert({
            title: propertyData.title,
            description: propertyData.description,
            price: parseFloat(propertyData.price),
            price_currency: propertyData.currency,
            property_type: propertyData.property_type,
            bedrooms: propertyData.bedrooms ? parseInt(propertyData.bedrooms) : null,
            bathrooms: propertyData.bathrooms ? parseInt(propertyData.bathrooms) : null,
            area_m2: propertyData.area ? parseFloat(propertyData.area) : null,
            constructed_area_m2: propertyData.constructed_area_m2 ? parseFloat(propertyData.constructed_area_m2) : null,
            address: propertyData.address,
            geolocation: propertyData.latitude && propertyData.longitude 
              ? `POINT(${propertyData.longitude} ${propertyData.latitude})` 
              : null,
            agent_id: user.id,
            status: 'approved',
            tags: propertyData.features,
            image_urls: propertyData.image_urls,
            video_url: propertyData.video_url,
            plans_url: propertyData.plans_url
          })
          .select();

        if (error) {
          console.error("Error creando propiedad:", error);
          console.error("Detalles del error:", error.details, error.hint, error.code);
          throw error;
        }
        
        console.log("Propiedad creada exitosamente:", data);
        
        const newProperty = data?.[0];
        if (newProperty?.property_code) {
          toast.success(
            `🎉 Propiedad creada exitosamente!\n📋 ID: ${newProperty.property_code}`,
            {
              duration: 6000,
              description: `Tu nueva propiedad tiene el código: ${newProperty.property_code}`,
            }
          );
        } else {
          toast.success('Propiedad creada exitosamente');
        }
      }
      
      console.log("Refrescando lista de propiedades...");
      await fetchProperties(user.id);
      setShowPropertyForm(false);
      setEditingProperty(null);
      console.log("=== HANDLEPROPERTYSUBMIT COMPLETADO EXITOSAMENTE ===");
    } catch (error: any) {
      console.error('=== ERROR EN HANDLEPROPERTYSUBMIT ===');
      console.error('Error saving property:', error);
      console.error('Error completo:', error);
      toast.error('Error al guardar la propiedad: ' + (error.message || 'Error desconocido'));
      throw error;
    }
  };

  const handleArchiveProperty = async (propertyId: string, isArchived: boolean, justification?: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          is_archived: isArchived,
          archive_reason: justification
        })
        .eq('id', propertyId)
        .eq('agent_id', user.id);

      if (error) throw error;
      
      toast.success(isArchived ? 'Propiedad archivada exitosamente' : 'Propiedad desarchivada exitosamente');
      
      await fetchProperties(user.id);
      setArchivingProperty(null);
    } catch (error: any) {
      console.error('Error archiving property:', error);
      toast.error('Error al archivar la propiedad');
    }
  };

  const handleDeleteProperty = async (reason: string) => {
    if (!user || !deletingProperty) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', deletingProperty.id)
        .eq('agent_id', user.id);

      if (error) throw error;
      
      console.log(`Property deleted: ${deletingProperty.title}, Reason: ${reason}`);
      
      toast.success('Propiedad eliminada exitosamente');
      
      await fetchProperties(user.id);
      setDeletingProperty(null);
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast.error('Error al eliminar la propiedad');
    }
  };

  const handleConcludeProperty = async (propertyId: string, status: 'vendido' | 'alquilado' | 'anticretico') => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          concluded_status: status,
          concluded_at: new Date().toISOString()
        })
        .eq('id', propertyId)
        .eq('agent_id', user.id);

      if (error) throw error;
      
      toast.success(`Propiedad marcada como ${status} exitosamente`);
      
      await fetchProperties(user.id);
    } catch (error: any) {
      console.error('Error concluding property:', error);
      toast.error('Error al marcar la propiedad como concluida');
    }
  };

  const handleVisitStatusChange = async (visitId: string, newStatus: 'confirmed' | 'cancelled', reason?: string) => {
    if (!user) return;
    
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Add cancellation reason if cancelling
      if (newStatus === 'cancelled' && reason) {
        updateData.visit_result = reason;
      }

      const { error } = await supabase
        .from('property_visits')
        .update(updateData)
        .eq('id', visitId)
        .eq('agent_id', user.id);

      if (error) throw error;
      
      toast.success(`Cita ${newStatus === 'confirmed' ? 'confirmada' : 'cancelada'} exitosamente`);
      
      await fetchPropertyVisits(user.id);
    } catch (error: any) {
      console.error('Error updating visit status:', error);
      toast.error('Error al actualizar el estado de la cita');
    }
  };

  const handleCancelVisit = (visit: any) => {
    setCancellingVisit(visit);
    setCancellationReason('');
  };

  const confirmCancelVisit = async () => {
    if (!cancellingVisit || !cancellationReason.trim()) {
      toast.error('Por favor, proporciona un motivo para la cancelación');
      return;
    }
    
    await handleVisitStatusChange(cancellingVisit.id, 'cancelled', cancellationReason);
    setCancellingVisit(null);
    setCancellationReason('');
  };

  const handleRescheduleVisit = (visit: any) => {
    setReschedulingVisit(visit);
    setNewScheduledDate(new Date(visit.scheduled_at));
    setReschedulingReason('');
    setDateChanged(false);
    setDateConflict(false);
  };

  const checkDateConflict = (newDate: Date) => {
    if (!newDate || !reschedulingVisit) return false;
    
    const newDateStr = newDate.toISOString().split('T')[0];
    const newTimeStr = newDate.toISOString().split('T')[1].substring(0, 5);
    
    return propertyVisits.some(visit => {
      if (visit.id === reschedulingVisit.id) return false; // Skip current visit
      if (visit.status === 'cancelled') return false; // Skip cancelled visits
      
      const visitDate = new Date(visit.scheduled_at);
      const visitDateStr = visitDate.toISOString().split('T')[0];
      const visitTimeStr = visitDate.toISOString().split('T')[1].substring(0, 5);
      
      return visitDateStr === newDateStr && visitTimeStr === newTimeStr;
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date && reschedulingVisit) {
      const originalDate = new Date(reschedulingVisit.scheduled_at);
      const hasChanged = date.getTime() !== originalDate.getTime();
      const hasConflict = checkDateConflict(date);
      
      setNewScheduledDate(date);
      setDateChanged(hasChanged);
      setDateConflict(hasConflict);
    } else {
      setNewScheduledDate(date);
      setDateChanged(false);
      setDateConflict(false);
    }
  };

  const confirmRescheduleVisit = async () => {
    if (!reschedulingVisit || !newScheduledDate) {
      toast.error('Por favor, selecciona una nueva fecha');
      return;
    }
    
    if (!reschedulingReason.trim()) {
      toast.error('Por favor, proporciona un motivo para la reprogramación');
      return;
    }

    try {
      const { error } = await supabase
        .from('property_visits')
        .update({ 
          scheduled_at: newScheduledDate.toISOString(),
          visit_result: `Reprogramada: ${reschedulingReason}`,
          status: 'rescheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', reschedulingVisit.id)
        .eq('agent_id', user.id);

      if (error) throw error;
      
      toast.success('Cita reprogramada exitosamente');
      
      await fetchPropertyVisits(user.id);
      setReschedulingVisit(null);
      setNewScheduledDate(undefined);
      setReschedulingReason('');
    } catch (error: any) {
      console.error('Error rescheduling visit:', error);
      toast.error('Error al reprogramar la cita');
    }
  };

  const handlePropertyEffective = (visit: any) => {
    setEffectivePropertyModal(visit);
    setSaleAmount('');
    setCommissionPercentage('5'); // Valor por defecto
    setTransactionType('venta');
  };

  const confirmPropertySale = async () => {
    if (!user || !effectivePropertyModal) return;
    
    if (!saleAmount || !commissionPercentage) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    
    try {
      const commissionAmount = (parseFloat(saleAmount) * parseFloat(commissionPercentage)) / 100;
      
      const { error } = await supabase
        .from('property_visits')
        .update({ 
          visit_result: 'Propiedad Efectiva',
          status: 'completed',
          outcome: 'effective',
          sale_amount: parseFloat(saleAmount),
          commission_percentage: parseFloat(commissionPercentage),
          commission_amount: commissionAmount,
          transaction_type: transactionType,
          currency: effectivePropertyModal.properties?.price_currency || 'USD',
          updated_at: new Date().toISOString()
        })
        .eq('id', effectivePropertyModal.id)
        .eq('agent_id', user.id);

      if (error) throw error;
      
      toast.success('Propiedad marcada como efectiva');
      
      setEffectivePropertyModal(null);
      await fetchPropertyVisits(user.id);
    } catch (error: any) {
      console.error('Error marking property as effective:', error);
      toast.error('Error al marcar la propiedad como efectiva');
    }
  };

  const handlePropertyDenied = (visit: any) => {
    setDeniedPropertyModal(visit);
    setDenialReason('');
  };

  const confirmPropertyDenial = async () => {
    if (!user || !deniedPropertyModal) return;
    
    if (!denialReason.trim()) {
      toast.error('Por favor ingresa la razón de la negación');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('property_visits')
        .update({ 
          visit_result: 'Propiedad Negada',
          status: 'completed',
          outcome: 'denied',
          message: denialReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', deniedPropertyModal.id)
        .eq('agent_id', user.id);

      if (error) throw error;
      
      toast.success('Propiedad marcada como negada');
      
      setDeniedPropertyModal(null);
      await fetchPropertyVisits(user.id);
    } catch (error: any) {
      console.error('Error marking property as denied:', error);
      toast.error('Error al marcar la propiedad como negada');
    }
  };

  const handleArchiveVisit = (visit: any) => {
    setArchivingVisit(visit);
    setArchiveReason('');
  };

  const confirmArchiveVisit = async () => {
    if (!user || !archivingVisit) return;
    
    if (!archiveReason.trim()) {
      toast.error('Por favor ingresa la razón del archivo');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('property_visits')
        .update({ 
          message: archiveReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', archivingVisit.id)
        .eq('agent_id', user.id);

      if (error) throw error;
      
      toast.success('Visita archivada correctamente');
      
      setArchivingVisit(null);
      setArchiveReason('');
      await fetchPropertyVisits(user.id);
    } catch (error: any) {
      console.error('Error archiving visit:', error);
      toast.error('Error al archivar la visita');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAssignProperty = async (agentCode: string, reason: string) => {
    if (!user || !assigningProperty) return;
    
    try {
      const { data: targetAgent, error: agentError } = await supabase
        .from('profiles')
        .select('id, full_name, agent_code')
        .eq('agent_code', agentCode)
        .single();

      if (agentError || !targetAgent) {
        toast.error(`No se encontró un agente con el código: ${agentCode}`);
        return;
      }

      if (targetAgent.id === user.id) {
        toast.error('No puedes asignar una propiedad a ti mismo');
        return;
      }

      const { error: updateError } = await supabase
        .from('properties')
        .update({ 
          agent_id: targetAgent.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', assigningProperty.id)
        .eq('agent_id', user.id);

      if (updateError) {
        console.error('Error assigning property:', updateError);
        toast.error('Error al asignar la propiedad');
        return;
      }

      toast.success(
        `Propiedad asignada exitosamente a ${targetAgent.full_name} (${agentCode})`,
        {
          description: `ID: ${assigningProperty.property_code || assigningProperty.id} - Motivo: ${reason}`,
          duration: 5000
        }
      );
      
      await fetchProperties(user.id);
      setAssigningProperty(null);
      
    } catch (error: any) {
      console.error('Error in handleAssignProperty:', error);
      toast.error('Error al asignar la propiedad: ' + error.message);
    }
  };

  const handlePropertyTypeFilter = (type: string, status: 'all' | 'active' | 'concluded') => {
    setPropertyTypeFilter({ type, status });
  };

  const getFilteredProperties = () => {
    let filtered = properties;

    if (showArchived) {
      filtered = filtered.filter(p => p.is_archived);
    } else {
      filtered = filtered.filter(p => !p.is_archived);
    }

    if (propertyTypeFilter) {
      filtered = filtered.filter(p => 
        p.property_type?.toLowerCase() === propertyTypeFilter.type.toLowerCase()
      );
      
      if (propertyTypeFilter.status === 'active') {
        filtered = filtered.filter(p => !p.concluded_status);
      } else if (propertyTypeFilter.status === 'concluded') {
        filtered = filtered.filter(p => p.concluded_status);
      }
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-transparent animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-primary">Cargando Panel de Agente</h3>
                <p className="text-muted-foreground">Preparando tu espacio de trabajo...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Modern Header Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5 rounded-2xl border border-primary/10 shadow-lg">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    {profile?.avatar_url && (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                        <img 
                          src={profile.avatar_url} 
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse"></div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-primary">
                        Panel de Agente
                      </h1>
                    </div>
                  </div>
                  {profile && (
                    <div className="space-y-2">
                      <p className="text-lg text-muted-foreground">
                        Bienvenido, <span className="font-semibold text-primary">{profile.full_name || 'Agente'}</span>
                      </p>
                      {profile.agent_code && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm font-mono bg-primary/5 border-primary/20 text-primary">
                            ID: {profile.agent_code}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {properties.length} Propiedades
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {propertyVisits.length} Citas
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => setShowPropertyForm(true)}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva Propiedad
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/">Portal Principal</Link>
                  </Button>
                  <Button variant="outline" onClick={signOut}>
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg -z-10"></div>
              <TabsList className="grid w-full grid-cols-7 h-12 bg-white/50 backdrop-blur-sm border border-primary/10">
                <TabsTrigger
                    value="propiedades" 
                    className="relative px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary hover:bg-white/50"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Mis Propiedades
                      {properties.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20">
                          {properties.length}
                        </Badge>
                      )}
                    </div>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="estadisticas" 
                    className="relative px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary hover:bg-white/50"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Estadísticas
                    </div>
                  </TabsTrigger>

                  <TabsTrigger 
                    value="citas" 
                    className="relative px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary hover:bg-white/50"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Citas Programadas
                      {propertyVisits.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5 bg-orange/10 text-orange border-orange/20">
                          {propertyVisits.length}
                        </Badge>
                      )}
                    </div>
                  </TabsTrigger>

                  <TabsTrigger 
                    value="caracteristicas" 
                    className="relative px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary hover:bg-white/50"
                  >
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4" />
                      Características
                    </div>
                  </TabsTrigger>

                  <TabsTrigger 
                    value="asignacion" 
                    className="relative px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary hover:bg-white/50"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Asignación Propiedad
                    </div>
                  </TabsTrigger>

                  <TabsTrigger 
                    value="notificaciones" 
                    className="relative px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary hover:bg-white/50"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Notificaciones
                      {notifications.length > 0 && (
                        <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0.5">
                          {notifications.length}
                        </Badge>
                      )}
                    </div>
                  </TabsTrigger>

                  <TabsTrigger 
                    value="perfil" 
                    className="relative px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary hover:bg-white/50"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Mi Perfil
                    </div>
                  </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents */}
            <div className="mt-6">
              <TabsContent value="propiedades" className="space-y-6">
                {showPropertyForm ? (
                  <PropertyForm 
                    onClose={() => {
                      setShowPropertyForm(false);
                      setEditingProperty(null);
                    }}
                    onSubmit={handlePropertySubmit}
                    initialData={editingProperty}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            Mis Propiedades
                          </CardTitle>
                          <CardDescription>
                            Gestiona y supervisa todas tus propiedades
                          </CardDescription>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {propertyTypeFilter && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setPropertyTypeFilter(null)}
                              className="gap-2"
                            >
                              <X className="h-4 w-4" />
                              Limpiar Filtro
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowArchived(!showArchived)}
                            className="gap-2"
                          >
                            {showArchived ? (
                              <>
                                <Eye className="h-4 w-4" />
                                Ver Activas
                              </>
                            ) : (
                              <>
                                <Archive className="h-4 w-4" />
                                Ver Archivadas
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => setShowPropertyForm(true)}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Nueva Propiedad
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {getFilteredProperties().length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                          <Bot className="h-12 w-12 mx-auto text-muted-foreground/50" />
                          <h3 className="text-lg font-medium text-muted-foreground">
                            {showArchived ? "No hay propiedades archivadas" : "No hay propiedades"}
                          </h3>
                          <p className="text-muted-foreground max-w-sm mx-auto">
                            {showArchived 
                              ? "Las propiedades archivadas aparecerán aquí."
                              : "Comienza agregando tu primera propiedad."
                            }
                          </p>
                          {!showArchived && (
                            <Button onClick={() => setShowPropertyForm(true)} className="gap-2">
                              <Plus className="h-4 w-4" />
                              Agregar Primera Propiedad
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {getFilteredProperties().map((property) => (
                              <Card key={property.id} className="group hover:shadow-xl transition-all duration-300 border-primary/10 hover:border-primary/30">
                                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                                  <img
                                    src={property.image_urls?.[0] || '/default-placeholder.jpg'}
                                    alt={property.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/default-placeholder.jpg';
                                    }}
                                  />
                                  {property.concluded_status && (
                                    <Badge className="absolute top-2 left-2 bg-green-500">
                                      {property.concluded_status.toUpperCase()}
                                    </Badge>
                                  )}
                                </div>
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div>
                                      <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                        {property.title}
                                      </h3>
                                      <p className="text-sm text-muted-foreground line-clamp-1">{property.address}</p>
                                      {property.property_code && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <Badge variant="outline" className="text-xs font-mono bg-primary/5 border-primary/20 text-primary">
                                            ID: {property.property_code}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="font-bold text-primary text-lg">
                                        {property.price_currency === 'USD' ? 'US$' : property.price_currency} {property.price?.toLocaleString()}
                                      </div>
                                      <Badge variant={property.status === 'approved' ? 'default' : 'secondary'}>
                                        {property.status}
                                      </Badge>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setViewingProperty(property)}
                                          className="gap-1"
                                        >
                                          <Eye className="h-3 w-3" />
                                          Ver
                                        </Button>
                                        {property.edit_count > 0 && (
                                          <Badge variant="secondary" className="text-xs px-2 py-1">
                                            Editado {property.edit_count} {property.edit_count === 1 ? 'vez' : 'veces'}
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                           <DropdownMenuItem onClick={() => {
                                             setEditingProperty(property);
                                             setShowPropertyForm(true);
                                           }}>
                                             <Edit className="mr-2 h-4 w-4" />
                                             Editar
                                           </DropdownMenuItem>
                                          {property.is_archived ? (
                                            <DropdownMenuItem onClick={() => handleArchiveProperty(property.id, false)}>
                                              <ArchiveRestore className="mr-2 h-4 w-4" />
                                              Desarchivar
                                            </DropdownMenuItem>
                                          ) : (
                                            <DropdownMenuItem onClick={() => setArchivingProperty(property)}>
                                              <Archive className="mr-2 h-4 w-4" />
                                              Archivar
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem onClick={() => setAssigningProperty(property)}>
                                            <UserCheck className="mr-2 h-4 w-4" />
                                            Asignar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => setDeletingProperty(property)}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <Trash className="mr-2 h-4 w-4" />
                                            Eliminar
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="estadisticas" className="space-y-6">
                <PropertyTypeStats properties={properties} onFilterChange={handlePropertyTypeFilter} />
                {user && <SalesProcessStats agentId={user.id} />}
              </TabsContent>

              <TabsContent value="citas" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Citas Programadas
                    </CardTitle>
                    <CardDescription>Gestiona y confirma tus próximas citas</CardDescription>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {(() => {
                        const confirmedCount = propertyVisits.filter(v => v.status === 'confirmed').length;
                        const pendingCount = propertyVisits.filter(v => v.status === 'pending').length;
                        const cancelledCount = propertyVisits.filter(v => v.status === 'cancelled').length;
                        const rescheduledCount = propertyVisits.filter(v => v.status === 'rescheduled').length;
                        const completedCount = propertyVisits.filter(v => v.status === 'completed' && v.outcome === 'effective').length;
                        const deniedCount = propertyVisits.filter(v => v.status === 'completed' && v.outcome === 'denied').length;
                        const totalCount = propertyVisits.length;
                        
                        return (
                          <>
                            <Button
                              variant={appointmentFilter === 'all' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setAppointmentFilter('all')}
                            >
                              Pendientes ({totalCount})
                            </Button>
                            <Button
                              variant={appointmentFilter === 'confirmed' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setAppointmentFilter('confirmed')}
                            >
                              Confirmadas ({confirmedCount})
                            </Button>
                            <Button
                              variant={appointmentFilter === 'cancelled' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setAppointmentFilter('cancelled')}
                            >
                              Canceladas ({cancelledCount})
                            </Button>
                            <Button
                              variant={appointmentFilter === 'rescheduled' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setAppointmentFilter('rescheduled')}
                            >
                              Reprogramadas ({rescheduledCount})
                            </Button>
                            <Button
                              variant={appointmentFilter === 'effective' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setAppointmentFilter('effective')}
                              className="bg-green-500 text-white hover:bg-green-600 border-green-500 data-[state=active]:bg-green-600"
                            >
                              Propiedad Efectiva ({completedCount})
                            </Button>
                            <Button
                              variant={appointmentFilter === 'denied' ? 'destructive' : 'outline'}
                              size="sm"
                              onClick={() => setAppointmentFilter('denied')}
                              className="bg-red-500 text-white hover:bg-red-600 border-red-500 data-[state=active]:bg-red-600"
                            >
                              Propiedad Negada ({deniedCount})
                            </Button>
                          </>
                        );
                      })()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const filteredVisits = appointmentFilter === 'all' 
                        ? propertyVisits 
                        : appointmentFilter === 'effective'
                        ? propertyVisits.filter(visit => visit.status === 'completed' && visit.outcome === 'effective')
                        : appointmentFilter === 'denied'
                        ? propertyVisits.filter(visit => visit.status === 'completed' && visit.outcome === 'denied')
                        : propertyVisits.filter(visit => visit.status === appointmentFilter);
                      
                      return filteredVisits.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          {appointmentFilter === 'all' ? 'No tienes citas programadas' : `No tienes citas ${
                            appointmentFilter === 'confirmed' ? 'confirmadas' : 
                            appointmentFilter === 'pending' ? 'pendientes' : 
                            appointmentFilter === 'cancelled' ? 'canceladas' :
                            appointmentFilter === 'rescheduled' ? 'reprogramadas' :
                            appointmentFilter === 'effective' ? 'con resultado efectivo' :
                            appointmentFilter === 'denied' ? 'con resultado negativo' : ''
                          }`}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredVisits.map((visit) => (
                           <div key={visit.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border rounded-lg">
                             <div className="space-y-1 flex-1">
                               <div className="font-medium">{visit.properties?.title || 'Propiedad'}</div>
                               <div className="text-sm text-muted-foreground">{visit.properties?.address}</div>
                               <div className="text-sm text-muted-foreground">
                                 <div>Cita programada: {new Date(visit.scheduled_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                                 {visit.updated_at && visit.status !== 'pending' && (
                                   <div className="text-xs text-muted-foreground mt-1">
                                     Acción realizada: {new Date(visit.updated_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                                   </div>
                                 )}
                               </div>
                               
                               {/* Mostrar motivo de negación cuando está en filtro de propiedades negadas */}
                               {appointmentFilter === 'denied' && visit.message && (
                                 <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                   <div className="text-sm font-medium text-red-800 mb-1">Motivo de la Negación:</div>
                                   <div className="text-sm text-red-700">{visit.message}</div>
                                 </div>
                               )}
                               
                               {/* Mostrar motivo de cancelación cuando está en filtro de canceladas */}
                               {appointmentFilter === 'cancelled' && visit.message && (
                                 <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                                   <div className="text-sm font-medium text-orange-800 mb-1">Motivo de la Cancelación:</div>
                                   <div className="text-sm text-orange-700">{visit.message}</div>
                                 </div>
                               )}
                               
                               {/* Mostrar información de venta cuando está en filtro de propiedades efectivas */}
                               {appointmentFilter === 'effective' && visit.sale_amount && (
                                 <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                   <div className="text-sm font-medium text-green-800 mb-1">Detalles de la Venta:</div>
                                   <div className="text-sm text-green-700">
                                     <div>Monto: {visit.currency || 'USD'} {visit.sale_amount?.toLocaleString()}</div>
                                     {visit.commission_percentage && (
                                       <div>Comisión: {visit.commission_percentage}% ({visit.currency || 'USD'} {visit.commission_amount?.toLocaleString()})</div>
                                     )}
                                   </div>
                                 </div>
                               )}
                             </div>
                             <div className="flex items-center gap-2">
                               {visit.status === 'pending' && (
                                 <>
                                   <Button size="sm" onClick={() => handleVisitStatusChange(visit.id, 'confirmed')}>Confirmar</Button>
                                   <Button size="sm" variant="outline" onClick={() => handleCancelVisit(visit)}>Cancelar</Button>
                                 </>
                               )}
                                {visit.status === 'confirmed' && (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => handleRescheduleVisit(visit)}>Reprogramar</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleCancelVisit(visit)}>Cancelar</Button>
                                    <Button size="sm" onClick={() => handlePropertyEffective(visit)} className="bg-green-500 text-white hover:bg-green-600">Propiedad Efectiva</Button>
                                    <Button size="sm" onClick={() => handlePropertyDenied(visit)} className="bg-red-500 text-white hover:bg-red-600">Propiedad Negada</Button>
                                  </>
                                )}
                                {visit.status === 'rescheduled' && (
                                  <>
                                    <Button size="sm" onClick={() => handleVisitStatusChange(visit.id, 'confirmed')}>Confirmar</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleCancelVisit(visit)}>Cancelar</Button>
                                    <Button size="sm" onClick={() => handlePropertyEffective(visit)} className="bg-green-500 text-white hover:bg-green-600">Propiedad Efectiva</Button>
                                    <Button size="sm" onClick={() => handlePropertyDenied(visit)} className="bg-red-500 text-white hover:bg-red-600">Propiedad Negada</Button>
                                  </>
                                 )}
                                 {(visit.status === 'completed') && (
                                   <Button 
                                     size="sm" 
                                     variant="outline" 
                                     onClick={() => handleArchiveVisit(visit)}
                                     className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                   >
                                     <Archive className="h-4 w-4 mr-1" />
                                     Archivar
                                   </Button>
                                 )}
                                <Badge variant="outline" className="capitalize">{visit.status}</Badge>
                             </div>
                          </div>
                        ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="caracteristicas" className="space-y-6">
                <AmenitiesManagement />
              </TabsContent>

              <TabsContent value="notificaciones" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Notificaciones
                    </CardTitle>
                    <CardDescription>Responde a las consultas de clientes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {notifications.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">No tienes notificaciones pendientes</div>
                    ) : (
                      <div className="space-y-4">
                        {notifications.map((n) => (
                          <div key={n.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="font-medium mb-1">{n.title || 'Nueva notificación'}</div>
                                <div className="text-sm text-muted-foreground whitespace-pre-wrap">{n.message}</div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  {new Date(n.created_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button size="sm" onClick={() => setRespondingNotification(n)}>Responder</Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="asignacion" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Asignación de Propiedades
                    </CardTitle>
                    <CardDescription>
                      Administra las asignaciones de propiedades entre agentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 space-y-4">
                      <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <h3 className="text-lg font-medium text-muted-foreground">
                        Asignación de Propiedades
                      </h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Usa el botón "Asignar" en el menú de cada propiedad para transferirla a otro agente.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="perfil" className="space-y-6">
                <ProfileForm user={user} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Modals */}
        {viewingProperty && (
          <PropertyViewModal
            property={viewingProperty}
            isOpen={!!viewingProperty}
            onClose={() => setViewingProperty(null)}
          />
        )}

        {deletingProperty && (
          <DeletePropertyModal
            propertyTitle={deletingProperty.title}
            isOpen={!!deletingProperty}
            onClose={() => setDeletingProperty(null)}
            onConfirm={handleDeleteProperty}
          />
        )}

        {archivingProperty && (
          <ArchivePropertyModal
            property={archivingProperty}
            isOpen={!!archivingProperty}
            onClose={() => setArchivingProperty(null)}
            onConfirm={(justification: string) => handleArchiveProperty(archivingProperty.id, true, justification)}
          />
        )}

        {/* Assign Property Modal */}
        {assigningProperty && (
          <AssignPropertyModal
            isOpen={!!assigningProperty}
            onClose={() => setAssigningProperty(null)}
            onAssign={handleAssignProperty}
            property={assigningProperty}
          />
        )}

        {respondingNotification && (
          <NotificationResponseModal
            notification={respondingNotification}
            isOpen={!!respondingNotification}
            onClose={() => setRespondingNotification(null)}
            agentProfile={profile}
          />
        )}

        {/* Cancellation Reason Modal */}
        <Dialog open={!!cancellingVisit} onOpenChange={() => setCancellingVisit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar Cita</DialogTitle>
              <DialogDescription>
                Por favor, proporciona el motivo de la cancelación de esta cita.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cancellation-reason">Motivo de cancelación</Label>
                <Textarea
                  id="cancellation-reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Explica el motivo de la cancelación..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancellingVisit(null)}>
                Volver
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmCancelVisit}
                disabled={!cancellationReason.trim()}
              >
                Cancelar Cita
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reschedule Visit Modal */}
        <Dialog open={!!reschedulingVisit} onOpenChange={() => setReschedulingVisit(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Reprogramar Cita</DialogTitle>
              <DialogDescription>
                Selecciona una nueva fecha y hora para la cita con {reschedulingVisit?.client_name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Propiedad</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  <div className="font-medium">{reschedulingVisit?.properties?.title}</div>
                  <div className="text-muted-foreground">{reschedulingVisit?.properties?.address}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Fecha actual</Label>
                <div className="text-sm text-muted-foreground">
                  {reschedulingVisit && format(new Date(reschedulingVisit.scheduled_at), 'PPP p')}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nueva fecha y hora</Label>
                {dateConflict && (
                  <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md p-2 mb-2">
                    ⚠️ Conflicto detectado: Ya tienes una cita programada en esta fecha y hora. Por favor, verifica la fecha de reprogramación.
                  </div>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newScheduledDate && "text-muted-foreground",
                        dateChanged && !dateConflict && "border-green-500 bg-green-50 text-green-700",
                        dateConflict && "border-red-500 bg-red-50 text-red-700"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newScheduledDate ? format(newScheduledDate, "PPP p") : <span>Seleccionar fecha</span>}
                      {dateChanged && !dateConflict && <span className="ml-2 text-green-600">✓</span>}
                      {dateConflict && <span className="ml-2 text-red-600">⚠️</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newScheduledDate}
                      onSelect={handleDateChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                    <div className="p-3 border-t">
                      <Label className="text-sm font-medium">Hora</Label>
                      <input
                        type="time"
                        className={cn(
                          "w-full mt-1 p-2 border rounded-md",
                          dateChanged && !dateConflict && "border-green-500 bg-green-50",
                          dateConflict && "border-red-500 bg-red-50"
                        )}
                        value={newScheduledDate ? format(newScheduledDate, 'HH:mm') : ''}
                        onChange={(e) => {
                          if (newScheduledDate && e.target.value) {
                            const [hours, minutes] = e.target.value.split(':');
                            const newDate = new Date(newScheduledDate);
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            handleDateChange(newDate);
                          }
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rescheduling-reason">Motivo de la reprogramación</Label>
                <Textarea
                  id="rescheduling-reason"
                  value={reschedulingReason}
                  onChange={(e) => setReschedulingReason(e.target.value)}
                  placeholder="Explica por qué se reprograma la cita..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReschedulingVisit(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={confirmRescheduleVisit}
                disabled={!newScheduledDate || !reschedulingReason.trim() || dateConflict}
                className={cn(
                  dateConflict && "opacity-50 cursor-not-allowed"
                )}
              >
                Reprogramar Cita
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Propiedad Efectiva */}
        <Dialog open={!!effectivePropertyModal} onOpenChange={() => setEffectivePropertyModal(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-green-600">Propiedad Efectiva</DialogTitle>
              <DialogDescription>
                Registra los detalles de la venta exitosa
              </DialogDescription>
            </DialogHeader>
            {effectivePropertyModal && (
              <div className="space-y-4">
                {/* Información de la propiedad */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-gray-900">Información de la Propiedad</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Código:</span>
                      <span className="ml-2">{effectivePropertyModal.properties?.property_code || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Título:</span>
                      <span className="ml-2">{effectivePropertyModal.properties?.title}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Dirección:</span>
                      <span className="ml-2">{effectivePropertyModal.properties?.address}</span>
                    </div>
                    <div>
                      <span className="font-medium">Precio Comercial:</span>
                      <span className="ml-2 font-semibold text-primary">
                        {effectivePropertyModal.properties?.price_currency === 'USD' ? 'US$' : effectivePropertyModal.properties?.price_currency} {effectivePropertyModal.properties?.price?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detalles de la venta */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="transaction-type">Tipo de Transacción</Label>
                    <select
                      id="transaction-type"
                      className="w-full mt-1 p-2 border rounded-md"
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                    >
                      <option value="venta">Venta</option>
                      <option value="alquiler">Alquiler</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="sale-amount">Monto Final de {transactionType === 'venta' ? 'Venta' : 'Alquiler'} *</Label>
                    <Input
                      id="sale-amount"
                      type="number"
                      placeholder={`Monto final en ${effectivePropertyModal.properties?.price_currency || 'USD'}`}
                      value={saleAmount}
                      onChange={(e) => setSaleAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="commission-percentage">Porcentaje de Comisión (%) *</Label>
                    <Input
                      id="commission-percentage"
                      type="number"
                      placeholder="Ej: 5"
                      value={commissionPercentage}
                      onChange={(e) => setCommissionPercentage(e.target.value)}
                      className="mt-1"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  {saleAmount && commissionPercentage && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm text-green-800">
                        <strong>Comisión Calculada:</strong>
                        <span className="ml-2 font-semibold">
                          {effectivePropertyModal.properties?.price_currency === 'USD' ? 'US$' : effectivePropertyModal.properties?.price_currency} {((parseFloat(saleAmount) * parseFloat(commissionPercentage)) / 100).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEffectivePropertyModal(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={confirmPropertySale}
                className="bg-green-500 hover:bg-green-600"
                disabled={!saleAmount || !commissionPercentage}
              >
                Confirmar Venta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Propiedad Negada */}
        <Dialog open={!!deniedPropertyModal} onOpenChange={() => setDeniedPropertyModal(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-red-600">Propiedad Negada</DialogTitle>
              <DialogDescription>
                Registra el motivo por el cual la propiedad no fue efectiva
              </DialogDescription>
            </DialogHeader>
            {deniedPropertyModal && (
              <div className="space-y-4">
                {/* Información de la propiedad */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-gray-900">Información de la Propiedad</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Código:</span>
                      <span className="ml-2">{deniedPropertyModal.properties?.property_code || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Título:</span>
                      <span className="ml-2">{deniedPropertyModal.properties?.title}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Dirección:</span>
                      <span className="ml-2">{deniedPropertyModal.properties?.address}</span>
                    </div>
                    <div>
                      <span className="font-medium">Precio Comercial:</span>
                      <span className="ml-2 font-semibold text-primary">
                        {deniedPropertyModal.properties?.price_currency === 'USD' ? 'US$' : deniedPropertyModal.properties?.price_currency} {deniedPropertyModal.properties?.price?.toLocaleString()}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Cliente:</span>
                      <span className="ml-2">{deniedPropertyModal.client_name}</span>
                    </div>
                  </div>
                </div>

                {/* Razón de la negación */}
                <div className="space-y-2">
                  <Label htmlFor="denial-reason">Motivo de la Negación *</Label>
                  <Textarea
                    id="denial-reason"
                    placeholder="Describe por qué el cliente no está interesado en la propiedad..."
                    value={denialReason}
                    onChange={(e) => setDenialReason(e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Esta información te ayudará a entender mejor las preferencias de los clientes.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeniedPropertyModal(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={confirmPropertyDenial}
                className="bg-red-500 hover:bg-red-600"
                disabled={!denialReason.trim()}
              >
                Confirmar Negación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Archivar Visita */}
        <Dialog open={!!archivingVisit} onOpenChange={() => setArchivingVisit(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-blue-600">Archivar Visita</DialogTitle>
              <DialogDescription>
                Registra el motivo por el cual deseas archivar esta visita
              </DialogDescription>
            </DialogHeader>
            {archivingVisit && (
              <div className="space-y-4">
                {/* Información de la propiedad */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-gray-900">Información de la Visita</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Código:</span>
                      <span className="ml-2">{archivingVisit.properties?.property_code || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Título:</span>
                      <span className="ml-2">{archivingVisit.properties?.title}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Dirección:</span>
                      <span className="ml-2">{archivingVisit.properties?.address}</span>
                    </div>
                    <div>
                      <span className="font-medium">Cliente:</span>
                      <span className="ml-2">{archivingVisit.client_name}</span>
                    </div>
                    <div>
                      <span className="font-medium">Estado:</span>
                      <span className="ml-2 capitalize">{archivingVisit.status}</span>
                    </div>
                  </div>
                </div>

                {/* Razón del archivo */}
                <div className="space-y-2">
                  <Label htmlFor="archive-reason">Motivo del Archivo *</Label>
                  <Textarea
                    id="archive-reason"
                    placeholder="Describe el motivo por el cual archivas esta visita..."
                    value={archiveReason}
                    onChange={(e) => setArchiveReason(e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Esta información quedará registrada para futuras referencias.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setArchivingVisit(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={confirmArchiveVisit}
                className="bg-blue-500 hover:bg-blue-600"
                disabled={!archiveReason.trim()}
              >
                Archivar Visita
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}