import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Header() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  const fetchUserProfile = async (userId: string) => {
    try {
      // Get full user profile including avatar
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      setUserProfile(profileData);

      // Determine role using same logic as App.tsx
      if (profileData?.is_super_admin === true) {
        setUserRole('Super Administrador');
        return;
      }
      
      // Check user_roles for other roles
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (roleData?.role === 'agent') {
        setUserRole('Agente Inmobiliario');
        return;
      }
      
      // Default to client role
      setUserRole('Cliente');
    } catch (error) {
      console.warn("Could not fetch user profile:", error);
      setUserRole('Cliente');
    }
  };

  const getDashboardLink = () => {
    if (userRole === 'Super Administrador') {
      return '/admin/dashboard';
    } else if (userRole === 'Agente Inmobiliario') {
      return '/dashboard/agent';
    }
    return '/'; // Default fallback
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      
      if (s?.user?.id) {
        setTimeout(() => {
          fetchUserProfile(s.user.id);
        }, 0);
      } else {
        setUserRole(null);
        setUserProfile(null);
      }
    });
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user?.id) {
        setTimeout(() => {
          fetchUserProfile(session.user.id);
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
              to="/nuestros-agentes" 
              className={`nav-link ${location.pathname === '/nuestros-agentes' ? 'active' : ''}`}
            >
              Nuestros Agentes
            </Link>
            <Link 
              to="/nuestros-clientes" 
              className={`nav-link ${location.pathname === '/nuestros-clientes' ? 'active' : ''}`}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarImage src={userProfile?.avatar_url || ''} alt="Avatar del usuario" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardLink()} className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Ir a mi Panel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={async () => { await supabase.auth.signOut(); }}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
