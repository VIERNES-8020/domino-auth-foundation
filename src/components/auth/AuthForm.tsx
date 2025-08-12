import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { toast } from "sonner";

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
});

type SignupValues = z.infer<typeof signupSchema>;
type LoginValues = z.infer<typeof baseSchema>;

type Mode = "login" | "signup";

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("signup");

  const form = useForm<SignupValues | LoginValues>({
    resolver: zodResolver(mode === "signup" ? signupSchema : baseSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      role: undefined,
    },
  });

  const onSubmit = async (values: any) => {
    const supabase = getSupabaseClient();

    try {
      if (mode === "signup") {
        const { email, password, full_name, role } = values as SignupValues;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name,
              role,
            },
          },
        });
        if (error) throw error;
        toast.success("Registro exitoso", {
          description:
            "Revisa tu correo para verificar la cuenta si es requerido.",
        });
      } else {
        const { email, password } = values as LoginValues;
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Inicio de sesión correcto");
      }
    } catch (err: any) {
      toast.error("Error de autenticación", {
        description: err?.message ?? "Inténtalo de nuevo",
      });
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
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          {mode === "signup" && (
            <div className="grid gap-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                placeholder="Ej. Ana Pérez"
                {...form.register("full_name")}
              />
              {form.formState.errors?.["full_name"] && (
                <p className="text-sm text-destructive">
                  {((form.formState.errors as any)["full_name"].message as string) ?? ""}
                </p>
              )}
            </div>
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
            <Button type="submit" className="w-full">
              {mode === "signup" ? "Crear cuenta" : "Entrar"}
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
