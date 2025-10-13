import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Toaster } from '@/components/ui/toaster';
import { useAutoLogout } from '@/hooks/useAutoLogout';

// Create a client
const queryClient = new QueryClient();

// Import all pages
import HomePage from '@/pages/HomePage';
import AuthPage from '@/pages/AuthPage';
import PropertiesPage from '@/pages/PropertiesPage';
import PropertyDetailPage from '@/pages/PropertyDetailPage';
import AgentsPage from '@/pages/AgentsPage';
import AgentPublicPage from '@/pages/AgentPublicPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import ClientsPage from '@/pages/ClientsPage';
import VendePage from '@/pages/VendePage';
import FranchiseApplicationPage from '@/pages/FranchiseApplicationPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import AgentDashboard from '@/pages/AgentDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import ClientDashboard from '@/pages/ClientDashboard';
import SupervisorDashboard from '@/pages/SupervisorDashboard';
import OfficeManagerDashboard from '@/pages/OfficeManagerDashboard';
import AccountingDashboard from '@/pages/AccountingDashboard';
import ARXISManagerDashboard from '@/pages/ARXISManagerDashboard';
import NotFound from '@/pages/NotFound';
import AccessDenied from '@/pages/AccessDenied';

// Import components
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Profile {
  id: string;
  role: string;
}

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    initializeAuth();
    return () => subscription.unsubscribe();
  }, []);

  // Mapear roles de la base de datos a nombres de la aplicación
  const mapDatabaseRoleToAppRole = (dbRole: string): string => {
    const roleMapping: Record<string, string> = {
      'SUPER ADMINISTRADOR': 'Super Administrador',
      'SUPERVISIÓN': 'Supervisión (Auxiliar)',
      'AGENTE INMOBILIARIO': 'Agente Inmobiliario',
      'ADMINISTRACIÓN': 'Administración (Encargado de Oficina)',
      'CONTABILIDAD': 'Contabilidad',
      'ARXIS': 'Administrador de ARXIS',
      'CLIENTE': 'Cliente',
    };
    
    console.log('Mapeando rol de BD:', dbRole, '-> Rol de app:', roleMapping[dbRole] || dbRole);
    return roleMapping[dbRole] || 'Cliente';
  };

  const fetchUserProfile = async (user: User) => {
    try {
      console.log('Fetching profile for user:', user.id);
      
      // Obtener perfil con rol desde profiles.rol_id -> roles
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, is_super_admin, full_name, rol_id, roles:rol_id(id, nombre)')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Error al obtener perfil:", error);
        setProfile({ id: user.id, role: 'Cliente' });
        return;
      }
      
      console.log("Datos del perfil obtenidos:", profileData);
      
      // Si es super admin, ese es su rol principal
      if (profileData?.is_super_admin === true) {
        console.log('Usuario es Super Admin');
        setProfile({ 
          id: profileData.id, 
          role: 'Super Administrador' 
        });
        return;
      }
      
      // Obtener rol desde la relación con la tabla roles
      const rolesData = profileData?.roles as any;
      const dbRoleName = rolesData?.nombre;
      
      console.log('Rol desde BD:', { rol_id: profileData?.rol_id, rolesData, dbRoleName });
      
      if (dbRoleName) {
        const mappedRole = mapDatabaseRoleToAppRole(dbRoleName);
        console.log("Rol del usuario (BD):", dbRoleName, "-> Mapeado a:", mappedRole);
        setProfile({ 
          id: user.id, 
          role: mappedRole 
        });
        return;
      }
      
      // Si no tiene rol asignado, es cliente por defecto
      console.log("Usuario sin rol específico, asignando Cliente");
      setProfile({ 
        id: user.id, 
        role: 'Cliente' 
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfile({ id: user.id, role: 'Cliente' });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for profile to be loaded before checking permissions
  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">Verificando permisos...</div>;
  }

  // Auto-redirect superadmins trying to access agent dashboard
  if (profile?.role === 'Super Administrador' && requiredRole === 'Agente Inmobiliario') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Auto-redirect agents trying to access admin dashboard
  if (profile?.role === 'Agente Inmobiliario' && requiredRole === 'Super Administrador') {
    return <Navigate to="/dashboard/agent" replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    // Auto-redirect to correct dashboard based on role
    const roleToDashboard: Record<string, string> = {
      'Super Administrador': '/admin/dashboard',
      'Agente Inmobiliario': '/dashboard/agent',
      'Supervisión (Auxiliar)': '/dashboard/supervisor',
      'Administración (Encargado de Oficina)': '/dashboard/office-manager',
      'Contabilidad': '/dashboard/accounting',
      'Administrador de ARXIS': '/dashboard/arxis',
      'Cliente': '/dashboard/client',
    };
    
    const correctDashboard = roleToDashboard[profile.role];
    console.log('Role mismatch. User role:', profile.role, 'Required:', requiredRole, 'Redirecting to:', correctDashboard);
    
    if (correctDashboard) {
      return <Navigate to={correctDashboard} replace />;
    }
    
    return <AccessDenied />;
  }

  return <>{children}</>;
};

// Public Layout Component
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
    <Toaster />
  </div>
);

// Dashboard Layout Component (no header/footer)
const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen">
    {children}
    <Toaster />
  </div>
);

export default function App() {
  // Initialize auto-logout functionality
  useAutoLogout();
  
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
      <Routes>
        {/* Public Routes with Header/Footer */}
        <Route path="/" element={
          <PublicLayout>
            <HomePage />
          </PublicLayout>
        } />
        
        <Route path="/auth" element={
          <PublicLayout>
            <AuthPage />
          </PublicLayout>
        } />
        
        <Route path="/propiedades" element={
          <PublicLayout>
            <PropertiesPage />
          </PublicLayout>
        } />
        
        <Route path="/propiedad/:id" element={
          <PublicLayout>
            <PropertyDetailPage />
          </PublicLayout>
        } />
        
        <Route path="/nuestros-agentes" element={
          <PublicLayout>
            <AgentsPage />
          </PublicLayout>
        } />
        
        <Route path="/agente/:code" element={
          <PublicLayout>
            <AgentPublicPage />
          </PublicLayout>
        } />
        
        <Route path="/sobre-nosotros" element={
          <PublicLayout>
            <AboutPage />
          </PublicLayout>
        } />
        
        <Route path="/contacto" element={
          <PublicLayout>
            <ContactPage />
          </PublicLayout>
        } />
        
        <Route path="/nuestros-clientes" element={
          <PublicLayout>
            <ClientsPage />
          </PublicLayout>
        } />
        
        <Route path="/vende" element={
          <PublicLayout>
            <VendePage />
          </PublicLayout>
        } />
        
        <Route path="/solicitar-franquicia" element={
          <PublicLayout>
            <FranchiseApplicationPage />
          </PublicLayout>
        } />
        
        <Route path="/ranking/:franchiseId?" element={
          <PublicLayout>
            <LeaderboardPage />
          </PublicLayout>
        } />

        {/* Protected Dashboard Routes (no Header/Footer) */}
        <Route path="/dashboard/client" element={
          <DashboardLayout>
            <ProtectedRoute requiredRole="Cliente">
              <ClientDashboard />
            </ProtectedRoute>
          </DashboardLayout>
        } />

        <Route path="/dashboard/agent" element={
          <DashboardLayout>
            <ProtectedRoute requiredRole="Agente Inmobiliario">
              <AgentDashboard />
            </ProtectedRoute>
          </DashboardLayout>
        } />

        <Route path="/dashboard/supervisor" element={
          <DashboardLayout>
            <ProtectedRoute requiredRole="Supervisión (Auxiliar)">
              <SupervisorDashboard />
            </ProtectedRoute>
          </DashboardLayout>
        } />

        <Route path="/dashboard/office-manager" element={
          <DashboardLayout>
            <ProtectedRoute requiredRole="Administración (Encargado de Oficina)">
              <OfficeManagerDashboard />
            </ProtectedRoute>
          </DashboardLayout>
        } />

        <Route path="/dashboard/accounting" element={
          <DashboardLayout>
            <ProtectedRoute requiredRole="Contabilidad">
              <AccountingDashboard />
            </ProtectedRoute>
          </DashboardLayout>
        } />

        <Route path="/dashboard/arxis" element={
          <DashboardLayout>
            <ProtectedRoute requiredRole="Administrador de ARXIS">
              <ARXISManagerDashboard />
            </ProtectedRoute>
          </DashboardLayout>
        } />
        
        <Route path="/admin/dashboard" element={
          <DashboardLayout>
            <ProtectedRoute requiredRole="Super Administrador">
              <AdminDashboard />
            </ProtectedRoute>
          </DashboardLayout>
        } />

        {/* Fallback Routes */}
        <Route path="/404" element={
          <PublicLayout>
            <NotFound />
          </PublicLayout>
        } />
        
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
    </QueryClientProvider>
  );
}