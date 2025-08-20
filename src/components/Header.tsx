import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import brandLogo from "@/assets/logo-dominio.svg";
import { supabase } from "@/integrations/supabase/client";

export default function Header() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  const fetchUserRole = async (userId: string) => {
    try {
      // First check profiles table for super admin flag
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileData?.is_super_admin === true) {
        setUserRole('super_admin');
        return;
      }
      
      // Then check user_roles for other roles
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      const role = roleData?.role || 'client';
      setUserRole(role);
    } catch (error) {
      console.warn("Could not fetch user role:", error);
      setUserRole('client');
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      
      if (s?.user?.id) {
        setTimeout(() => {
          fetchUserRole(s.user.id);
        }, 0);
      } else {
        setUserRole(null);
      }
    });
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user?.id) {
        setTimeout(() => {
          fetchUserRole(session.user.id);
        }, 0);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="container mx-auto py-5">
      <nav className="flex items-center justify-between" aria-label="Principal">
        <Link to="/" className="flex items-center gap-2 hover-scale" aria-label="DOMINIO Inicio">
          <img src="/lovable-uploads/0db86b24-3da5-42a2-9780-da456242b977.png" alt="DOMINIO Inmobiliaria - logotipo oficial" className="h-16 w-auto" />
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
              to="/propiedades" 
              className={`nav-link ${location.pathname === '/propiedades' ? 'active' : ''}`}
            >
              Propiedades
            </Link>
            <Link 
              to="/agentes" 
              className={`nav-link ${location.pathname === '/agentes' ? 'active' : ''}`}
            >
              Nuestros Agentes
            </Link>
            <Link 
              to="/clientes" 
              className={`nav-link ${location.pathname === '/clientes' ? 'active' : ''}`}
            >
              Nuestros Clientes
            </Link>
            <Link 
              to="/sobre-nosotros" 
              className={`nav-link ${location.pathname === '/sobre-nosotros' ? 'active' : ''}`}
            >
              Sobre Nosotros
            </Link>
            <Link 
              to="/contacto" 
              className={`nav-link ${location.pathname === '/contacto' ? 'active' : ''}`}
            >
              Contacto
            </Link>
          </div>
          {session ? (
            <div className="flex items-center gap-2">
              {userRole === 'super_admin' ? (
                <Button asChild>
                  <span onClick={() => window.location.reload()}>Panel Super Admin</span>
                </Button>
              ) : userRole === 'agent' ? (
                <Button asChild>
                  <span onClick={() => window.location.reload()}>Mi Panel</span>
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <span onClick={() => window.location.reload()}>Portal Público</span>
                </Button>
              )}
              <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); }}>
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Iniciar Sesión
              </Button>
              <Button onClick={() => window.location.reload()}>
                Registrarse
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
