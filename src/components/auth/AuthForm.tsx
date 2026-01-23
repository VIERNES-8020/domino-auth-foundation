
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const agentRoles = [
  "Super Administrador",
  "Administrador de Franquicia",
  "Gerente de Oficina",
  "Agente Inmobiliario",
  "Supervisor",
] as const;

// Roles permitidos durante el registro público 
const allowedSignupRoles = ["Agente Inmobiliario", "Staff"] as const;


const baseSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
});

const clientSchema = baseSchema.extend({
  full_name: z.string().min(2, { message: "Ingresa tu nombre" }),
  identity_card: z.string().min(5, { message: "Ingresa tu CI" }),
  corporate_phone: z.string().min(6, { message: "Ingresa tu celular" }),
  whatsapp: z.string().optional(),
});

const agentSignupSchema = baseSchema.extend({
  full_name: z.string().min(2, { message: "Ingresa tu nombre" }),
  role: z.enum(allowedSignupRoles, { required_error: "Selecciona un rol" }),
  identity_card: z.string().min(5, { message: "Ingresa tu CI" }),
  corporate_phone: z.string().min(6, { message: "Ingresa tu celular corporativo" }),
});

type AgentSignupValues = z.infer<typeof agentSignupSchema>;
type ClientSignupValues = z.infer<typeof clientSchema>;
type LoginValues = z.infer<typeof baseSchema>;

type Mode = "login" | "agent-signup" | "client-signup";

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const navigate = useNavigate();
  

  const form = useForm<AgentSignupValues | ClientSignupValues | LoginValues>({
    resolver: zodResolver(
      mode === "agent-signup" ? agentSignupSchema : 
      mode === "client-signup" ? clientSchema : 
      baseSchema
    ),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      role: undefined,
      identity_card: "",
      corporate_phone: "",
      whatsapp: "",
    },
  });

  // Mapear roles de la base de datos a nombres de la aplicación
  const mapDatabaseRoleToAppRole = (dbRole: string): string => {
    const roleMapping: Record<string, string> = {
      'SUPERADMIN': 'Super Administrador',
      'SUPERVISIÓN': 'Supervisor',
      'AGENTE': 'Agente Inmobiliario',
      'ADMINISTRACIÓN': 'Gerente de Oficina',
      'CONTABILIDAD': 'Contabilidad',
    };
    
    return roleMapping[dbRole] || dbRole;
  };

  // Función para obtener el rol del usuario desde profiles -> roles
  const getUserRoleName = async (userId: string): Promise<string | null> => {
    try {
      console.log("Obteniendo rol para usuario:", userId);
      
      // Obtener rol desde profiles.rol_id -> roles.nombre
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('rol_id, is_super_admin, roles(nombre)')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.warn("Error al obtener perfil:", profileError);
        return null;
      }
      
      console.log("Datos del perfil:", profileData);
      
      // Si es super admin, retornar ese rol
      if (profileData?.is_super_admin === true) {
        return 'Super Administrador';
      }
      
      // Obtener nombre del rol desde la relación y mapear
      const dbRoleName = (profileData?.roles as any)?.nombre;
      console.log("Rol obtenido de BD:", dbRoleName);
      
      if (dbRoleName) {
        const mappedRole = mapDatabaseRoleToAppRole(dbRoleName);
        console.log("Rol mapeado:", mappedRole);
        return mappedRole;
      }
      
      return null;
    } catch (err) {
      console.error("Error en getUserRoleName:", err);
      return null;
    }
  };

  // Auto-redirect after successful login
  const handleSuccessfulLogin = async (session: any) => {
    if (!session?.user?.id) {
      console.error("No hay sesión o usuario");
      return;
    }

    console.log("Usuario logueado:", session.user.id);
    setSuccessMessage("✅ Inicio de sesión exitoso. Redirigiendo...");
    
    // Determine user role and redirect accordingly
    try {
      const roleName = await getUserRoleName(session.user.id);
      console.log("Rol del usuario:", roleName);
      
      // Redirección según el rol
      switch (roleName) {
        case 'Super Administrador':
          console.log("Redirigiendo Super Admin a /admin/dashboard");
          navigate('/admin/dashboard');
          break;
        case 'Supervisor':
          console.log("Redirigiendo Supervisor a /dashboard/supervisor");
          navigate('/dashboard/supervisor');
          break;
        case 'Gerente de Oficina':
          console.log("Redirigiendo Gerente de Oficina a /dashboard/office-manager");
          navigate('/dashboard/office-manager');
          break;
        case 'Agente Inmobiliario':
          console.log("Redirigiendo Agente a /dashboard/agent");
          navigate('/dashboard/agent');
          break;
        case 'Cliente':
          console.log("Redirigiendo Cliente a página principal");
          navigate('/');
          break;
        default:
          console.log("Sin rol específico, redirigiendo a página principal");
          navigate('/');
      }
    } catch (error) {
      console.error("Error determining user role:", error);
      navigate('/');
    }
  };

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    setSuccessMessage("");
    setShowEmailConfirmation(false);

    try {
      if (mode === "agent-signup") {
        const { email, password, full_name, role, identity_card, corporate_phone } = values as AgentSignupValues;
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name, role },
          },
        });
        
        if (signUpError) throw signUpError;

        // Si hay usuario, actualizar el perfil
        if (data.user) {
          console.log("Usuario registrado:", data.user.id);
          
          // Actualizar perfil con información completa del agente
          const { error: upsertErr } = await supabase.from('profiles').update({
            full_name,
            identity_card,
            corporate_phone,
          }).eq('id', data.user.id);
          
          if (upsertErr) {
            console.error('Error al actualizar perfil:', upsertErr);
          } else {
            console.log("Perfil de agente actualizado correctamente");
          }

          // Insertar rol específico en user_roles (agent o staff)
          const roleValue = role === 'Agente Inmobiliario' ? 'agent' : 'staff';
          
          console.log(`Guardando rol "${roleValue}" para usuario ${data.user.id}`);
          
          const { error: roleError } = await supabase.from('user_roles').insert({
            user_id: data.user.id,
            role: roleValue,
          });
          
          if (roleError) {
            console.error('Error al guardar rol:', roleError);
          } else {
            console.log(`Rol "${roleValue}" guardado correctamente`);
          }

          // Generar código de agente solo para Agentes Inmobiliarios
          if (role === 'Agente Inmobiliario') {
            const { error: fxError } = await supabase.functions.invoke('generate-agent-code', {
              body: { full_name, identity_card },
            });
            if (fxError) console.warn('Error al generar código de agente:', fxError);
          }

          // Mostrar mensaje prominente de confirmación por correo
          setShowEmailConfirmation(true);
          toast.success("Registro exitoso", {
            description: "Revisa tu correo para verificar la cuenta.",
          });

          // Manejar redirección después del registro exitoso
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            await handleSuccessfulLogin(sessionData.session);
          }
        }
      } else if (mode === "client-signup") {
        const { email, password, full_name, identity_card, corporate_phone, whatsapp } = values as ClientSignupValues;
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name, role: "Cliente" },
          },
        });
        
        if (signUpError) throw signUpError;

        // Si hay usuario, actualizar el perfil
        if (data.user) {
          console.log("Cliente registrado:", data.user.id);
          
          // Actualizar perfil con información del cliente
          const { error: upsertErr } = await supabase.from('profiles').update({
            full_name,
            identity_card,
            corporate_phone,
          }).eq('id', data.user.id);
          
          if (upsertErr) console.warn('Error al actualizar perfil de cliente:', upsertErr);

          // Insertar rol de cliente en user_roles
          const { error: roleError } = await supabase.from('user_roles').insert({
            user_id: data.user.id,
            role: 'client',
          });
          
          if (roleError) console.warn('Error al guardar rol de cliente:', roleError);

          // Mostrar mensaje prominente de confirmación por correo
          setShowEmailConfirmation(true);
          toast.success("Registro de cliente exitoso", {
            description: "Revisa tu correo para verificar la cuenta.",
          });

          // Show success message - AuthGate will handle navigation
          setSuccessMessage("✅ Registro exitoso. Redirigiendo...");
        }
      } else {
        // Proceso de login
        const { email, password } = values as LoginValues;
        console.log("Intentando login para:", email);
        
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        console.log("Login exitoso");
        
        // Manejar redirección después del login exitoso
        if (data.session) {
          await handleSuccessfulLogin(data.session);
        }
      }
    } catch (err: any) {
      console.error("Error de autenticación:", err);
      toast.error("Error de autenticación", {
        description: err?.message ?? "Inténtalo de nuevo",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/60">
      <CardHeader>
        <CardTitle>
          {mode === "login" ? "Iniciar sesión" : 
           mode === "agent-signup" ? "Crear cuenta (Agente / Staff)" : 
           "Crear cuenta (Cliente)"}
        </CardTitle>
        <CardDescription>
          Inmobiliaria DOMIN10 — Accede a tu panel seguro
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showEmailConfirmation && (
          <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-800 p-4">
            <CheckCircle2 className="h-5 w-5" />
            <AlertDescription className="text-base font-medium">
              <div className="mb-2">¡Cuenta creada exitosamente! 📧</div>
              <div className="text-sm">
                <strong>Importante:</strong> Revisa tu correo electrónico y confirma tu registro para activar tu cuenta completamente.
              </div>
            </AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          {(mode === "agent-signup" || mode === "client-signup") && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input id="full_name" placeholder="Ej. Ana Pérez" {...form.register("full_name")} />
                {form.formState.errors?.["full_name"] && (
                  <p className="text-sm text-destructive">{((form.formState.errors as any)["full_name"].message as string) ?? ""}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="identity_card">Carnet de Identidad</Label>
                <Input id="identity_card" placeholder="Ej. 1234567" {...form.register("identity_card")} />
                {(form.formState.errors as any)?.identity_card && (
                  <p className="text-sm text-destructive">{((form.formState.errors as any).identity_card.message as string) ?? ""}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="corporate_phone">
                  {mode === "agent-signup" ? "Celular corporativo" : "Celular"}
                </Label>
                <Input id="corporate_phone" placeholder="Ej. 7XXXXXXXX" {...form.register("corporate_phone")} />
                {(form.formState.errors as any)?.corporate_phone && (
                  <p className="text-sm text-destructive">{((form.formState.errors as any).corporate_phone.message as string) ?? ""}</p>
                )}
              </div>

              {mode === "client-signup" && (
                <div className="grid gap-2">
                  <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
                  <Input id="whatsapp" placeholder="Ej. 7XXXXXXXX" {...form.register("whatsapp")} />
                </div>
              )}
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message as string}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message as string}
              </p>
            )}
          </div>

          {mode === "agent-signup" && (
            <div className="grid gap-2">
              <Label>Rol</Label>
              <Select
                onValueChange={(val) =>
                  form.setValue("role" as any, val as (typeof agentRoles)[number], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {allowedSignupRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors?.["role"] && (
                <p className="text-sm text-destructive">
                  {((form.formState.errors as any)["role"].message as string) ?? ""}
                </p>
              )}
            </div>
          )}

          {mode === "login" ? (
            <div className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Procesando..." : "Iniciar Sesión"}
              </Button>
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full text-sm" 
                  onClick={() => setMode("agent-signup")}
                >
                  Crear Cuenta (Agente / Staff)
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full text-sm" 
                  onClick={() => setMode("client-signup")}
                >
                  Crear Cuenta (Cliente)
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 pt-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Procesando..." : "Crear cuenta"}
              </Button>
            </div>
          )}

          {mode !== "login" && (
            <div className="text-sm text-muted-foreground pt-2 text-center">
              <button
                type="button"
                className="underline underline-offset-4 hover:text-foreground transition-colors"
                onClick={() => setMode("login")}
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
