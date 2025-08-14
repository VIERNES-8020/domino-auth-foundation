import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient'; // Asegúrate de que la ruta a tu cliente supabase sea correcta
import { Session, User } from '@supabase/supabase-js';

// Importa TODAS las páginas que hemos creado
import AuthPage from './pages/AuthPage';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AccessDeniedPage from './pages/AccessDeniedPage';
import PublicPortal from './pages/PublicPortal'; // Tu página de inicio pública

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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setProfile(data as Profile);
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
    return <AuthPage />;
  }

  // Si hay sesión pero el perfil aún se está cargando
  if (!profile) {
      return <div>Verificando permisos...</div>;
  }

  // Una vez que tenemos la sesión Y el perfil, decidimos qué panel mostrar
  switch (profile.role) {
    case 'Super Administrador':
      return <AdminDashboard />;
    case 'Agente Inmobiliario':
      return <AgentDashboard />;
    // ... añadir casos para otros roles aquí ...
    default:
      // Si el rol no tiene un panel, o es un simple cliente, se queda en el portal público.
      return <PublicPortal />;
  }
}