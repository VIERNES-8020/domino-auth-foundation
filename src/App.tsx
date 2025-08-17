import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Importa TODOS los componentes de tus páginas
import AuthPage from './pages/AuthPage';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PublicPortal from './pages/PublicPortal';

interface Profile {
  id: string;
  is_super_admin: boolean;
}

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
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, is_super_admin')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.warn("Error getting profile:", profileError);
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

  if (!session) {
    return <AuthPage />;
  }

  if (profile) {
    if (profile.is_super_admin) {
      return <AdminDashboard />;
    }
    // For non-super admin users, default to agent dashboard
    // Later we can enhance this with proper role checking from user_roles
    return <AgentDashboard />;
  }

  // Si hay sesión pero aún no se ha cargado el perfil
  return <div>Verificando permisos...</div>;
}