import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Edit, Archive, Filter, UserCheck, Shield, Building, Eye, Search, Phone, Mail, Crown, Building2, Home, DollarSign, HardHat } from "lucide-react";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious 
} from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useFormErrorHandler, useApiErrorHandler } from "@/hooks/useErrorHandler";
import { RolePermissionsManager } from "@/components/admin/RolePermissionsManager";

type AppRole = Database["public"]["Enums"]["app_role"];

type UserFilter = 'all' | 'agents' | 'clients' | 'archived';

const userFormSchema = z.object({
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  identity_card: z.string().optional(),
  corporate_phone: z.string().optional(),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rol_id: z.string().uuid("Debes seleccionar un rol válido").min(1, "Debes seleccionar un rol"),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const AdminUserManagement = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    open: boolean;
    userId: string;
    currentRole: string;
    newRole: string;
    userName: string;
  }>({
    open: false,
    userId: '',
    currentRole: '',
    newRole: '',
    userName: ''
  });
  const [assignmentsDialog, setAssignmentsDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    userRole: string;
  }>({
    open: false,
    userId: '',
    userName: '',
    userRole: ''
  });
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [corporateAssignmentsDialog, setCorporateAssignmentsDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    userRole: string;
    userRoleName: string;
    userPermissions: Array<{ id: string; nombre: string; descripcion?: string }>;
  }>({
    open: false,
    userId: '',
    userName: '',
    userRole: '',
    userRoleName: '',
    userPermissions: []
  });
  const [archiveDialog, setArchiveDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  }>({
    open: false,
    userId: '',
    userName: ''
  });
  const [archiveReason, setArchiveReason] = useState('');
  const [assignmentDialog, setAssignmentDialog] = useState<{
    open: boolean;
    type: 'phone' | 'email' | null;
    userId: string;
    userName: string;
    currentValue: string;
  }>({
    open: false,
    type: null,
    userId: '',
    userName: '',
    currentValue: ''
  });
  const [assignmentValue, setAssignmentValue] = useState('');
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { handleError } = useFormErrorHandler('AdminUserManagement');
  const { handleAsyncError } = useApiErrorHandler('/auth/users');

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error getting user:', error);
        toast.error('Error obteniendo usuario');
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Fetch all users with their profiles
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      console.log('Fetching users with profiles...');
      
      // Get all profiles with complete data INCLUDING rol_id and role name
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          identity_card,
          corporate_phone,
          email,
          created_at,
          updated_at,
          avatar_url,
          bio,
          title,
          franchise_id,
          agent_code,
          is_super_admin,
          assigned_corporate_phone,
          assigned_corporate_email,
          assignment_date,
          is_archived,
          archive_reason,
          rol_id,
          roles:rol_id (
            id,
            nombre
          )
        `)
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles fetched:', profiles);

      // Map role nombres to role keys
      const roleNameToKey: Record<string, string> = {
        'SUPER ADMINISTRADOR': 'super_admin',
        'AGENTE': 'agent',
        'ARXIS': 'arxis_admin',
        'ADMINISTRACIÓN': 'office_manager',
        'SUPERVISIÓN': 'supervisor',
        'CONTABILIDAD': 'accounting',
        'CLIENTE': 'client',
      };

      // Transform to include role as a key
      const usersWithRoles = profiles.map((profile: any) => {
        const roleName = profile.roles?.nombre || 'CLIENTE';
        const roleKey = roleNameToKey[roleName] || 'client';
        
        console.log(`User ${profile.id}: rol_id=${profile.rol_id}, nombre=${roleName}, key=${roleKey}`);
        
        return {
          ...profile,
          role: roleKey,
          rol_nombre: roleName,
        };
      });

      console.log('Users with roles:', usersWithRoles);
      return usersWithRoles;
    },
    enabled: !!currentUser && !loading,
  });

  // Fetch roles from database
  const { data: rolesFromDB = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("id, nombre, descripcion")
        .order("nombre");
      
      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      full_name: "",
      identity_card: "",
      corporate_phone: "",
      email: "",
      password: "",
      rol_id: "",
    },
  });

  // Create new user mutation
  const createUserMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      console.log('Form values being submitted:', values);
      
      // Validate email format - more permissive validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(values.email)) {
        throw new Error('Por favor ingresa un email válido (ejemplo: usuario@dominio.com)');
      }
    
      // Clean empty string values to null for optional fields
      const cleanedValues = {
        ...values,
        identity_card: values.identity_card?.trim() || null,
        corporate_phone: values.corporate_phone?.trim() || null,
      };
      
      console.log('Creating user with values:', cleanedValues);
      
      // Create user account with all data in metadata for the trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanedValues.email,
        password: cleanedValues.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          data: {
            full_name: cleanedValues.full_name,
            identity_card: cleanedValues.identity_card,
            corporate_phone: cleanedValues.corporate_phone,
            rol_id: cleanedValues.rol_id,
          },
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        
        // Handle specific email errors
        if (authError.message?.includes('Email address') && authError.message?.includes('is invalid')) {
          throw new Error('El email ingresado tiene un formato incorrecto. Revisa si hay errores de escritura (ejemplo: gmail.com, not gamil.com)');
        } else if (authError.message?.includes('rate limit')) {
          throw new Error('Has hecho muchos intentos. Espera unos minutos antes de intentar de nuevo.');
        } else if (authError.message?.includes('User already registered')) {
          throw new Error('Ya existe un usuario registrado con este email.');
        }
        
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      console.log('User created successfully with trigger handling profile creation');
      return authData;
    },
    onSuccess: () => {
      toast.success('✅ Usuario creado correctamente');
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      // El sistema de errores ya manejó el logging detallado
      console.error('Error creating user:', error);
      
      // Handle specific email validation errors with helpful messages
      if (error.message?.includes('Email address') && error.message?.includes('is invalid')) {
        toast.error('Email inválido. Revisa si hay errores como "gamil.com" (debería ser "gmail.com"), "yahooo.com", etc.');
      } else if (error.message?.includes('User already registered')) {
        toast.error('Ya existe un usuario registrado con este email.');
      } else if (error.message?.includes('rate limit')) {
        toast.error('Has hecho muchos intentos. Espera unos minutos antes de intentar de nuevo.');
      } else {
        // Solo mostrar el toast si el error no fue manejado por el sistema de errores
        if (!error.errorId) {
          toast.error(error.message || t('unexpectedError') || 'Error inesperado al crear el usuario');
        }
      }
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      console.log('Updating role for user:', userId, 'to role:', newRole);
      
      // Map role keys to role nombres
      const roleKeyToName: Record<string, string> = {
        'super_admin': 'SUPER ADMINISTRADOR',
        'agent': 'AGENTE',
        'arxis_admin': 'ARXIS',
        'office_manager': 'ADMINISTRACIÓN',
        'supervisor': 'SUPERVISIÓN',
        'accounting': 'CONTABILIDAD',
        'client': 'CLIENTE',
      };

      const roleName = roleKeyToName[newRole];
      if (!roleName) {
        throw new Error(`Rol no reconocido: ${newRole}`);
      }

      // Get the role ID from the roles table
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("nombre", roleName)
        .single();

      if (roleError || !roleData) {
        console.error('Error getting role ID:', roleError);
        throw new Error(`No se encontró el rol: ${roleName}`);
      }

      console.log('Role ID found:', roleData.id, 'for role:', roleName);

      // Update the profile with the new rol_id
      const { data, error } = await supabase
        .from("profiles")
        .update({ rol_id: roleData.id })
        .eq("id", userId)
        .select();
      
      if (error) {
        console.error('Error updating profile role:', error);
        throw error;
      }
      
      console.log('Profile role updated successfully:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      console.log('Role mutation successful, invalidating queries...');
      toast.success(`Rol actualizado a ${getRoleLabel(variables.newRole)} exitosamente`);
      
      // Force refresh the data
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      queryClient.refetchQueries({ queryKey: ["admin-all-users"] });
      
      setRoleChangeDialog({ open: false, userId: '', currentRole: '', newRole: '', userName: '' });
    },
    onError: (error: any) => {
      console.error('Role update mutation error:', error);
      toast.error(`Error al actualizar rol: ${error.message}`);
    },
  });

  const roles: AppRole[] = [
    "super_admin",
    "agent", 
    "arxis_admin" as AppRole, // Administrador de ARXIS
    "office_manager",
    "supervisor",
    "accounting" as AppRole, // Temporary cast until types regenerate
    "client",
  ];

  // Filter logic
  const agentRoles = ["super_admin", "agent", "arxis_admin", "office_manager", "supervisor", "accounting"];
  const clientRoles = ["client"];

  const filteredUsers = users.filter(user => {
    // Filter by role and archived status
    let roleMatch = true;
    
    if (userFilter === 'archived') {
      // Only show archived users
      roleMatch = user.is_archived === true;
    } else {
      // Only show non-archived users for other filters
      if (user.is_archived === true) return false;
      
      if (userFilter === 'agents') {
        roleMatch = agentRoles.includes(user.role);
      } else if (userFilter === 'clients') {
        roleMatch = clientRoles.includes(user.role);
      }
    }
    
    // Filter by search query
    let searchMatch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const fullName = user.full_name?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const phone = user.corporate_phone?.toLowerCase() || '';
      
      searchMatch = fullName.includes(query) || 
                   email.includes(query) || 
                   phone.includes(query);
    }
    
    return roleMatch && searchMatch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  const handleFilterChange = (filter: UserFilter) => {
    setUserFilter(filter);
    setCurrentPage(1);
  };

  // Reset to first page when search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const getRoleLabel = (role: string) => {
    return t(`role.${role}`);
  };

  const onSubmit = async (values: UserFormValues) => {
    console.log('Form values being submitted:', values);
    createUserMutation.mutate(values);
  };

  const handleRoleChange = (userId: string, newRole: string, currentRole: string, userName: string) => {
    setRoleChangeDialog({
      open: true,
      userId,
      currentRole,
      newRole,
      userName
    });
  };

  const confirmRoleChange = () => {
    updateRoleMutation.mutate({ 
      userId: roleChangeDialog.userId, 
      newRole: roleChangeDialog.newRole 
    });
  };

  const handleViewAssignments = async (userId: string, userName: string, userRole: string) => {
    // Load current role and permissions from database
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('rol_id')
      .eq('id', userId)
      .single();
    
    if (userProfile?.rol_id) {
      setSelectedRoleId(userProfile.rol_id);
      
      // Load permissions for this role
      const { data: rolePermisos } = await supabase
        .from('rol_permisos')
        .select('permiso_id')
        .eq('rol_id', userProfile.rol_id);
      
      if (rolePermisos) {
        setSelectedPermissions(rolePermisos.map(rp => rp.permiso_id));
      }
    } else {
      setSelectedRoleId('');
      setSelectedPermissions([]);
    }
    
    setAssignmentsDialog({
      open: true,
      userId,
      userName,
      userRole
    });
  };

  const handleViewCorporateAssignments = async (userId: string, userName: string, userRole: string) => {
    try {
      // Get user profile with role information
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          rol_id,
          roles:rol_id (
            id,
            nombre
          )
        `)
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        toast.error('Error al cargar información del usuario');
        return;
      }

      let permissions: Array<{ id: string; nombre: string; descripcion?: string }> = [];
      let roleName = 'Sin Rol Asignado';

      if (userProfile?.rol_id) {
        roleName = userProfile.roles?.nombre || 'Sin Rol Asignado';
        
        // Get permissions for this role
        const { data: rolePermisos, error: permisosError } = await supabase
          .from('rol_permisos')
          .select(`
            permiso_id,
            permisos:permiso_id (
              id,
              nombre,
              descripcion
            )
          `)
          .eq('rol_id', userProfile.rol_id);
        
        if (permisosError) {
          console.error('Error fetching permissions:', permisosError);
        } else if (rolePermisos) {
          permissions = rolePermisos
            .map(rp => rp.permisos)
            .filter(p => p !== null) as Array<{ id: string; nombre: string; descripcion?: string }>;
        }
      }

      // Force refresh data before opening dialog
      await queryClient.refetchQueries({ queryKey: ["admin-all-users"] });
      
      setCorporateAssignmentsDialog({
        open: true,
        userId,
        userName,
        userRole,
        userRoleName: roleName,
        userPermissions: permissions
      });
    } catch (error) {
      console.error('Error in handleViewCorporateAssignments:', error);
      toast.error('Error al cargar asignaciones');
    }
  };

  const handleArchiveUser = (userId: string, userName: string) => {
    setArchiveDialog({
      open: true,
      userId,
      userName
    });
    setArchiveReason('');
  };

  const archiveUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          updated_at: new Date().toISOString(),
          is_archived: true,
          archive_reason: reason || null
        })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Usuario archivado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      setArchiveDialog({ open: false, userId: '', userName: '' });
      setArchiveReason('');
    },
    onError: (error: any) => {
      toast.error(`Error al archivar usuario: ${error.message}`);
    },
  });

  const unarchiveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Update user profile to mark as unarchived
      const { error } = await supabase
        .from("profiles")
        .update({ 
          updated_at: new Date().toISOString(),
          is_archived: false,
          archive_reason: null
        })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Usuario desarchivado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      setArchiveDialog({ open: false, userId: '', userName: '' });
    },
    onError: (error: any) => {
      toast.error(`Error al desarchivar usuario: ${error.message}`);
    },
  });

  const confirmArchiveUser = () => {
    const user = users.find(u => u.id === archiveDialog.userId);
    if (user?.is_archived) {
      unarchiveUserMutation.mutate(archiveDialog.userId);
    } else {
      // Validate reason is provided when archiving
      if (!archiveReason.trim()) {
        toast.error("Por favor ingresa el motivo del archivado");
        return;
      }
      archiveUserMutation.mutate({ userId: archiveDialog.userId, reason: archiveReason.trim() });
    }
  };

  const handleAssignment = (type: 'phone' | 'email', userId: string, userName: string, currentValue: string) => {
    setAssignmentDialog({
      open: true,
      type,
      userId,
      userName,
      currentValue
    });
    setAssignmentValue(currentValue || '');
  };

  const assignmentMutation = useMutation({
    mutationFn: async ({ userId, type, value }: { userId: string; type: 'phone' | 'email'; value: string }) => {
      console.log(`[ASSIGNMENT] Starting assignment for user ${userId}:`, { type, value });
      
      try {
        // First verify the user exists and we can access it
        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("id, full_name, assigned_corporate_phone, assigned_corporate_email")
          .eq("id", userId)
          .single();
        
        if (fetchError) {
          console.error('[ASSIGNMENT] Error fetching profile:', fetchError);
          throw new Error(`Error al obtener perfil: ${fetchError.message}`);
        }
        
        console.log('[ASSIGNMENT] Existing profile data:', existingProfile);
        
        const updateData = type === 'phone' 
          ? { assigned_corporate_phone: value, assignment_date: new Date().toISOString() }
          : { assigned_corporate_email: value, assignment_date: new Date().toISOString() };

        console.log('[ASSIGNMENT] Update data to be sent:', updateData);

        const { data, error } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", userId)
          .select("id, full_name, assigned_corporate_phone, assigned_corporate_email, assignment_date");

        if (error) {
          console.error('[ASSIGNMENT] Supabase update error:', error);
          throw new Error(`Error en base de datos: ${error.message}`);
        }

        console.log('[ASSIGNMENT] Update successful, returned data:', data);
        
        if (!data || data.length === 0) {
          throw new Error('No se pudo actualizar el registro. Verifica los permisos.');
        }

        return data[0];
      } catch (err: any) {
        console.error('[ASSIGNMENT] Complete error details:', err);
        throw new Error(err.message || 'Error inesperado al realizar la asignación');
      }
    },
    onSuccess: async (data) => {
      console.log('[ASSIGNMENT] Success callback triggered with data:', data);
      toast.success(`${assignmentDialog.type === 'phone' ? 'Teléfono' : 'Email'} asignado exitosamente`);
      
      // Force refresh the queries
      console.log('[ASSIGNMENT] Refreshing queries...');
      await queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      await queryClient.refetchQueries({ queryKey: ["admin-all-users"] });
      
      setAssignmentDialog({ open: false, type: null, userId: '', userName: '', currentValue: '' });
      setAssignmentValue('');
      console.log('[ASSIGNMENT] Assignment dialog closed and state reset');
    },
    onError: (error: any) => {
      console.error('[ASSIGNMENT] Error callback triggered:', error);
      const errorMessage = error?.message || 'Error desconocido al realizar la asignación';
      toast.error(`Error al asignar ${assignmentDialog.type === 'phone' ? 'teléfono' : 'email'}: ${errorMessage}`);
      
      // También mostrar un alert como respaldo
      alert(`ERROR AL ASIGNAR: ${errorMessage}`);
    },
  });

  const confirmAssignment = () => {
    if (assignmentDialog.type && assignmentValue.trim()) {
      assignmentMutation.mutate({
        userId: assignmentDialog.userId,
        type: assignmentDialog.type,
        value: assignmentValue.trim()
      });
    }
  };

  const getRoleAssignments = (role: string) => {
    const assignments = {
      super_admin: [
        "Gestión completa del sistema",
        "Administración de usuarios",
        "Configuración global",
        "Acceso a reportes avanzados",
        "Control de franquicias"
      ],
      arxis_admin: [
        "Acceso completo a módulos de Proyectos ARXIS",
        "Gestión de Solicitudes ARXIS",
        "Acceso a Reportes Técnicos",
        "Lectura de datos de propiedades",
        "Lectura de datos de clientes"
      ],
      agent: [
        "Gestión de propiedades",
        "Atención a clientes",
        "Programación de visitas",
        "Gestión de leads",
        "Panel de agente"
      ],
      accounting: [
        "Ver reportes financieros",
        "Acceso a datos de asesores",
        "Comisiones generadas",
        "Exportar reportes",
        "Ingresos y egresos"
      ],
      office_manager: [
        "Gestión de oficina local",
        "Aprobar inmuebles",
        "Verificación de reuniones",
        "Contabilidad de oficina",
        "Tramitar solicitudes de bajas"
      ],
      supervisor: [
        "Control de bajas de agentes",
        "Aprobación/desaprobación",
        "Supervisión de equipo",
        "Asignaciones",
        "Historial de aprobaciones"
      ],
      client: [
        "Búsqueda de propiedades",
        "Programación de visitas",
        "Favoritos",
        "Perfil básico"
      ]
    };

    return assignments[role as keyof typeof assignments] || ["Sin asignaciones específicas"];
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "arxis_admin":
        return "default";
      case "supervisor":
        return "secondary";
      case "office_manager":
        return "secondary";
      case "agent":
        return "outline";
      case "client":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white border-0 shadow-[0_4px_14px_0_rgba(239,68,68,0.35)] hover:shadow-[0_6px_20px_0_rgba(239,68,68,0.45)] hover:scale-105 font-bold tracking-wide transition-all duration-300 backdrop-blur-sm";
      case "arxis_admin":
        return "bg-gradient-to-br from-[#C76C33] via-[#B85F2D] to-[#A95527] text-white border-0 shadow-[0_4px_14px_0_rgba(199,108,51,0.35)] hover:shadow-[0_6px_20px_0_rgba(199,108,51,0.45)] hover:scale-105 font-bold tracking-wide transition-all duration-300 backdrop-blur-sm";
      case "supervisor":
        return "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white border-0 shadow-[0_4px_14px_0_rgba(59,130,246,0.35)] hover:shadow-[0_6px_20px_0_rgba(59,130,246,0.45)] hover:scale-105 font-bold tracking-wide transition-all duration-300 backdrop-blur-sm";
      case "office_manager":
        return "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white border-0 shadow-[0_4px_14px_0_rgba(245,158,11,0.35)] hover:shadow-[0_6px_20px_0_rgba(245,158,11,0.45)] hover:scale-105 font-bold tracking-wide transition-all duration-300 backdrop-blur-sm";
      case "accounting":
        return "bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 text-white border-0 shadow-[0_4px_14px_0_rgba(99,102,241,0.35)] hover:shadow-[0_6px_20px_0_rgba(99,102,241,0.45)] hover:scale-105 font-bold tracking-wide transition-all duration-300 backdrop-blur-sm";
      case "agent":
        return "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white border-0 shadow-[0_4px_14px_0_rgba(16,185,129,0.35)] hover:shadow-[0_6px_20px_0_rgba(16,185,129,0.45)] hover:scale-105 font-bold tracking-wide transition-all duration-300 backdrop-blur-sm";
      case "client":
        return "bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 text-white border-0 shadow-[0_4px_14px_0_rgba(100,116,139,0.25)] hover:shadow-[0_6px_20px_0_rgba(100,116,139,0.35)] hover:scale-105 font-semibold tracking-wide transition-all duration-300 backdrop-blur-sm";
      default:
        return "bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 text-white border-0 shadow-[0_4px_14px_0_rgba(107,114,128,0.25)] hover:shadow-[0_6px_20px_0_rgba(107,114,128,0.35)] hover:scale-105 font-semibold tracking-wide transition-all duration-300 backdrop-blur-sm";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Crown className="h-3 w-3 mr-1.5" />;
      case "arxis_admin":
        return <HardHat className="h-3 w-3 mr-1.5" />;
      case "supervisor":
        return <UserCheck className="h-3 w-3 mr-1.5" />;
      case "office_manager":
        return <Building2 className="h-3 w-3 mr-1.5" />;
      case "accounting":
        return <DollarSign className="h-3 w-3 mr-1.5" />;
      case "agent":
        return <Home className="h-3 w-3 mr-1.5" />;
      case "client":
        return <Users className="h-3 w-3 mr-1.5" />;
      default:
        return <Users className="h-3 w-3 mr-1.5" />;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('admin.userManagement')}</h1>
          <p className="text-muted-foreground">
            {t('admin.userManagementDescription')}
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('admin.newUser')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('admin.createUser')}</DialogTitle>
              <DialogDescription>
                {t('admin.createUserDescription')}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.fullName')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="identity_card"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.identityCard')}</FormLabel>
                      <FormControl>
                        <Input placeholder="12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="corporate_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.corporatePhone')}</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.email')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.password')}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rol_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Rol <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={rolesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={rolesLoading ? "Cargando roles..." : "Selecciona un rol"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rolesFromDB.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex flex-col">
                                <span className="font-semibold">{role.nombre}</span>
                                {role.descripcion && (
                                  <span className="text-xs text-muted-foreground">{role.descripcion}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    {t('admin.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? t('admin.creating') : t('admin.create')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Usuarios
          </CardTitle>
          <CardDescription>
            {filteredUsers.length} usuarios registrados en la plataforma
          </CardDescription>
          
          {/* Search Bar */}
          <div className="w-full">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, correo o teléfono..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={userFilter === 'all' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('all')}
              className="flex items-center gap-2 text-xs lg:text-sm"
            >
              <Filter className="h-4 w-4" />
              Todos ({users.filter(u => !u.is_archived).length})
            </Button>
            <Button
              variant={userFilter === 'agents' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('agents')}
              className="flex items-center gap-2 text-xs lg:text-sm"
            >
              <Users className="h-4 w-4" />
              Agente/Staff ({users.filter(u => agentRoles.includes(u.role) && !u.is_archived).length})
            </Button>
            <Button
              variant={userFilter === 'clients' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('clients')}
              className="flex items-center gap-2 text-xs lg:text-sm"
            >
              <Users className="h-4 w-4" />
              Cliente ({users.filter(u => clientRoles.includes(u.role) && !u.is_archived).length})
            </Button>
            <Button
              variant={userFilter === 'archived' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('archived')}
              className="flex items-center gap-2 text-xs lg:text-sm"
            >
              <Archive className="h-4 w-4" />
              Archivados ({users.filter(u => u.is_archived).length})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">{t('admin.loadingUsers')}</div>
            </div>
          ) : (
            <>
              <div className="w-full">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-b bg-muted/20">
                      <TableHead className="px-4 py-4 text-left font-semibold text-sm">Nombre Completo</TableHead>
                      <TableHead className="px-4 py-4 text-left font-semibold text-sm hidden md:table-cell">Carnet</TableHead>
                      <TableHead className="px-4 py-4 text-left font-semibold text-sm">Email Registrado</TableHead>
                      <TableHead className="px-4 py-4 text-center font-semibold text-sm">Celular Asignado</TableHead>
                      <TableHead className="px-4 py-4 text-center font-semibold text-sm">Email Asignado</TableHead>
                      <TableHead className="px-4 py-4 text-center font-semibold text-sm hidden lg:table-cell">Fecha Asignación</TableHead>
                      <TableHead className="px-4 py-4 text-center font-semibold text-sm">Rol</TableHead>
                      <TableHead className="px-4 py-4 text-center font-semibold text-sm">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => {
                      const isAgentOrStaff = agentRoles.includes(user.role);
                      const hasPhoneAssignment = user.assigned_corporate_phone && user.assigned_corporate_phone.trim() !== '';
                      const hasEmailAssignment = user.assigned_corporate_email && user.assigned_corporate_email.trim() !== '';
                      
                      return (
                        <TableRow key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                          <TableCell className="px-4 py-5">
                            <div className="font-medium text-sm max-w-[120px] lg:max-w-none truncate" title={user.full_name}>
                              {user.full_name || 'Sin nombre'}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-5 hidden md:table-cell">
                            <span className="text-sm text-muted-foreground">
                              {user.identity_card || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-5">
                            <div className="text-sm max-w-[140px] lg:max-w-none truncate" title={user.email}>
                              {user.email || 'Sin email'}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-5 text-center">
                            {isAgentOrStaff ? (
                              <div className="flex flex-col items-center gap-2 w-full">
                                {hasPhoneAssignment ? (
                                  <>
                                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold border border-green-300 shadow-sm w-full max-w-[120px] flex items-center justify-center gap-1">
                                      <span className="text-green-600">✓</span> ASIGNADO
                                    </div>
                                    <div className="text-xs text-green-700 font-semibold truncate max-w-[120px] bg-green-50 px-2 py-1 rounded border" title={user.assigned_corporate_phone}>
                                      {user.assigned_corporate_phone}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAssignment('phone', user.id, user.full_name || 'Usuario', user.assigned_corporate_phone || '')}
                                      className="h-7 px-3 text-xs bg-green-50 border-green-300 text-green-700 hover:bg-green-100 w-full max-w-[120px]"
                                    >
                                      Editar
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAssignment('phone', user.id, user.full_name || 'Usuario', user.assigned_corporate_phone || '')}
                                    className="h-9 px-3 text-xs bg-orange-50 border-orange-300 text-orange-600 hover:bg-orange-100 w-full max-w-[120px] flex items-center justify-center gap-1"
                                  >
                                    <Phone className="h-3 w-3" />
                                    Asignar
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-5 text-center">
                            {isAgentOrStaff ? (
                              <div className="flex flex-col items-center gap-2 w-full">
                                {hasEmailAssignment ? (
                                  <>
                                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold border border-green-300 shadow-sm w-full max-w-[120px] flex items-center justify-center gap-1">
                                      <span className="text-green-600">✓</span> ASIGNADO
                                    </div>
                                    <div className="text-xs text-green-700 font-semibold truncate max-w-[120px] bg-green-50 px-2 py-1 rounded border" title={user.assigned_corporate_email}>
                                      {user.assigned_corporate_email}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAssignment('email', user.id, user.full_name || 'Usuario', user.assigned_corporate_email || '')}
                                      className="h-7 px-3 text-xs bg-green-50 border-green-300 text-green-700 hover:bg-green-100 w-full max-w-[120px]"
                                    >
                                      Editar
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAssignment('email', user.id, user.full_name || 'Usuario', user.assigned_corporate_email || '')}
                                    className="h-9 px-3 text-xs bg-orange-50 border-orange-300 text-orange-600 hover:bg-orange-100 w-full max-w-[120px] flex items-center justify-center gap-1"
                                  >
                                    <Mail className="h-3 w-3" />
                                    Asignar
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-5 text-center hidden lg:table-cell">
                            <span className="text-sm text-muted-foreground font-medium">
                              {user.assignment_date ? new Date(user.assignment_date).toLocaleDateString('es-ES') : '-'}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-5 text-center">
                            <div className="w-full min-w-[180px] max-w-[200px] mx-auto">
                              <Select
                                value={user.role}
                                onValueChange={(newRole) => handleRoleChange(user.id, newRole, user.role, user.full_name || 'Usuario sin nombre')}
                                disabled={updateRoleMutation.isPending}
                              >
                                <SelectTrigger className="w-full h-auto text-xs border-0 bg-transparent hover:bg-muted/20 transition-all duration-200 p-0">
                                  <SelectValue>
                                     <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border-2 transition-all duration-200 w-[180px] justify-start ${getRoleBadgeStyles(user.role)}`}>
                                       {getRoleIcon(user.role)}
                                       <span className="truncate flex-1 text-left">{getRoleLabel(user.role)}</span>
                                     </div>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-background border shadow-xl min-w-[200px]">
                                  {roles.map((role) => (
                                    <SelectItem key={role} value={role} className="text-xs hover:bg-muted/50 focus:bg-muted/50 cursor-pointer p-3">
                                       <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border-2 w-[180px] justify-start ${getRoleBadgeStyles(role)}`}>
                                         {getRoleIcon(role)}
                                         <span className="truncate flex-1 text-left">{getRoleLabel(role)}</span>
                                       </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-5 text-center">
                            <div className="flex items-center justify-center gap-1 w-full">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewCorporateAssignments(user.id, user.full_name || 'Usuario', user.role)}
                                className="h-8 w-8 p-0 hover:bg-primary/10 rounded-lg flex items-center justify-center"
                                title="Ver asignaciones corporativas"
                              >
                                <Eye className="h-4 w-4 text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewAssignments(user.id, user.full_name || 'Usuario', user.role)}
                                className="h-8 w-8 p-0 hover:bg-blue-100 rounded-lg flex items-center justify-center"
                                title="Gestionar roles y permisos"
                              >
                                <Shield className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchiveUser(user.id, user.full_name || 'Usuario')}
                                className={`h-8 w-8 p-0 rounded-lg flex items-center justify-center ${
                                  user.is_archived 
                                    ? "hover:bg-green-100" 
                                    : "hover:bg-red-100"
                                }`}
                                title={user.is_archived ? "Desarchivar usuario" : "Archivar usuario"}
                              >
                                {user.is_archived ? (
                                  <Archive className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Archive className="h-4 w-4 text-red-600" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              <div className="flex justify-between items-center p-4 border-t bg-muted/20">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} - {Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} usuarios
                </div>
                
                {totalPages > 0 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={roleChangeDialog.open} onOpenChange={(open) => setRoleChangeDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cambio de Rol</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea cambiar el rol de <strong>{roleChangeDialog.userName}</strong> 
              de <strong>{getRoleLabel(roleChangeDialog.currentRole)}</strong> 
              a <strong>{getRoleLabel(roleChangeDialog.newRole)}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRoleChange}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? 'Actualizando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Assignments Dialog - DYNAMIC */}
      <Dialog open={assignmentsDialog.open} onOpenChange={(open) => {
        if (!open) {
          setAssignmentsDialog({ open: false, userId: '', userName: '', userRole: '' });
          setSelectedRoleId('');
          setSelectedPermissions([]);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Gestión de Roles y Permisos - {assignmentsDialog.userName}
            </DialogTitle>
            <DialogDescription>
              Selecciona un rol y marca/desmarca los permisos correspondientes
            </DialogDescription>
          </DialogHeader>
          
          <RolePermissionsManager
            userId={assignmentsDialog.userId}
            selectedRoleId={selectedRoleId}
            selectedPermissions={selectedPermissions}
            onRoleChange={setSelectedRoleId}
            onPermissionsChange={setSelectedPermissions}
            onClose={() => {
              setAssignmentsDialog({ open: false, userId: '', userName: '', userRole: '' });
              setSelectedRoleId('');
              setSelectedPermissions([]);
              queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Corporate Assignments Dialog */}
      <Dialog open={corporateAssignmentsDialog.open} onOpenChange={(open) => {
        if (!open) {
          setCorporateAssignmentsDialog({ 
            open: false, 
            userId: '', 
            userName: '', 
            userRole: '',
            userRoleName: '',
            userPermissions: []
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Asignaciones de {corporateAssignmentsDialog.userName}
            </DialogTitle>
            <DialogDescription>
              Permisos y funcionalidades asignadas al rol: <strong>{corporateAssignmentsDialog.userRoleName}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <UserCheck className="h-5 w-5 text-primary" />
              <span className="font-medium">Rol Actual: {corporateAssignmentsDialog.userRoleName}</span>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Building className="h-4 w-4" />
                Funcionalidades Asignadas:
              </h4>
              {corporateAssignmentsDialog.userPermissions.length > 0 ? (
                <ul className="space-y-2">
                  {corporateAssignmentsDialog.userPermissions.map((permission) => (
                    <li key={permission.id} className="flex flex-col gap-1 p-3 bg-background border rounded hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        <span className="font-medium">{permission.nombre}</span>
                      </div>
                      {permission.descripcion && (
                        <span className="text-xs text-muted-foreground ml-4 pl-2 border-l-2 border-muted">
                          {permission.descripcion}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 border rounded-lg bg-muted/20 text-center">
                  <p className="text-sm text-muted-foreground">No hay permisos asignados a este rol</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Asignaciones Corporativas:
              </h4>
              {(() => {
                const currentUser = users.find(u => u.id === corporateAssignmentsDialog.userId);
                return currentUser ? (
                  <div className="p-4 border rounded-lg bg-background/50">
                    {currentUser.assigned_corporate_phone || currentUser.assigned_corporate_email || currentUser.assignment_date ? (
                      <>
                        {currentUser.assigned_corporate_phone && (
                          <div className="mb-2">
                            <span className="text-sm text-muted-foreground">Teléfono Asignado:</span>
                            <p className="font-medium">{currentUser.assigned_corporate_phone}</p>
                          </div>
                        )}
                        {currentUser.assigned_corporate_email && (
                          <div className="mb-2">
                            <span className="text-sm text-muted-foreground">Email Asignado:</span>
                            <p className="font-medium">{currentUser.assigned_corporate_email}</p>
                          </div>
                        )}
                        {currentUser.assignment_date && (
                          <div>
                            <span className="text-sm text-muted-foreground">Fecha de Asignación:</span>
                            <p className="font-medium">{new Date(currentUser.assignment_date).toLocaleDateString('es-ES')}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">No hay asignaciones corporativas</p>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setCorporateAssignmentsDialog({ 
              open: false, 
              userId: '', 
              userName: '', 
              userRole: '',
              userRoleName: '',
              userPermissions: []
            })}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive User Confirmation Dialog */}
      <AlertDialog open={archiveDialog.open} onOpenChange={(open) => setArchiveDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {users.find(u => u.id === archiveDialog.userId)?.is_archived 
                ? "Confirmar Desarchivado de Usuario" 
                : "Confirmar Archivado de Usuario"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {users.find(u => u.id === archiveDialog.userId)?.is_archived 
                ? (
                  <>
                    ¿Está seguro que desea desarchivar al usuario <strong>{archiveDialog.userName}</strong>?
                    Esta acción reactivará la cuenta del usuario.
                  </>
                ) : (
                  <>
                    ¿Está seguro que desea archivar al usuario <strong>{archiveDialog.userName}</strong>?
                    Esta acción desactivará temporalmente la cuenta del usuario.
                  </>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Only show reason input when archiving (not unarchiving) */}
          {!users.find(u => u.id === archiveDialog.userId)?.is_archived && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Motivo del archivado <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Ingresa el motivo por el cual se archiva este usuario..."
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {archiveReason.length}/500 caracteres
              </p>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setArchiveReason('')}>
              Cancelar
            </AlertDialogCancel>
            <Button 
              onClick={() => {
                console.log('[ARCHIVE] Button clicked, userId:', archiveDialog.userId, 'reason:', archiveReason);
                const user = users.find(u => u.id === archiveDialog.userId);
                console.log('[ARCHIVE] User found:', user?.full_name, 'is_archived:', user?.is_archived);
                if (!user?.is_archived && !archiveReason.trim()) {
                  toast.error("Por favor ingresa el motivo del archivado");
                  return;
                }
                if (user?.is_archived) {
                  console.log('[ARCHIVE] Unarchiving user...');
                  unarchiveUserMutation.mutate(archiveDialog.userId);
                } else {
                  console.log('[ARCHIVE] Archiving user with reason:', archiveReason.trim());
                  archiveUserMutation.mutate({ userId: archiveDialog.userId, reason: archiveReason.trim() });
                }
              }}
              disabled={archiveUserMutation.isPending || unarchiveUserMutation.isPending}
            >
              {(archiveUserMutation.isPending || unarchiveUserMutation.isPending) 
                ? 'Procesando...' 
                : users.find(u => u.id === archiveDialog.userId)?.is_archived 
                  ? 'Desarchivar' 
                  : 'Archivar'
              }
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialog.open} onOpenChange={(open) => setAssignmentDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {assignmentDialog.type === 'phone' ? <Phone className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
              Asignar {assignmentDialog.type === 'phone' ? 'Teléfono' : 'Email'} Corporativo
            </DialogTitle>
            <DialogDescription>
              Asignar {assignmentDialog.type === 'phone' ? 'número de teléfono' : 'correo electrónico'} corporativo a <strong>{assignmentDialog.userName}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {assignmentDialog.type === 'phone' ? 'Número de Teléfono' : 'Correo Electrónico'}
              </label>
              <Input
                type={assignmentDialog.type === 'phone' ? 'tel' : 'email'}
                value={assignmentValue}
                onChange={(e) => setAssignmentValue(e.target.value)}
                placeholder={assignmentDialog.type === 'phone' ? 'Ej: +591 12345678' : 'Ej: usuario@empresa.com'}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setAssignmentDialog({ open: false, type: null, userId: '', userName: '', currentValue: '' });
                setAssignmentValue('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmAssignment}
              disabled={assignmentMutation.isPending || !assignmentValue.trim()}
            >
              {assignmentMutation.isPending ? 'Asignando...' : 'Aceptar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;