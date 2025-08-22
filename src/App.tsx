import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Toaster } from '@/components/ui/toaster';
import { useAutoLogout } from '@/hooks/useAutoLogout';

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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    initializeAuth();
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (user: User) => {
    try {
      console.log("Obteniendo perfil para usuario:", user.id);
      
      // First check profiles table for super admin flag
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, is_super_admin, full_name')
        .eq('id', user.id)
        .maybeSingle();
      
      console.log("Datos del perfil:", profileData);
      
      if (profileData?.is_super_admin === true) {
        console.log("Usuario es Super Admin por perfil");
        setProfile({ 
          id: profileData.id, 
          role: 'Super Administrador' 
        });
        return;
      }
      
      // Then check user_roles for other roles
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log("Datos del rol:", roleData);
      
      if (roleData?.role === 'agent') {
        console.log("Usuario es Agente Inmobiliario");
        setProfile({ 
          id: user.id, 
          role: 'Agente Inmobiliario' 
        });
        return;
      }
      
      if (roleData?.role === 'super_admin') {
        console.log("Usuario es Super Admin por rol");
        setProfile({ 
          id: user.id, 
          role: 'Super Administrador' 
        });
        return;
      }
      
      // Default to client role
      console.log("Usuario es Cliente (default)");
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

  console.log("Verificando acceso - Rol requerido:", requiredRole, "Rol del usuario:", profile?.role);

  if (requiredRole && profile?.role !== requiredRole) {
    console.log("Acceso denegado - Rol no coincide");
    return <AccessDenied />;
  }

  console.log("Acceso permitido");
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
        <Route path="/dashboard/agent" element={
          <DashboardLayout>
            <ProtectedRoute requiredRole="Agente Inmobiliario">
              <AgentDashboard />
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
  );
}