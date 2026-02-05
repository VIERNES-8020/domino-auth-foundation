import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { User, LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { cn } from "@/lib/utils";

export default function Header() {
  const { t } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // Mapear roles de la base de datos a nombres de la aplicación
  const mapDatabaseRoleToAppRole = (dbRole: string): string => {
    const roleMapping: Record<string, string> = {
      'SUPERADMIN': 'Super Administrador',
      'SUPERVISIÓN': 'Supervisión (Auxiliar)',
      'AGENTE': 'Agente Inmobiliario',
      'ADMINISTRACIÓN': 'Administración (Encargado de Oficina)',
      'CONTABILIDAD': 'Contabilidad',
    };
    
    return roleMapping[dbRole] || dbRole;
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, roles(nombre)')
        .eq('id', userId)
        .single();
      
      setUserProfile(profileData);

      if (profileData?.is_super_admin === true) {
        setUserRole('Super Administrador');
        return;
      }
      
      const dbRoleName = (profileData?.roles as any)?.nombre;
      
      if (dbRoleName) {
        const mappedRole = mapDatabaseRoleToAppRole(dbRoleName);
        setUserRole(mappedRole);
        return;
      }
      
      setUserRole('Cliente');
    } catch (error) {
      console.warn("Could not fetch user profile:", error);
      setUserRole('Cliente');
    }
  };

  const getDashboardLink = () => {
    switch (userRole) {
      case 'Super Administrador':
        return '/admin/dashboard';
      case 'Supervisión (Auxiliar)':
        return '/dashboard/supervisor';
      case 'Administración (Encargado de Oficina)':
        return '/dashboard/office-manager';
      case 'Contabilidad':
        return '/dashboard/accounting';
      case 'Agente Inmobiliario':
        return '/dashboard/agent';
      case 'Cliente':
        return '/dashboard/client';
      default:
        return '/dashboard/client';
    }
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

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/propiedades', label: t('nav.properties') },
    { to: '/nuestros-agentes', label: t('nav.agents') },
    { to: '/nuestros-clientes', label: t('nav.clients') },
    { to: '/sobre-nosotros', label: t('nav.about') },
    { to: '/contacto', label: t('nav.contact') },
  ];

  return (
    <header className={cn(
      "relative z-50 container mx-auto px-3 sm:px-4 py-3 sm:py-5",
      isHomePage && "text-white"
    )}>
      <nav className="flex items-center justify-between gap-2" aria-label="Principal">
        {/* Logo */}
        <Link to="/" className={cn(
          "flex items-center gap-2 hover-scale shrink-0 rounded-lg p-1",
          isHomePage ? "bg-white/90 backdrop-blur-sm" : "bg-white"
        )} aria-label="DOMINIO Inicio">
          <img 
            src="/lovable-uploads/0db86b24-3da5-42a2-9780-da456242b977.png" 
            alt="DOMINIO Inmobiliaria - logotipo oficial" 
            className="h-8 sm:h-10 lg:h-12 w-auto" 
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          {navLinks.map((link) => (
            <Link 
              key={link.to}
              to={link.to} 
              className={cn(
                "whitespace-nowrap font-medium transition-colors",
                isHomePage 
                  ? "text-white hover:text-white/80 drop-shadow-md" 
                  : "nav-link",
                location.pathname === link.to && !isHomePage && 'active',
                location.pathname === link.to && isHomePage && 'underline underline-offset-4'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
        
        {/* Right side actions */}
        <div className={cn(
          "flex items-center gap-1 sm:gap-2",
          isHomePage && "[&_button]:border-white/50"
        )}>
          <LanguageSelector />
          
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarImage src={userProfile?.avatar_url || ''} alt="Avatar del usuario" />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs sm:text-sm">
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
                      {t('nav.dashboard')}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  {t('nav.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" asChild size="sm" className={cn(
                "hidden sm:inline-flex text-xs sm:text-sm px-2 sm:px-4",
                isHomePage && "bg-transparent border-white text-white hover:bg-white/20"
              )}>
                <Link to="/auth">{t('nav.login')}</Link>
              </Button>
              <Button asChild size="sm" className={cn(
                "hidden sm:inline-flex text-xs sm:text-sm px-2 sm:px-4",
                isHomePage && "bg-white text-primary hover:bg-white/90"
              )}>
                <Link to="/auth">{t('nav.register')}</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={cn(
                "lg:hidden h-8 w-8 sm:h-10 sm:w-10",
                isHomePage && "text-white hover:bg-white/20"
              )}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px] p-0 [&>button]:hidden">
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <img 
                    src="/lovable-uploads/0db86b24-3da5-42a2-9780-da456242b977.png" 
                    alt="DOMINIO" 
                    className="h-10 w-auto" 
                  />
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>

                {/* Mobile Navigation Links */}
                <div className="flex-1 overflow-y-auto py-4">
                  <nav className="flex flex-col gap-1 px-3">
                    {navLinks.map((link) => (
                      <SheetClose key={link.to} asChild>
                        <Link 
                          to={link.to} 
                          className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                            location.pathname === link.to 
                              ? 'bg-primary/10 text-primary' 
                              : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                </div>

                {/* Mobile Menu Footer - Auth Buttons */}
                {!session && (
                  <div className="p-4 border-t space-y-2">
                    <SheetClose asChild>
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/auth">{t('nav.login')}</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild className="w-full">
                        <Link to="/auth">{t('nav.register')}</Link>
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
