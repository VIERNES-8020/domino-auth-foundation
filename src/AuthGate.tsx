import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Importa TODAS las páginas que hemos creado
import AuthForm from './components/auth/AuthForm';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AccessDenied from './pages/AccessDenied';
import Index from './pages/Index'; // Tu página de inicio pública

interface Profile {
  id: string;
  role: string;
}

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (user: User) => {
    try {
      setLoading(true);
      
      // First check profiles table for super admin flag
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();
      
      if (profileData?.is_super_admin) {
        setProfile({ id: user.id, role: 'super_admin' });
        return;
      }
      
      // Then check user_roles for other roles
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      const role = data?.role || 'user';
      setProfile({ id: user.id, role });
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };
  
  // Lógica de Renderizado y Enrutamiento
  // Usaremos un enfoque de renderizado condicional en lugar de cambiar la URL,
  // ya que esto es más compatible con la estructura simple de Vite.

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!session) {
    // Si no hay sesión, siempre mostramos la página de autenticación/registro.
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <AuthForm />
      </div>
    );
  }

  // Si hay sesión pero el perfil aún se está cargando
  if (!profile) {
      return <div>Verificando permisos...</div>;
  }

  // Una vez que tenemos la sesión Y el perfil, decidimos qué panel mostrar
  switch (profile.role) {
    case 'super_admin':
    case 'admin':
    case 'Super Administrador':
      return <AdminDashboard />;
    case 'agent':
    case 'Agente Inmobiliario':
      return <AgentDashboard />;
    // ... añadir casos para otros roles aquí ...
    default:
      // Si el rol no tiene un panel, o es un simple cliente, se queda en el portal público.
      return <Index />;
  }
}