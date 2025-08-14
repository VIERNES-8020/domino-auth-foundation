import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import brandLogo from "@/assets/logo-dominio.svg";
import { supabase } from "@/integrations/supabase/client";

export default function Header() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      
      if (s?.user?.id) {
        // Fetch user role when session changes
        setTimeout(async () => {
          try {
        const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', s.user.id)
              .single();
            
            // Map database roles to UI expectations
            const dbRole = roleData?.role;
            const displayRole = dbRole === 'super_admin' || dbRole === 'admin' 
              ? 'Super Administrador' 
              : s.user.user_metadata?.role || 'Agente Inmobiliario';
            setUserRole(displayRole);
          } catch (error) {
            console.warn("Could not fetch user role:", error);
            setUserRole(null);
          }
        }, 0);
      } else {
        setUserRole(null);
      }
    });
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user?.id) {
        // Fetch user role for existing session
        setTimeout(async () => {
          try {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single();
            
            // Map database roles to UI expectations
            const dbRole = roleData?.role;
            const displayRole = dbRole === 'super_admin' || dbRole === 'admin' 
              ? 'Super Administrador' 
              : session.user.user_metadata?.role || 'Agente Inmobiliario';
            setUserRole(displayRole);
          } catch (error) {
            console.warn("Could not fetch user role:", error);
            setUserRole(null);
          }
        }, 0);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="container mx-auto py-5">
      <nav className="flex items-center justify-between" aria-label="Principal">
        <Link to="/" className="flex items-center gap-2 hover-scale" aria-label="DOMINIO Inicio">
          <img src="/lovable-uploads/0db86b24-3da5-42a2-9780-da456242b977.png" alt="DOMINIO Inmobiliaria - logotipo oficial" className="h-12 w-auto" />
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Inicio
            </Link>
            <Link 
              to="/properties" 
              className={`nav-link ${location.pathname === '/properties' ? 'active' : ''}`}
            >
              Propiedades
            </Link>
            <Link 
              to="/agents" 
              className={`nav-link ${location.pathname === '/agents' ? 'active' : ''}`}
            >
              Nuestros Agentes
            </Link>
            <Link 
              to="/about" 
              className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
            >
              Sobre Nosotros
            </Link>
            <Link 
              to="/contact" 
              className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}
            >
              Contacto
            </Link>
          </div>
          {session ? (
            <div className="flex items-center gap-2">
              {userRole === 'Super Administrador' ? (
                <>
                  <Button asChild>
                    <Link to="/admin/dashboard">Panel Super Admin</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/dashboard/agent">Vista Agente</Link>
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link to="/dashboard/agent">Panel de Agente</Link>
                </Button>
              )}
              <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); }}>
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link to="/auth">Iniciar Sesión</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Registrarse</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
