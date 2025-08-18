
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
  role: z.enum(agentRoles, { required_error: "Selecciona un rol" }),
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

  // Función para obtener el rol del usuario desde la tabla user_roles
  const getUserRole = async (userId: string): Promise<string | null> => {
    
    
    try {
      console.log("Obteniendo rol para usuario:", userId);
      
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.warn("Error al obtener rol de user_roles:", error);
        return null;
      }
      
      console.log("Rol obtenido de user_roles:", roleData?.role);
      return roleData?.role || null;
    } catch (err) {
      console.error("Error en getUserRole:", err);
      return null;
    }
  };

  // Función de redirección basada en roles - AuthGate handles navigation
  const handleSuccessfulLogin = async (session: any) => {
    if (!session?.user?.id) {
      console.error("No hay sesión o usuario");
      return;
    }

    console.log("Usuario logueado:", session.user.id);
    
    // Just show success message - AuthGate will handle navigation automatically
    setSuccessMessage("✅ Inicio de sesión exitoso. Redirigiendo...");
  };

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    setSuccessMessage("");

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
          
          // Upsert profile con información adicional
          const { error: upsertErr } = await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name,
            identity_card,
            corporate_phone,
          });
          
          if (upsertErr) console.warn('Error al guardar perfil:', upsertErr);

          // Insertar rol en user_roles
          const { error: roleError } = await supabase.from('user_roles').upsert({
            user_id: data.user.id,
            role: role === 'Super Administrador' ? 'super_admin' : 
                  role === 'Administrador de Franquicia' ? 'franchise_admin' :
                  role === 'Gerente de Oficina' ? 'office_manager' :
                  role === 'Supervisor' ? 'supervisor' : 'agent',
          });
          
          if (roleError) console.warn('Error al guardar rol:', roleError);

          // Generar código de agente si es necesario
          if (role === 'Agente Inmobiliario') {
            const { error: fxError } = await supabase.functions.invoke('generate-agent-code', {
              body: { full_name, identity_card },
            });
            if (fxError) console.warn('Error al generar código de agente:', fxError);
          }

          toast.success("Registro exitoso", {
            description: "Revisa tu correo para verificar la cuenta si es requerido.",
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
          
          // Upsert profile con información del cliente
          const { error: upsertErr } = await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name,
            identity_card,
            corporate_phone,
          });
          
          if (upsertErr) console.warn('Error al guardar perfil de cliente:', upsertErr);

          // Insertar rol de cliente en user_roles
          const { error: roleError } = await supabase.from('user_roles').upsert({
            user_id: data.user.id,
            role: 'client',
          });
          
          if (roleError) console.warn('Error al guardar rol de cliente:', roleError);

          toast.success("Registro de cliente exitoso", {
            description: "Tu cuenta ha sido creada. Ya puedes explorar propiedades.",
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
                  {agentRoles.map((r) => (
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
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setMode("agent-signup")}
                >
                  Crear Cuenta (Agente / Staff)
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
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
