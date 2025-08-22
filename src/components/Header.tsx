import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut, ChevronDown } from "lucide-react";
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
      } else if (roleData?.role === 'super_admin') {
        setUserRole('Super Administrador');
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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    }
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
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userProfile?.avatar_url || ''} alt="Avatar del usuario" />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {userProfile?.full_name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={userProfile?.avatar_url || ''} alt="Avatar del usuario" />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {userProfile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold">
                        {userProfile?.full_name || 'Usuario'}
                      </p>
                      {userRole && (
                        <p className="text-xs text-primary font-medium">
                          {userRole}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin') ? (
                    <DropdownMenuItem asChild>
                      <Link to="/" className="flex items-center gap-2 w-full cursor-pointer">
                        <User className="h-4 w-4" />
                        Ir al Portal Principal
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link to={getDashboardLink()} className="flex items-center gap-2 w-full cursor-pointer">
                        <User className="h-4 w-4" />
                        Ir a mi Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
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
