import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import NotificationResponseModal from "@/components/NotificationResponseModal";
import { AgentSearchSelector } from "@/components/AgentSearchSelector";
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
  X,
  Download,
  FileX,
  ArrowRightLeft,
  Clock,
  Bell,
  Phone,
  Mail
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
  const [franchiseApplicationFilter, setFranchiseApplicationFilter] = useState<string>('all');
  const [selectedFranchiseApplication, setSelectedFranchiseApplication] = useState<any>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>("");
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string>("");
  const [downloadStatus, setDownloadStatus] = useState<string>("");
  const [listingLeads, setListingLeads] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<{type: string; status: 'all' | 'active' | 'concluded'} | null>(null);
  const [selectedAgentForView, setSelectedAgentForView] = useState<any>(null);
  const [isAgentViewModalOpen, setIsAgentViewModalOpen] = useState(false);
  const [agentProperties, setAgentProperties] = useState<any[]>([]);
  const [agentAssignments, setAgentAssignments] = useState<any[]>([]);
  const [agentVisits, setAgentVisits] = useState<any[]>([]);
  const [agentNotifications, setAgentNotifications] = useState<any[]>([]);
  const [selectedAgentForNotifications, setSelectedAgentForNotifications] = useState<any>(null);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [visitFilter, setVisitFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'rescheduled' | 'effective' | 'denied'>('confirmed');
  
  // Contact message response and assignment states
  const [selectedContactMessage, setSelectedContactMessage] = useState<any>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [selectedAgentForAssignment, setSelectedAgentForAssignment] = useState("");
  const [messageFilter, setMessageFilter] = useState<"all" | "pending" | "assigned">("all");
  const [assignedMessageIds, setAssignedMessageIds] = useState<string[]>([]);

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
      await fetchAvailableAgents();
    } catch (error) {
      console.error('Error checking permissions:', error);
      toast.error('Error verificando permisos');
      setLoading(false);
    }
  };

  const fetchAvailableAgents = async () => {
    try {
      const { data: agents, error } = await supabase
        .from('profiles')
        .select('id, full_name, agent_code, email')
        .not('agent_code', 'is', null)
        .order('full_name');

      if (error) throw error;
      setAvailableAgents(agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
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
        const messages = (messagesResult.value as any)?.data || [];
        setContactMessages(messages);
        
        // Inmediatamente verificar qué mensajes están asignados
        if (messages.length > 0) {
          try {
            const { data: agentLeads } = await supabase
              .from('agent_leads')
              .select('client_email, client_phone, client_name')
              .limit(1000);
            
            console.log('Contact messages:', messages.map(m => ({ id: m.id, email: m.email, name: m.name })));
            console.log('Agent leads found:', agentLeads);
            
            if (agentLeads) {
              // Usar combinación de email Y nombre para identificar asignaciones
              const assignedIds = messages
                .filter((msg: any) => {
                  const emailMatch = agentLeads.some((lead: any) => 
                    lead.client_email && msg.email && 
                    lead.client_email.toLowerCase() === msg.email.toLowerCase()
                  );
                  const nameMatch = agentLeads.some((lead: any) => 
                    lead.client_name && msg.name && 
                    lead.client_name.toLowerCase() === msg.name.toLowerCase()
                  );
                  const match = emailMatch && nameMatch;
                  if (match) {
                    console.log(`Message ${msg.id} (${msg.name}/${msg.email}) is assigned`);
                  }
                  return match;
                })
                .map((msg: any) => msg.id);
              
              console.log('Assigned message IDs:', assignedIds);
              setAssignedMessageIds(assignedIds);
            } else {
              console.log('No agent leads found');
              setAssignedMessageIds([]);
            }
          } catch (error) {
            console.error('Error fetching assigned message IDs:', error);
            setAssignedMessageIds([]);
          }
        } else {
          setAssignedMessageIds([]);
        }
      } else {
        console.error('Messages fetch failed:', messagesResult.reason);
        setContactMessages([]);
        setAssignedMessageIds([]);
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

  const updateFranchiseApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('franchise_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;
      
      await fetchAllData();
      setSelectedFranchiseApplication(null);
    } catch (error: any) {
      throw error;
    }
  };

  const getFilteredFranchiseApplications = () => {
    if (franchiseApplicationFilter === 'all') return franchiseApplications.filter(app => app.status === 'pending');
    return franchiseApplications.filter(app => app.status === franchiseApplicationFilter);
  };

  const getApplicationCountByStatus = (status: string) => {
    if (status === 'all') return franchiseApplications.filter(app => app.status === 'pending').length;
    return franchiseApplications.filter(app => app.status === status).length;
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

  const viewAgentDetails = async (agent: any) => {
    try {
      // Reset previous data to avoid showing stale information
      setAgentProperties([]);
      setAgentAssignments([]);
      setAgentVisits([]);
      setAgentNotifications([]);
      setSelectedAgentForView(null);
      
      if (!agent || !agent.id) {
        toast.error('Información del agente no válida');
        return;
      }

      // Set the selected agent
      setSelectedAgentForView(agent);
      
      // Show loading state
      setIsAgentViewModalOpen(true);
      
      console.log('Cargando detalles para agente:', agent.full_name || agent.email);
      
      // Fetch agent's properties with comprehensive data
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          *,
          agent_id,
          title,
          address,
          property_type,
          transaction_type,
          price,
          price_currency,
          status,
          created_at,
          concluded_status
        `)
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });
      
      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        throw propertiesError;
      }

      console.log(`Encontradas ${properties?.length || 0} propiedades para el agente`);
      setAgentProperties(properties || []);
      
      // Fetch agent's property assignments - simplified query to avoid relationship errors
      const { data: assignments, error: assignmentsError } = await supabase
        .from('property_assignments')
        .select('*')
        .or(`from_agent_id.eq.${agent.id},to_agent_id.eq.${agent.id}`)
        .order('created_at', { ascending: false });

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }

      // If we have assignments, fetch the related data separately
      let enrichedAssignments: any[] = [];
      if (assignments && assignments.length > 0) {
        for (const assignment of assignments) {
          // Get property details
          const { data: propertyData } = await supabase
            .from('properties')
            .select('title, address, property_type')
            .eq('id', assignment.property_id)
            .single();

          // Get from_agent details
          const { data: fromAgentData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', assignment.from_agent_id)
            .single();

          // Get to_agent details  
          const { data: toAgentData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', assignment.to_agent_id)
            .single();

          enrichedAssignments.push({
            ...assignment,
            properties: propertyData,
            from_agent: fromAgentData,
            to_agent: toAgentData
          });
        }
      }
      
      console.log(`Encontradas ${enrichedAssignments?.length || 0} asignaciones para el agente`);
      setAgentAssignments(enrichedAssignments || []);
      
      // Fetch agent's property visits (citas programadas)
      const { data: visits, error: visitsError } = await supabase
        .from('property_visits')
        .select('*')
        .eq('agent_id', agent.id)
        .order('scheduled_at', { ascending: false });

      if (visitsError) {
        console.error('Error fetching visits:', visitsError);
        // Don't throw error, just log it and continue
        setAgentVisits([]);
      } else {
        // Fetch property details for each visit
        const enrichedVisits = [];
        if (visits && visits.length > 0) {
          for (const visit of visits) {
            const { data: propertyData } = await supabase
              .from('properties')
              .select('title, address, property_type')
              .eq('id', visit.property_id)
              .single();
            
            enrichedVisits.push({
              ...visit,
              properties: propertyData
            });
          }
        }
        console.log(`Encontradas ${enrichedVisits?.length || 0} citas programadas para el agente`);
        setAgentVisits(enrichedVisits || []);
      }

      // Fetch agent's notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('agent_notifications')
        .select('*')
        .eq('to_agent_id', agent.id)
        .order('created_at', { ascending: false });

      if (notificationsError) {
        console.error('Error fetching notifications:', notificationsError);
        // Don't throw error, just log it and continue
        setAgentNotifications([]);
      } else {
        // Fetch related data for each notification
        const enrichedNotifications = [];
        if (notificationsData && notificationsData.length > 0) {
          for (const notification of notificationsData) {
            // Get property details
            const { data: propertyData } = await supabase
              .from('properties')
              .select('title, address')
              .eq('id', notification.property_id)
              .single();

            // Get from_agent details
            const { data: fromAgentData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', notification.from_agent_id)
              .single();

            enrichedNotifications.push({
              ...notification,
              properties: propertyData,
              from_agent: fromAgentData
            });
          }
        }
        console.log(`Encontradas ${enrichedNotifications?.length || 0} notificaciones para el agente`);
        setAgentNotifications(enrichedNotifications || []);
      }
      
      toast.success(`Detalles cargados: ${properties?.length || 0} propiedades, ${enrichedAssignments?.length || 0} asignaciones, ${visits?.length || 0} citas, ${notificationsData?.length || 0} notificaciones`);
      
    } catch (error: any) {
      console.error('Error completo:', error);
      setAgentProperties([]);
      setAgentAssignments([]);
      setAgentVisits([]);
      setAgentNotifications([]);
      setSelectedAgentForView(null);
      setIsAgentViewModalOpen(false);
      toast.error('Error cargando detalles del agente: ' + (error.message || 'Error desconocido'));
    }
  };

  const viewAgentNotificationsAndVisits = async (agent: any) => {
    try {
      // Reset previous data
      setAgentVisits([]);
      setAgentNotifications([]);
      setSelectedAgentForNotifications(null);
      
      if (!agent || !agent.id) {
        console.error('Agente inválido:', agent);
        toast.error('Información del agente no válida');
        return;
      }

      console.log('=== DEBUG: Cargando datos para agente ===');
      console.log('Agent ID:', agent.id);
      console.log('Agent Name:', agent.full_name || agent.email);
      console.log('Agent Object:', agent);

      // Set the selected agent
      setSelectedAgentForNotifications(agent);
      
      // Show loading state
      setIsNotificationsModalOpen(true);
      
      // Fetch agent's property visits (citas programadas) with debug
      console.log('Consultando property_visits con agent_id:', agent.id);
      const { data: visits, error: visitsError } = await supabase
        .from('property_visits')
        .select('*')
        .eq('agent_id', agent.id)
        .order('scheduled_at', { ascending: false });

      console.log('Visits query result:', { visits, error: visitsError });

      if (visitsError) {
        console.error('Error fetching visits:', visitsError);
        setAgentVisits([]);
      } else {
        console.log(`Encontradas ${visits?.length || 0} citas RAW para el agente`);
        
        // Fetch property details for each visit
        const enrichedVisits = [];
        if (visits && visits.length > 0) {
          for (const visit of visits) {
            console.log('Processing visit:', visit);
            const { data: propertyData, error: propError } = await supabase
              .from('properties')
              .select('title, address, property_type')
              .eq('id', visit.property_id)
              .single();
            
            if (propError) {
              console.warn('Error fetching property for visit:', propError);
            }
            
            enrichedVisits.push({
              ...visit,
              properties: propertyData || { title: 'Propiedad no encontrada', address: 'N/A' }
            });
          }
        }
        console.log(`Citas enriquecidas: ${enrichedVisits?.length || 0}`);
        console.log('Enriched visits:', enrichedVisits);
        setAgentVisits(enrichedVisits || []);
      }

      // Fetch agent's notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('agent_notifications')
        .select('*')
        .eq('to_agent_id', agent.id)
        .order('created_at', { ascending: false });

      if (notificationsError) {
        console.error('Error fetching notifications:', notificationsError);
        setAgentNotifications([]);
      } else {
        // Fetch related data for each notification
        const enrichedNotifications = [];
        if (notificationsData && notificationsData.length > 0) {
          for (const notification of notificationsData) {
            // Get property details
            const { data: propertyData } = await supabase
              .from('properties')
              .select('title, address')
              .eq('id', notification.property_id)
              .single();

            // Get from_agent details
            const { data: fromAgentData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', notification.from_agent_id)
              .single();

            enrichedNotifications.push({
              ...notification,
              properties: propertyData,
              from_agent: fromAgentData
            });
          }
        }
        console.log(`Encontradas ${enrichedNotifications?.length || 0} notificaciones para el agente`);
        setAgentNotifications(enrichedNotifications || []);
      }
      
      toast.success(`Cargadas ${visits?.length || 0} citas y ${notificationsData?.length || 0} notificaciones`);
      
    } catch (error: any) {
      console.error('Error cargando notificaciones y citas:', error);
      setAgentVisits([]);
      setAgentNotifications([]);
      setSelectedAgentForNotifications(null);
      setIsNotificationsModalOpen(false);
      toast.error('Error cargando notificaciones y citas: ' + (error.message || 'Error desconocido'));
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
    
    // Check if user has agent_code - that makes them an agent
    if (user?.agent_code) return 'agent';
    
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

  // Normalización y conteos de visitas para filtros
  const normalize = (s?: string) => (s || '').toString().trim().toLowerCase();
  const visitCounts = {
    pending: agentVisits.filter(v => ['pending','pendiente'].includes(normalize(v.status))).length,
    confirmed: agentVisits.filter(v => ['confirmed','confirmado','confirmada'].includes(normalize(v.status))).length,
    cancelled: agentVisits.filter(v => ['cancelled','canceled','cancelado','cancelada'].includes(normalize(v.status))).length,
    rescheduled: agentVisits.filter(v => ['rescheduled','reprogramado','reprogramada'].includes(normalize(v.status))).length,
    effective: agentVisits.filter(v => ['effective','efectiva','propiedad efectiva'].includes(normalize(v.outcome)) || ['effective','efectiva','propiedad efectiva'].includes(normalize(v.visit_result))).length,
    denied: agentVisits.filter(v => ['denied','negada','propiedad negada'].includes(normalize(v.outcome)) || ['denied','negada','propiedad negada'].includes(normalize(v.visit_result))).length,
  };
  const filteredVisits = agentVisits.filter(v => {
    const st = normalize(v.status);
    const out = normalize(v.outcome) || normalize(v.visit_result);
    switch (visitFilter) {
      case 'pending': return ['pending','pendiente'].includes(st);
      case 'confirmed': return ['confirmed','confirmado','confirmada'].includes(st);
      case 'cancelled': return ['cancelled','canceled','cancelado','cancelada'].includes(st);
      case 'rescheduled': return ['rescheduled','reprogramado','reprogramada'].includes(st);
      case 'effective': return ['effective','efectiva','propiedad efectiva'].includes(out);
      case 'denied': return ['denied','negada','propiedad negada'].includes(out);
      default: return true;
    }
  });

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
            <TabsList className={`grid w-full h-14 bg-muted/50 ${isSuperAdmin ? 'grid-cols-10' : 'grid-cols-9'}`}>
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
              <TabsTrigger value="agentes" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Agentes / Staff
              </TabsTrigger>
              <TabsTrigger value="franquicias" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Franquicias
              </TabsTrigger>
              <TabsTrigger value="mensajes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Mensajes
                {(() => {
                  const pendingCount = contactMessages.filter(msg => !assignedMessageIds.includes(msg.id)).length;
                  return pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 text-xs">
                      {pendingCount}
                    </Badge>
                  );
                })()}
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

            {/* Agentes / Staff Management Tab */}
            <TabsContent value="agentes" className="space-y-6 mt-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Gestión de Agentes y Staff
                  </CardTitle>
                  <CardDescription>
                    Administra los agentes inmobiliarios y personal de DOMINIO
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Filter Controls */}
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Buscar agentes..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="max-w-sm"
                        />
                      </div>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filtrar por rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="agent">Agentes</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Agent Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-600">Total Agentes</p>
                              <p className="text-2xl font-bold text-blue-700">{userStats.agents}</p>
                            </div>
                            <UserCheck className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-600">Super Admins</p>
                              <p className="text-2xl font-bold text-green-700">{userStats.superAdmins}</p>
                            </div>
                            <Crown className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-yellow-600">Total Staff</p>
                              <p className="text-2xl font-bold text-yellow-700">{userStats.agents + userStats.superAdmins}</p>
                            </div>
                            <Users className="h-8 w-8 text-yellow-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Agents List */}
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Agente</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Propiedades</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users
                            .filter(user => {
                              const userRole = getUserRole(user.id);
                              return userRole === 'agent' || user.is_super_admin;
                            })
                             .filter(user => {
                               if (searchTerm) {
                                 return user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
                               }
                               return true;
                             })
                            .filter(user => {
                              if (selectedStatus === 'all') return true;
                              if (selectedStatus === 'agent') return !user.is_super_admin;
                              if (selectedStatus === 'super_admin') return user.is_super_admin;
                              return true;
                            })
                            .map((user) => {
                              const userRole = getUserRole(user.id);
                              const userProperties = properties.filter(p => p.agent_id === user.id);
                              
                              return (
                                <TableRow key={user.id}>
                                  <TableCell>
                                     <div className="flex items-center space-x-2">
                                       <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                         {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                                       </div>
                                       <span className="font-medium">{user.full_name || 'Sin nombre'}</span>
                                     </div>
                                  </TableCell>
                                  <TableCell>{user.email}</TableCell>
                                  <TableCell>
                                    <Badge variant={user.is_super_admin ? 'default' : 'secondary'}>
                                      {user.is_super_admin ? 'Super Admin' : 'Agente'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {userProperties.length} propiedades
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      Activo
                                    </Badge>
                                  </TableCell>
                                   <TableCell>
                                     <div className="flex items-center space-x-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => viewAgentDetails(user)}
                                        >
                                          <Home className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => viewAgentNotificationsAndVisits(user)}
                                          title="Ver notificaciones y citas"
                                        >
                                          <Mail className="h-4 w-4" />
                                        </Button>
                                       {isSuperAdmin && (
                                         <Button
                                           variant="outline"
                                           size="sm"
                                           onClick={() => toggleSuperAdmin(user.id, !user.is_super_admin)}
                                         >
                                           {user.is_super_admin ? (
                                             <UserX className="h-4 w-4" />
                                           ) : (
                                             <Crown className="h-4 w-4" />
                                           )}
                                         </Button>
                                       )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>

                    {users.filter(user => getUserRole(user.id) === 'agent' || user.is_super_admin).length === 0 && (
                      <div className="text-center py-12">
                        <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No hay agentes registrados</h3>
                        <p className="text-muted-foreground">Los agentes aparecerán aquí cuando se registren en el sistema.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

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
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="text-lg font-semibold flex items-center gap-2">
                         <FileText className="h-5 w-5" />
                         Solicitudes de Franquicia ({getApplicationCountByStatus('all')})
                       </h3>
                      <div className="flex gap-2">
                        <Button
                          variant={franchiseApplicationFilter === 'all' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFranchiseApplicationFilter('all')}
                          className={`border border-red-300 ${
                            franchiseApplicationFilter === 'all' 
                              ? 'bg-red-500 text-white hover:bg-red-600' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          Solicitudes ({getApplicationCountByStatus('all')})
                        </Button>
                        <Button
                          variant={franchiseApplicationFilter === 'approved' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFranchiseApplicationFilter('approved')}
                          className={`border border-red-300 ${
                            franchiseApplicationFilter === 'approved' 
                              ? 'bg-red-500 text-white hover:bg-red-600' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          Aprobados ({getApplicationCountByStatus('approved')})
                        </Button>
                        <Button
                          variant={franchiseApplicationFilter === 'rejected' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFranchiseApplicationFilter('rejected')}
                          className={`border border-red-300 ${
                            franchiseApplicationFilter === 'rejected' 
                              ? 'bg-red-500 text-white hover:bg-red-600' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          Rechazados ({getApplicationCountByStatus('rejected')})
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getFilteredFranchiseApplications().map((application) => (
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
                  
                  {/* Filter Buttons */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant={messageFilter === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMessageFilter("pending")}
                      className={messageFilter === "pending" 
                        ? "bg-red-500 hover:bg-red-600 text-white border-red-500" 
                        : "border-red-500 text-red-500 hover:bg-red-50"}
                    >
                      Pendientes ({contactMessages.filter(msg => !assignedMessageIds.includes(msg.id)).length})
                    </Button>
                    <Button
                      variant={messageFilter === "assigned" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMessageFilter("assigned")}
                      className={messageFilter === "assigned" 
                        ? "bg-green-500 hover:bg-green-600 text-white border-green-500" 
                        : "border-green-500 text-green-500 hover:bg-green-50"}
                    >
                      Asignada ({assignedMessageIds.length})
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const getFilteredMessages = () => {
                        if (messageFilter === "pending") {
                          return contactMessages.filter(msg => !assignedMessageIds.includes(msg.id));
                        } else if (messageFilter === "assigned") {
                          return contactMessages.filter(msg => assignedMessageIds.includes(msg.id));
                        }
                        return contactMessages;
                      };
                      
                      const filteredMessages = getFilteredMessages();
                      
                      return filteredMessages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">
                            {messageFilter === "pending" && "No hay mensajes pendientes"}
                            {messageFilter === "assigned" && "No hay mensajes asignados"}
                            {messageFilter === "all" && "No hay mensajes"}
                          </h3>
                          <p>
                            {messageFilter === "pending" && "Todos los mensajes han sido asignados."}
                            {messageFilter === "assigned" && "No hay mensajes asignados a agentes aún."}
                            {messageFilter === "all" && "Los mensajes de contacto aparecerán aquí cuando los usuarios se comuniquen."}
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {filteredMessages.map((message) => (
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
                                  <div className="flex items-center gap-2">
                                    {assignedMessageIds.includes(message.id) && (
                                      <Badge className="bg-green-100 text-green-700 border-green-200">
                                        Asignado
                                      </Badge>
                                    )}
                                    <Badge variant="outline">
                                      {new Date(message.created_at).toLocaleDateString('es-ES')}
                                    </Badge>
                                  </div>
                                </div>
                                 <div className="bg-muted/50 p-3 rounded-lg mb-4">
                                   <p className="text-sm">{message.message}</p>
                                 </div>
                                 
                                 {/* Action Buttons */}
                                 <div className="flex gap-2 pt-2 border-t">
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => {
                                       setSelectedContactMessage(message);
                                       setShowResponseModal(true);
                                     }}
                                     className="flex items-center gap-2"
                                   >
                                     <Mail className="h-4 w-4" />
                                     Responder al Cliente
                                   </Button>
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => {
                                       setSelectedContactMessage(message);
                                       setShowAssignmentModal(true);
                                     }}
                                     className="flex items-center gap-2"
                                   >
                                     <UserCheck className="h-4 w-4" />
                                     Asignar a Agente
                                   </Button>
                                 </div>
                               </CardContent>
                             </Card>
                          ))}
                        </div>
                      );
                    })()}
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
                               setPdfLoading(true);
                               setPdfError("");
                               setCurrentPdfUrl(selectedFranchiseApplication.cv_url);
                               setShowPdfModal(true);
                               // Simular carga para feedback
                               setTimeout(() => setPdfLoading(false), 1000);
                             }}
                             className="w-full"
                           >
                             <Eye className="h-4 w-4 mr-2" />
                             Ver PDF
                           </Button>
                           <Button 
                             size="sm" 
                             variant="outline" 
                             onClick={async () => {
                               setDownloadStatus("Descargando...");
                               try {
                                 const response = await fetch(selectedFranchiseApplication.cv_url);
                                 const blob = await response.blob();
                                 const url = window.URL.createObjectURL(blob);
                                 const link = document.createElement('a');
                                 link.href = url;
                                 link.download = `CV_${selectedFranchiseApplication.full_name.replace(/\s+/g, '_')}.pdf`;
                                 document.body.appendChild(link);
                                 link.click();
                                 document.body.removeChild(link);
                                 window.URL.revokeObjectURL(url);
                                 setDownloadStatus("Descarga completada");
                                 setTimeout(() => setDownloadStatus(""), 3000);
                               } catch (error) {
                                 setDownloadStatus("Error en la descarga");
                                 setTimeout(() => setDownloadStatus(""), 3000);
                               }
                             }}
                             className="w-full"
                             disabled={downloadStatus === "Descargando..."}
                           >
                             <FileText className="h-4 w-4 mr-2" />
                             {downloadStatus || "Descargar PDF"}
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
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      try {
                        await updateFranchiseApplicationStatus(selectedFranchiseApplication.id, 'approved');
                        toast.success("Solicitud aprobada exitosamente");
                      } catch (error) {
                        toast.error("Error al aprobar la solicitud");
                      }
                    }}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprobar
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={async () => {
                      try {
                        await updateFranchiseApplicationStatus(selectedFranchiseApplication.id, 'rejected');
                        toast.success("Solicitud rechazada");
                      } catch (error) {
                        toast.error("Error al rechazar la solicitud");
                      }
                    }}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                </div>
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
            <div className="flex items-center gap-2">
              {downloadStatus && (
                <Badge variant="secondary" className="text-xs">
                  {downloadStatus}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (currentPdfUrl) {
                    setDownloadStatus("Descargando...");
                    try {
                      const response = await fetch(currentPdfUrl);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'curriculum_vitae.pdf';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                      setDownloadStatus("Descarga completada");
                      setTimeout(() => setDownloadStatus(""), 3000);
                    } catch (error) {
                      setDownloadStatus("Error en la descarga");
                      setTimeout(() => setDownloadStatus(""), 3000);
                    }
                  }
                }}
                disabled={downloadStatus === "Descargando..."}
              >
                <Download className="h-4 w-4 mr-1" />
                Descargar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowPdfModal(false);
                  setPdfLoading(false);
                  setPdfError("");
                  setDownloadStatus("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-[70vh] relative bg-muted/30 rounded-lg overflow-hidden">
            {pdfLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Cargando PDF...</p>
                </div>
              </div>
            )}
            {pdfError && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center">
                  <FileX className="h-12 w-12 mx-auto mb-2 text-destructive" />
                  <p className="text-sm text-destructive mb-2">{pdfError}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setPdfError("");
                      setPdfLoading(true);
                      setTimeout(() => setPdfLoading(false), 1000);
                    }}
                  >
                    Reintentar
                  </Button>
                </div>
              </div>
            )}
            <div className="w-full h-full">
              <iframe
                src={`${currentPdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
                className="w-full h-full border-0 rounded-lg"
                title="PDF Viewer"
                onLoad={() => {
                  setPdfLoading(false);
                  setPdfError("");
                }}
                onError={() => {
                  setPdfLoading(false);
                  setPdfError("No se pudo cargar el PDF. Intente descargarlo.");
                }}
              />
              {!pdfLoading && !pdfError && (
                <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-2 border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Visualizador de PDF</span>
                    <div className="flex items-center gap-2">
                      <span>Zoom con Ctrl + rueda del mouse</span>
                      <span>•</span>
                      <span>Click derecho para opciones</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent Details Modal */}
      <Dialog open={isAgentViewModalOpen} onOpenChange={setIsAgentViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Detalles del Agente: {selectedAgentForView?.full_name || selectedAgentForView?.email}
            </DialogTitle>
            <div className="text-sm text-muted-foreground">
              Información detallada de propiedades y asignaciones del agente
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Agent Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información del Agente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{selectedAgentForView?.full_name || 'Sin nombre'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedAgentForView?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Código de Agente</p>
                    <p className="font-medium">{selectedAgentForView?.agent_code || 'No asignado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rol</p>
                    <Badge variant={selectedAgentForView?.is_super_admin ? 'default' : 'secondary'}>
                      {selectedAgentForView?.is_super_admin ? 'Super Admin' : 'Agente'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Properties Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Mis Propiedades ({agentProperties.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agentProperties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tiene propiedades registradas</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {agentProperties.slice(0, 5).map((property) => (
                      <div key={property.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{property.title}</h4>
                            <p className="text-sm text-muted-foreground">{property.address}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline">{property.property_type}</Badge>
                              <Badge variant="outline">{property.transaction_type}</Badge>
                              <span className="text-sm font-medium">
                                ${property.price?.toLocaleString()} {property.price_currency}
                              </span>
                            </div>
                          </div>
                          <Badge variant={property.status === 'approved' ? 'default' : 'secondary'}>
                            {property.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {agentProperties.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Y {agentProperties.length - 5} propiedades más...
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Asignación Propiedad ({agentAssignments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agentAssignments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tiene asignaciones de propiedades</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agentAssignments.slice(0, 5).map((assignment) => (
                      <div key={assignment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{assignment.properties?.title || 'Propiedad'}</h4>
                            <p className="text-sm text-muted-foreground">{assignment.properties?.address}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm">
                                De: <Badge variant="outline">{assignment.from_agent?.full_name}</Badge>
                              </span>
                              <ArrowRightLeft className="h-4 w-4" />
                              <span className="text-sm">
                                Para: <Badge variant="outline">{assignment.to_agent?.full_name}</Badge>
                              </span>
                            </div>
                            {assignment.reason && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Razón: {assignment.reason}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(assignment.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    {agentAssignments.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Y {agentAssignments.length - 5} asignaciones más...
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent Notifications and Visits Modal */}
      <Dialog open={isNotificationsModalOpen} onOpenChange={setIsNotificationsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Bell className="h-6 w-6" />
                  Notificaciones y Citas: {selectedAgentForNotifications?.full_name || selectedAgentForNotifications?.email}
                </DialogTitle>
                <DialogDescription>
                  Citas programadas y notificaciones del agente
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Citas Programadas Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <CardTitle>
                      Citas Programadas ({filteredVisits.length})
                    </CardTitle>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Gestiona y confirma tus próximas citas
                  </div>
                </div>
                
                {/* Filtros de Estado */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant={visitFilter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisitFilter('pending')}
                  >
                    Pendientes ({visitCounts.pending})
                  </Button>
                  <Button
                    variant={visitFilter === 'confirmed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisitFilter('confirmed')}
                  >
                    Confirmadas ({visitCounts.confirmed})
                  </Button>
                  <Button
                    variant={visitFilter === 'cancelled' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisitFilter('cancelled')}
                  >
                    Canceladas ({visitCounts.cancelled})
                  </Button>
                  <Button
                    variant={visitFilter === 'rescheduled' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisitFilter('rescheduled')}
                  >
                    Reprogramadas ({visitCounts.rescheduled})
                  </Button>
                  <Button
                    variant={visitFilter === 'effective' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisitFilter('effective')}
                  >
                    Propiedad Efectiva ({visitCounts.effective})
                  </Button>
                  <Button
                    variant={visitFilter === 'denied' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisitFilter('denied')}
                  >
                    Propiedad Negada ({visitCounts.denied})
                  </Button>
                  <Button
                    variant={visitFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisitFilter('all')}
                  >
                    Todas ({agentVisits.length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredVisits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tiene citas programadas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredVisits.map((visit) => (
                      <div key={visit.id} className="border rounded-lg p-4 bg-background">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-primary">{visit.properties?.title || 'casa lujosa'}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{visit.properties?.address || 'Calle 23 De Enero, sarcobamba, Cercado, Cochabamba'}</p>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-orange-600">Cita programada:</span>
                                <span className="text-sm font-medium text-orange-600">
                                  {new Date(visit.scheduled_at).toLocaleDateString('es-ES', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })}, {new Date(visit.scheduled_at).toLocaleTimeString('es-ES', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Acción realizada:</span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date().toLocaleDateString('es-ES', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })}, {new Date().toLocaleTimeString('es-ES', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>

                              {visit.client_name && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">Cliente:</span>
                                  <span className="text-sm font-medium">{visit.client_name}</span>
                                </div>
                              )}

                              {visit.client_email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{visit.client_email}</span>
                                </div>
                              )}

                              {visit.client_phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{visit.client_phone}</span>
                                </div>
                              )}

                              {visit.message && (
                                <div className="mt-2 p-2 bg-muted/30 rounded text-sm">
                                  <span className="font-medium">Mensaje: </span>
                                  {visit.message}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                                Reprogramar
                              </Button>
                              <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                                Cancelar
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                                Propiedad Efectiva
                              </Button>
                              <Button variant="outline" size="sm" className="bg-red-500 hover:bg-red-600 text-white border-red-500">
                                Propiedad Negada
                              </Button>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Confirmed
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notificaciones Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    <CardTitle>Notificaciones ({agentNotifications.length})</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {agentNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tiene notificaciones</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agentNotifications.map((notification) => (
                      <div key={notification.id} className="border rounded-lg p-4 bg-background">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <Bell className={`h-4 w-4 ${notification.read ? 'text-muted-foreground' : 'text-primary'}`} />
                              <Badge variant={notification.read ? 'secondary' : 'default'}>
                                {notification.read ? 'Leída' : 'Nueva'}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-semibold">{notification.properties?.title || 'Propiedad'}</h4>
                              <p className="text-sm text-muted-foreground">{notification.properties?.address}</p>
                              
                              <div className="bg-muted/30 p-3 rounded-lg">
                                <p className="text-sm">{notification.message}</p>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                  De: <Badge variant="outline">{notification.from_agent?.full_name || notification.from_agent?.email}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(notification.created_at).toLocaleDateString('es-ES', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-4">
                            <Button 
                              size="sm" 
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              Responder
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Contact Message Response Modal */}
      {selectedContactMessage && showResponseModal && (
        <NotificationResponseModal
          isOpen={showResponseModal}
          onClose={() => {
            setShowResponseModal(false);
            setSelectedContactMessage(null);
          }}
          notification={{
            id: selectedContactMessage.id,
            message: selectedContactMessage.message,
            created_at: selectedContactMessage.created_at
          }}
          clientEmail={selectedContactMessage.email}
          clientName={selectedContactMessage.name}
          clientPhone={selectedContactMessage.phone || selectedContactMessage.whatsapp}
        />
      )}
      
      {/* Agent Assignment Modal */}
      <Dialog open={showAssignmentModal} onOpenChange={setShowAssignmentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar a Agente</DialogTitle>
            <DialogDescription>
              Asigna este mensaje de contacto a un agente específico
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedContactMessage && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{selectedContactMessage.name}</p>
                <p className="text-xs text-muted-foreground">{selectedContactMessage.email}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">Seleccionar Agente</label>
              <AgentSearchSelector
                agents={availableAgents.filter(agent => agent.agent_code && agent.agent_code.trim() !== '')}
                value={selectedAgentForAssignment}
                onValueChange={setSelectedAgentForAssignment}
                placeholder="Buscar agente..."
                defaultOption={{
                  value: "",
                  label: "Seleccionar agente"
                }}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignmentModal(false);
                  setSelectedContactMessage(null);
                  setSelectedAgentForAssignment("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedAgentForAssignment) {
                    toast.error("Selecciona un agente");
                    return;
                  }
                  
                  // Create agent lead from contact message
                  const selectedAgent = availableAgents.find(a => a.agent_code === selectedAgentForAssignment);
                  if (selectedAgent && selectedContactMessage) {
                    try {
                      console.log('Assigning message:', {
                        messageId: selectedContactMessage.id,
                        agentId: selectedAgent.id,
                        clientName: selectedContactMessage.name,
                        clientEmail: selectedContactMessage.email
                      });

                      const { error } = await supabase
                        .from('agent_leads')
                        .insert({
                          agent_id: selectedAgent.id,
                          client_name: selectedContactMessage.name,
                          client_email: selectedContactMessage.email,
                          client_phone: selectedContactMessage.phone || selectedContactMessage.whatsapp,
                          message: selectedContactMessage.message,
                          status: 'new'
                        });
                        
                      if (error) {
                        console.error('Assignment error:', error);
                        throw error;
                      }
                      
                      console.log('Assignment successful');
                      
                      // Inmediatamente marcar este mensaje como asignado en el estado
                      console.log('Adding message to assigned list:', selectedContactMessage.id);
                      const updatedAssignedIds = [...assignedMessageIds, selectedContactMessage.id];
                      setAssignedMessageIds(updatedAssignedIds);
                      
                      toast.success(`Mensaje asignado a ${selectedAgent.full_name}`);
                      
                      setShowAssignmentModal(false);
                      setSelectedContactMessage(null);
                      setSelectedAgentForAssignment("");
                      
                      // Esperar antes de refrescar para que la UI se actualice
                      setTimeout(() => {
                        fetchAllData();
                      }, 2000);
                    } catch (error: any) {
                      console.error('Full assignment error:', error);
                      toast.error("Error asignando mensaje: " + error.message);
                    }
                  }
                }}
              >
                Asignar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}