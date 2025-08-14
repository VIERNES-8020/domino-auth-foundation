import AuthForm from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

const Index = () => {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      const supabase = getSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      
      if (session?.session?.user) {
        // Check user role from user_roles table or metadata
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.session.user.id)
          .single();
        
        const role = roleData?.role || session.session.user.user_metadata?.role;
        setUserRole(role);
      }
    };

    checkUserRole();
  }, []);

  const getSmartPanelLink = () => {
    if (userRole === 'admin' || userRole === 'Super Administrador') {
      return '/admin/dashboard/users';
    }
    return '/dashboard/agent';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <header className="container mx-auto py-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Inmobiliaria DOMIN10 — Autenticación
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Regístrate o inicia sesión para acceder al panel de gestión.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild>
            <Link to={getSmartPanelLink()}>
              {userRole === 'admin' || userRole === 'Super Administrador' 
                ? "Ir al Panel de Admin" 
                : "Ir al Panel del Agente"}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Ir al Portal Público</Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto pb-16">
        <section aria-labelledby="auth-section" className="flex justify-center">
          <h2 id="auth-section" className="sr-only">Formulario de autenticación</h2>
          <AuthForm />
        </section>
      </main>
    </div>
  );
};

export default Index;
