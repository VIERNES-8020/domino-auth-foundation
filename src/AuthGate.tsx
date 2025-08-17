import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

// Importa TODOS los componentes de tus páginas
import AuthPage from './pages/AuthPage';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PublicPortal from './pages/PublicPortal';

interface Profile {
  id: string;
  role: string;
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
    }
  };
  
  if (loading) {
    return <div>Cargando y verificando sesión...</div>;
  }

  // Si no hay sesión, siempre mostramos la página de autenticación
  if (!session) {
    return <AuthPage />;
  }

  // Si hay sesión pero el perfil aún se está cargando (justo después del login)
  if (!profile) {
    return <div>Verificando permisos...</div>;
  }

  // --- LÓGICA DE ENRUTAMIENTO DEFINITIVA ---
  // Renderizamos el componente correcto basado en el rol
  switch (profile.role) {
    case 'Super Administrador':
      return <AdminDashboard />;
    case 'Agente Inmobiliario':
      return <AgentDashboard />;
    // ... añadir casos para otros roles aquí ...
    case 'Cliente':
        return <PublicPortal />; // Un cliente logueado ve el portal público
    default:
      // Si el rol no es reconocido, se le niega el acceso.
      return <AccessDenied />;
  }
}