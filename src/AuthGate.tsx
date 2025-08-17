import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { BrowserRouter as Router } from 'react-router-dom';

// Importa TODOS los componentes de tus páginas
import AuthPage from './pages/AuthPage';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PublicPortal from './pages/PublicPortal';

interface Profile {
  id: string;
  is_super_admin: boolean;
}

// Este es un componente simple para mostrar "Acceso Denegado"
const AccessDenied = () => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h1>Acceso Denegado</h1>
    <p>No tienes los permisos necesarios para acceder a esta página.</p>
  </div>
);


export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchUserProfile(session.user);
      }
      setLoading(false);
    };
    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        fetchUserProfile(newSession.user);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (user: User) => {
    try {
      // First check if user is super admin from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, is_super_admin')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.warn("Error getting profile:", profileError);
        // Create minimal profile with super admin flag false
        setProfile({ id: user.id, is_super_admin: false });
        return;
      }
      
      setProfile(profileData as Profile);
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      await supabase.auth.signOut();
    }
  };
  
  if (loading) {
    return <div>Cargando y verificando sesión...</div>;
  }

  // Si no hay sesión, siempre mostramos la página de autenticación
  if (!session) {
    return (
      <Router>
        <AuthPage />
      </Router>
    );
  }

  // Si hay sesión pero el perfil aún se está cargando (justo después del login)
  if (!profile) {
    return <div>Verificando permisos...</div>;
  }

  // --- LÓGICA DE ENRUTAMIENTO DEFINITIVA ---
  // Check if user is super admin first
  if (profile.is_super_admin) {
    return (
      <Router>
        <AdminDashboard />
      </Router>
    );
  }

  // For non-super admin users, check user_roles table
  const getUserRole = async (userId: string): Promise<string | null> => {
    try {
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.warn("Error getting user role:", error);
        return null;
      }
      
      return roleData?.role || null;
    } catch (err) {
      console.error("Error in getUserRole:", err);
      return null;
    }
  };

  // For now, default to AgentDashboard for authenticated users
  // Later we can enhance this with proper role checking
  return (
    <Router>
      <AgentDashboard />
    </Router>
  );
}