import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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

const roles = [
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

const signupSchema = baseSchema.extend({
  full_name: z.string().min(2, { message: "Ingresa tu nombre" }),
  role: z.enum(roles, { required_error: "Selecciona un rol" }),
  identity_card: z.string().min(5, { message: "Ingresa tu CI" }),
  corporate_phone: z.string().min(6, { message: "Ingresa tu celular corporativo" }),
});

type SignupValues = z.infer<typeof signupSchema>;
type LoginValues = z.infer<typeof baseSchema>;

type Mode = "login" | "signup";

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("signup");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const form = useForm<SignupValues | LoginValues>({
resolver: zodResolver(mode === "signup" ? signupSchema : baseSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      role: undefined,
      identity_card: "",
      corporate_phone: "",
    },
  });

  // Role-based redirection helper
  const handleSuccessfulLogin = async (session: any) => {
    if (!session?.user?.id) return;

    const supabase = getSupabaseClient();

    try {
      // Get role from user_roles table AND get profile metadata
      const [userRoleResponse, profileResponse] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single(),
        supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single()
      ]);

      // Check for errors in profile fetch (not critical for role routing)
      if (profileResponse.error) {
        console.warn("Error al obtener el perfil del usuario:", profileResponse.error);
      }

      // Determine user role (priority: user_roles table > user metadata)
      const userRole = userRoleResponse.data?.role || session.user.user_metadata?.role;
      
      console.log("User role detected:", userRole); // Debug log
      
      let targetPath = '/dashboard/agent'; // Default fallback

      // Role-based routing logic
      switch (userRole) {
        case 'admin':
        case 'Super Administrador':
          targetPath = '/admin/dashboard';
          break;
        case 'agent':
        case 'Agente Inmobiliario':
          targetPath = '/dashboard/agent';
          break;
        case 'Administrador de Franquicia':
          targetPath = '/dashboard/franchise';
          break;
        case 'Gerente de Oficina':
          targetPath = '/dashboard/office';
          break;
        case 'Supervisor':
          targetPath = '/dashboard/supervisor';
          break;
        default:
          console.warn("No specific role found, redirecting to agent dashboard");
          targetPath = '/dashboard/agent';
      }

      console.log("Redirecting to:", targetPath); // Debug log

      // Show success message and redirect
      setSuccessMessage("✅ Inicio de sesión exitoso. Redirigiendo a tu panel...");
      
      setTimeout(() => {
        navigate(targetPath);
      }, 1500);
    } catch (err) {
      console.error("Error en redirección basada en roles:", err);
      // Fallback navigation
      setSuccessMessage("✅ Inicio de sesión exitoso. Redirigiendo...");
      setTimeout(() => {
        navigate('/dashboard/agent');
      }, 1500);
    }
  };

  const onSubmit = async (values: any) => {
    const supabase = getSupabaseClient();
    setIsLoading(true);
    setSuccessMessage("");

    try {
      if (mode === "signup") {
        const { email, password, full_name, role, identity_card, corporate_phone } = values as SignupValues;
        const redirectUrl = `${window.location.origin}/`;
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name, role },
          },
        });
        if (signUpError) throw signUpError;

        // Ensure we have a user session
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (userId) {
          // Upsert profile with extra fields
          const { error: upsertErr } = await supabase.from('profiles').upsert({
            id: userId,
            full_name,
            identity_card,
            corporate_phone,
          });
          if (upsertErr) console.warn('No se pudo guardar el perfil', upsertErr);

          // Generate agent code only for agents
          if (role === 'Agente Inmobiliario') {
            const { error: fxError } = await supabase.functions.invoke('generate-agent-code', {
              body: { full_name, identity_card },
            });
            if (fxError) console.warn('No se pudo generar el código de agente', fxError);
          }
        }

        toast.success("Registro exitoso", {
          description: "Revisa tu correo para verificar la cuenta si es requerido.",
        });

        // Handle redirection after successful signup
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          await handleSuccessfulLogin(sessionData.session);
        }
      } else {
        const { email, password } = values as LoginValues;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Handle redirection after successful login
        if (data.session) {
          await handleSuccessfulLogin(data.session);
        }
      }
    } catch (err: any) {
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
          {mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}
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
{mode === "signup" && (
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
                <Label htmlFor="corporate_phone">Celular corporativo</Label>
                <Input id="corporate_phone" placeholder="Ej. 7XXXXXXXX" {...form.register("corporate_phone")} />
                {(form.formState.errors as any)?.corporate_phone && (
                  <p className="text-sm text-destructive">{((form.formState.errors as any).corporate_phone.message as string) ?? ""}</p>
                )}
              </div>
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

          {mode === "signup" && (
            <div className="grid gap-2">
              <Label>Rol</Label>
              <Select
                onValueChange={(val) =>
                  form.setValue("role" as any, val as (typeof roles)[number], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
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

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Procesando..." : (mode === "signup" ? "Crear cuenta" : "Entrar")}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground pt-2">
            {mode === "signup" ? (
              <button
                type="button"
                className="underline underline-offset-4 hover:text-foreground transition-colors"
                onClick={() => setMode("login")}
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            ) : (
              <button
                type="button"
                className="underline underline-offset-4 hover:text-foreground transition-colors"
                onClick={() => setMode("signup")}
              >
                ¿Aún no tienes cuenta? Regístrate
              </button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
