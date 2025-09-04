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
import { Users, Plus, Edit, Trash2, Filter } from "lucide-react";
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
  identity_card: z.string().min(5, "El carnet debe tener al menos 5 caracteres"),
  corporate_phone: z.string().min(8, "El teléfono debe tener al menos 8 dígitos"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["super_admin", "agent", "franchise_admin", "office_manager", "supervisor", "client"]),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const AdminUserManagement = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
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
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Then get auth users data for each profile
      const usersWithAuth = await Promise.all(
        profiles.map(async (profile) => {
          try {
            // Get user role from user_roles table
            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", profile.id)
              .maybeSingle();

            return {
              ...profile,
              role: roleData?.role || "client",
            };
          } catch (error) {
            return {
              ...profile,
              role: "client",
            };
          }
        })
      );

      return usersWithAuth;
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
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            role: values.role,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            full_name: values.full_name,
            identity_card: values.identity_card,
            corporate_phone: values.corporate_phone,
            email: values.email,
          });

        if (profileError) throw profileError;

        // Create user role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert([{
            user_id: authData.user.id,
            role: values.role as any, // Using any to bypass type checking until types are regenerated
          }]);

        if (roleError) throw roleError;
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
      toast.error(error.message || t('unexpectedError') || 'Error inesperado');
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
    if (userFilter === 'agents') {
      return agentRoles.includes(user.role);
    }
    if (userFilter === 'clients') {
      return clientRoles.includes(user.role);
    }
    return true; // Show all for 'all' filter
  });

  const getRoleLabel = (role: string) => {
    return t(`role.${role}`);
  };

  const onSubmit = async (values: UserFormValues) => {
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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "franchise_admin":
        return "default";
      case "agent":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('admin.userManagement')}</h1>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('admin.usersList')}
          </CardTitle>
          <CardDescription>
            {users.length} {t('admin.usersCount')}
          </CardDescription>
          
          {/* Filter Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={userFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setUserFilter('all')}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {t('admin.filterAll')}
            </Button>
            <Button
              variant={userFilter === 'agents' ? 'default' : 'outline'}
              onClick={() => setUserFilter('agents')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              {t('admin.filterAgents')}
            </Button>
            <Button
              variant={userFilter === 'clients' ? 'default' : 'outline'}
              onClick={() => setUserFilter('clients')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              {t('admin.filterClients')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">{t('admin.loadingUsers')}</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.fullName')}</TableHead>
                  <TableHead>{t('admin.identityCard')}</TableHead>
                  <TableHead>{t('admin.corporatePhone')}</TableHead>
                  <TableHead>{t('admin.email')}</TableHead>
                  <TableHead>{t('admin.role')}</TableHead>
                  <TableHead>{t('admin.registrationDate')}</TableHead>
                  <TableHead>{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || t('admin.noName')}
                    </TableCell>
                    <TableCell>{user.identity_card || t('admin.notAvailable')}</TableCell>
                    <TableCell>{user.corporate_phone || t('admin.notAvailable')}</TableCell>
                    <TableCell>{(user as any).email || t('admin.notAvailable')}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole, user.role, user.full_name || 'Usuario sin nombre')}
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {getRoleLabel(role)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : t('admin.notAvailable')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
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
    </div>
  );
};

export default AdminUserManagement;