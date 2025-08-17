import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient'; // Asegúrate de que la ruta sea correcta
import { Session, User } from '@supabase/supabase-js';

// Importa TODOS los componentes de tus páginas
import AuthPage from './pages/AuthPage';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PublicPortal from './pages/PublicPortal';

// Componente simple para mostrar "Acceso Denegado"
const AccessDenied = () => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h1>Acceso Denegado</h1>
    <p>No tienes los permisos necesarios para acceder a esta página.</p>
  </div>
);

interface Profile {
  id: string;
  role: string;
}

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Establece el estado inicial al cargar
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchUserProfile(session.user);
      }
      setLoading(false);
    };
    initializeSession();

    // Escucha cambios futuros (login/logout)
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

  // Función CLAVE para obtener el ROL del usuario
  const fetchUserProfile = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) {
      console.error("Error crítico al obtener el perfil:", error);
      // Si hay un error, cerramos sesión para evitar bucles
      await supabase.auth.signOut();
    }
  };
  
  if (loading) {
    return <div>Cargando y verificando sesión...</div>;
  }

  if (!session) {
    // Si no hay sesión, siempre va a la página de autenticación
    return <AuthPage />;
  }

  // Si hay sesión pero el perfil aún no se carga, esperamos
  if (!profile) {
    return <div>Verificando permisos...</div>;
  }

  // --- LÓGICA DE ENRUTAMIENTO DEFINITIVA ---
  switch (profile.role) {
    case 'Super Administrador':
      return <AdminDashboard />;
    case 'Agente Inmobiliario':
      return <AgentDashboard />;
    case 'Cliente':
      return <PublicPortal />;
    default:
      // Si el rol es desconocido, negamos el acceso
      return <AccessDenied />;
  }
}