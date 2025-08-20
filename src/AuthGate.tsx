import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

  // Función CLAVE para obtener el ROL del usuario
  const fetchUserProfile = async (user: User) => {
    try {
      // First check profiles table for super admin flag
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, is_super_admin, full_name')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileData?.is_super_admin === true) {
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
      
      if (roleData?.role === 'agent') {
        setProfile({ 
          id: user.id, 
          role: 'Agente Inmobiliario' 
        });
        return;
      }
      
      // If no profile exists, create one with default client role
      if (!profileData) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ 
            id: user.id, 
            full_name: user.email || 'Usuario',
            is_super_admin: false 
          })
          .select('id, is_super_admin, full_name')
          .single();
        
        if (insertError) throw insertError;
        
        setProfile({ 
          id: newProfile.id, 
          role: 'Cliente' 
        });
      } else {
        // Default to client role
        setProfile({ 
          id: profileData.id, 
          role: 'Cliente' 
        });
      }
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
    // Si no hay sesión, mostramos la página de autenticación/registro
    return (
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    );
  }

  // Si hay sesión, pero el perfil aún se está cargando
  if (!profile) {
    return <div>Verificando permisos...</div>;
  }

  // --- LÓGICA DE ENRUTAMIENTO DEFINITIVA ---
  return (
    <BrowserRouter>
      {(() => {
        switch (profile.role) {
          case 'Super Administrador':
            return <AdminDashboard />;
          case 'Agente Inmobiliario':
            return <AgentDashboard />;
          default:
            // Cualquier otro rol (como 'Cliente') va al portal público
            return <PublicPortal />;
        }
      })()}
    </BrowserRouter>
  );
}