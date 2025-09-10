import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Edit, Archive, Filter, UserCheck, Shield, Building, Eye, Search, Phone, Mail, Crown, Building2, Home } from "lucide-react";
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

type AppRole = Database["public"]["Enums"]["app_role"];

type UserFilter = 'all' | 'agents' | 'clients';

const userFormSchema = z.object({
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  identity_card: z.string().optional(),
  corporate_phone: z.string().optional(),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["super_admin", "agent", "franchise_admin", "office_manager", "supervisor", "client"]),
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
  const [corporateAssignmentsDialog, setCorporateAssignmentsDialog] = useState<{
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
  const [archiveDialog, setArchiveDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  }>({
    open: false,
    userId: '',
    userName: ''
  });
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
      
      // Get all profiles with complete data
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
          assignment_date
        `)
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles fetched:', profiles);

      // Get user roles and combine with profile data
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          try {
            // Get user role from user_roles table
            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", profile.id)
              .maybeSingle();

            console.log(`Role for user ${profile.id}:`, roleData);

            return {
              ...profile,
              role: roleData?.role || "client",
            };
          } catch (error) {
            console.error(`Error getting role for user ${profile.id}:`, error);
            return {
              ...profile,
              role: "client",
            };
          }
        })
      );

      console.log('Users with roles:', usersWithRoles);
      return usersWithRoles;
    },
    enabled: !!currentUser && !loading,
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      full_name: "",
      identity_card: "",
      corporate_phone: "",
      email: "",
      password: "",
      role: "agent",
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
      
      // Create user account with email confirmation disabled
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanedValues.email,
        password: cleanedValues.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          data: {
            full_name: cleanedValues.full_name,
            role: cleanedValues.role,
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

      if (authData.user) {
        console.log('User created successfully, creating profile...');
        
        // Create profile using the secure function
        const { error: profileError } = await supabase.rpc('create_user_profile', {
          p_user_id: authData.user.id,
          p_full_name: cleanedValues.full_name,
          p_identity_card: cleanedValues.identity_card,
          p_corporate_phone: cleanedValues.corporate_phone,
          p_email: cleanedValues.email,
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(`Error al crear perfil: ${profileError.message}`);
        }

        console.log('Profile created, creating user role...');
        console.log('Creating role:', cleanedValues.role, 'for user:', authData.user.id);
        
        // Create user role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert([{
            user_id: authData.user.id,
            role: cleanedValues.role as any,
          }]);

        if (roleError) {
          console.error('Role creation error:', roleError);
          console.error('Attempted role value:', cleanedValues.role);
          throw new Error(`Error al asignar rol "${cleanedValues.role}": ${roleError.message}`);
        }
        
        console.log('User creation completed successfully');
      }

      return authData;
    },
    onSuccess: () => {
      toast.success(t('userCreatedSuccess') || 'Usuario creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
      
      // Handle specific email validation errors with helpful messages
      if (error.message?.includes('Email address') && error.message?.includes('is invalid')) {
        toast.error('Email inválido. Revisa si hay errores como "gamil.com" (debería ser "gmail.com"), "yahooo.com", etc.');
      } else if (error.message?.includes('User already registered')) {
        toast.error('Ya existe un usuario registrado con este email.');
      } else if (error.message?.includes('rate limit')) {
        toast.error('Has hecho muchos intentos. Espera unos minutos antes de intentar de nuevo.');
      } else {
        toast.error(error.message || t('unexpectedError') || 'Error inesperado al crear el usuario');
      }
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      console.log('Updating role for user:', userId, 'to role:', newRole);
      
      // First, check if a role already exists for this user
      const { data: existingRole, error: selectError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking existing role:', selectError);
        throw selectError;
      }

      console.log('Existing role:', existingRole);

      if (existingRole) {
        // Update existing role
        console.log('Updating existing role...');
        const { data, error } = await supabase
          .from("user_roles")
          .update({ role: newRole as any })
          .eq("user_id", userId)
          .select();
        
        if (error) {
          console.error('Error updating role:', error);
          throw error;
        }
        console.log('Role updated successfully:', data);
      } else {
        // Insert new role
        console.log('Inserting new role...');
        const { data, error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: newRole as any }])
          .select();
        
        if (error) {
          console.error('Error inserting role:', error);
          throw error;
        }
        console.log('Role inserted successfully:', data);
      }

      // Verify the update worked
      const { data: verifyRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      
      console.log('Role verification after update:', verifyRole);
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
    "franchise_admin",
    "office_manager",
    "supervisor",
    "client",
  ];

  // Filter logic
  const agentRoles = ["super_admin", "agent", "franchise_admin", "office_manager", "supervisor"];
  const clientRoles = ["client"];

  const filteredUsers = users.filter(user => {
    // Filter by role
    let roleMatch = true;
    if (userFilter === 'agents') {
      roleMatch = agentRoles.includes(user.role);
    } else if (userFilter === 'clients') {
      roleMatch = clientRoles.includes(user.role);
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

  const handleViewAssignments = (userId: string, userName: string, userRole: string) => {
    setAssignmentsDialog({
      open: true,
      userId,
      userName,
      userRole
    });
  };

  const handleViewCorporateAssignments = async (userId: string, userName: string, userRole: string) => {
    // Force refresh data before opening dialog
    await queryClient.refetchQueries({ queryKey: ["admin-all-users"] });
    setCorporateAssignmentsDialog({
      open: true,
      userId,
      userName,
      userRole
    });
  };

  const handleArchiveUser = (userId: string, userName: string) => {
    setArchiveDialog({
      open: true,
      userId,
      userName
    });
  };

  const archiveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Update user profile to mark as archived
      const { error } = await supabase
        .from("profiles")
        .update({ 
          updated_at: new Date().toISOString(),
          // You can add an is_archived field to profiles table if needed
        })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Usuario archivado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      setArchiveDialog({ open: false, userId: '', userName: '' });
    },
    onError: (error: any) => {
      toast.error(`Error al archivar usuario: ${error.message}`);
    },
  });

  const confirmArchiveUser = () => {
    archiveUserMutation.mutate(archiveDialog.userId);
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
      franchise_admin: [
        "Administración de franquicia",
        "Gestión de agentes de la franquicia",
        "Reportes de franquicia",
        "Configuración de franquicia"
      ],
      agent: [
        "Gestión de propiedades",
        "Atención a clientes",
        "Programación de visitas",
        "Gestión de leads",
        "Panel de agente"
      ],
      office_manager: [
        "Gestión de oficina",
        "Supervisión de agentes",
        "Reportes de oficina",
        "Coordinación de actividades"
      ],
      supervisor: [
        "Supervisión de equipo",
        "Reportes de supervisión",
        "Seguimiento de metas",
        "Capacitación"
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
      case "franchise_admin":
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
      case "franchise_admin":
        return "bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white border-0 shadow-[0_4px_14px_0_rgba(147,51,234,0.35)] hover:shadow-[0_6px_20px_0_rgba(147,51,234,0.45)] hover:scale-105 font-bold tracking-wide transition-all duration-300 backdrop-blur-sm";
      case "supervisor":
        return "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white border-0 shadow-[0_4px_14px_0_rgba(59,130,246,0.35)] hover:shadow-[0_6px_20px_0_rgba(59,130,246,0.45)] hover:scale-105 font-bold tracking-wide transition-all duration-300 backdrop-blur-sm";
      case "office_manager":
        return "bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 text-white border-0 shadow-[0_4px_14px_0_rgba(20,184,166,0.35)] hover:shadow-[0_6px_20px_0_rgba(20,184,166,0.45)] hover:scale-105 font-bold tracking-wide transition-all duration-300 backdrop-blur-sm";
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
      case "franchise_admin":
        return <Shield className="h-3 w-3 mr-1.5" />;
      case "supervisor":
        return <UserCheck className="h-3 w-3 mr-1.5" />;
      case "office_manager":
        return <Building2 className="h-3 w-3 mr-1.5" />;
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
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.role')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin.selectRole')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {getRoleLabel(role)}
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
              Todos ({users.length})
            </Button>
            <Button
              variant={userFilter === 'agents' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('agents')}
              className="flex items-center gap-2 text-xs lg:text-sm"
            >
              <Users className="h-4 w-4" />
              Agente/Staff ({users.filter(u => agentRoles.includes(u.role)).length})
            </Button>
            <Button
              variant={userFilter === 'clients' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('clients')}
              className="flex items-center gap-2 text-xs lg:text-sm"
            >
              <Users className="h-4 w-4" />
              Cliente ({users.filter(u => clientRoles.includes(u.role)).length})
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
                            <div className="w-full min-w-[160px] max-w-[180px] mx-auto">
                              <Select
                                value={user.role}
                                onValueChange={(newRole) => handleRoleChange(user.id, newRole, user.role, user.full_name || 'Usuario sin nombre')}
                                disabled={updateRoleMutation.isPending}
                              >
                                <SelectTrigger className="w-full h-auto text-xs border-0 bg-transparent hover:bg-muted/20 transition-all duration-200 p-0">
                                  <SelectValue>
                                     <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap border-2 transition-all duration-200 ${getRoleBadgeStyles(user.role)}`}>
                                       {getRoleIcon(user.role)}
                                       <span>{getRoleLabel(user.role)}</span>
                                     </div>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-background border shadow-xl min-w-[200px]">
                                  {roles.map((role) => (
                                    <SelectItem key={role} value={role} className="text-xs hover:bg-muted/50 focus:bg-muted/50 cursor-pointer p-3">
                                       <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap border-2 ${getRoleBadgeStyles(role)}`}>
                                         {getRoleIcon(role)}
                                         <span>{getRoleLabel(role)}</span>
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
                                onClick={() => handleViewAssignments(user.id, user.full_name || 'Usuario', user.role)}
                                className="h-8 w-8 p-0 hover:bg-primary/10 rounded-lg flex items-center justify-center"
                                title="Ver asignaciones de rol"
                              >
                                <Eye className="h-4 w-4 text-primary" />
                              </Button>
                              {(user.role === 'agent' || agentRoles.includes(user.role)) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewCorporateAssignments(user.id, user.full_name || 'Usuario', user.role)}
                                  className="h-8 w-8 p-0 hover:bg-blue-100 rounded-lg flex items-center justify-center"
                                  title="Ver asignaciones corporativas"
                                >
                                  <Building className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchiveUser(user.id, user.full_name || 'Usuario')}
                                className="h-8 w-8 p-0 hover:bg-red-100 rounded-lg flex items-center justify-center"
                                title="Archivar usuario"
                              >
                                <Archive className="h-4 w-4 text-red-600" />
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

      {/* Role Assignments Dialog */}
      <Dialog open={assignmentsDialog.open} onOpenChange={(open) => setAssignmentsDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Asignaciones de {assignmentsDialog.userName}
            </DialogTitle>
            <DialogDescription>
              Permisos y funcionalidades asignadas al rol: <strong>{getRoleLabel(assignmentsDialog.userRole)}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-medium">Rol Actual: {getRoleLabel(assignmentsDialog.userRole)}</span>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Building className="h-4 w-4" />
                Funcionalidades Asignadas:
              </h4>
              <ul className="space-y-2">
                {getRoleAssignments(assignmentsDialog.userRole).map((assignment, index) => (
                  <li key={index} className="flex items-center gap-2 p-2 bg-background border rounded">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    {assignment}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setAssignmentsDialog({ open: false, userId: '', userName: '', userRole: '' })}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Corporate Assignments Dialog */}
      <Dialog open={corporateAssignmentsDialog.open} onOpenChange={(open) => setCorporateAssignmentsDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Asignaciones de {corporateAssignmentsDialog.userName}
            </DialogTitle>
            <DialogDescription>
              Permisos y funcionalidades asignadas al rol: <strong>Agente Inmobiliario</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <UserCheck className="h-5 w-5 text-primary" />
              <span className="font-medium">Rol Actual: Agente Inmobiliario</span>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Building className="h-4 w-4" />
                Funcionalidades Asignadas:
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 p-2 bg-background border rounded">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  Gestión de propiedades
                </li>
                <li className="flex items-center gap-2 p-2 bg-background border rounded">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  Atención a clientes
                </li>
                <li className="flex items-center gap-2 p-2 bg-background border rounded">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  Programación de visitas
                </li>
                <li className="flex items-center gap-2 p-2 bg-background border rounded">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  Gestión de leads
                </li>
                <li className="flex items-center gap-2 p-2 bg-background border rounded">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  Panel de agente
                </li>
              </ul>
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
            <Button onClick={() => setCorporateAssignmentsDialog({ open: false, userId: '', userName: '', userRole: '' })}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive User Confirmation Dialog */}
      <AlertDialog open={archiveDialog.open} onOpenChange={(open) => setArchiveDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Archivado de Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea archivar al usuario <strong>{archiveDialog.userName}</strong>?
              Esta acción desactivará temporalmente la cuenta del usuario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmArchiveUser}
              disabled={archiveUserMutation.isPending}
            >
              {archiveUserMutation.isPending ? 'Archivando...' : 'Archivar Usuario'}
            </AlertDialogAction>
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