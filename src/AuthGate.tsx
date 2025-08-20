import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Importa TODOS los componentes de tus páginas
import AuthPage from './pages/AuthPage';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import HomePage from './pages/HomePage'; // Tu página de inicio pública

interface Profile {
  id: string;
  role: string;
}

const AccessDenied = () => <div>Acceso Denegado</div>;

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
      console.error("Error al obtener perfil:", error);
      await supabase.auth.signOut();
    }
  };
  
  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!session) {
    // Si no hay sesión, mostramos la página de autenticación/registro
    return <AuthPage />;
  }

  // Si hay sesión, pero el perfil aún se está cargando
  if (!profile) {
    return <div>Verificando permisos...</div>;
  }

  // --- LÓGICA DE ENRUTAMIENTO DEFINITIVA ---
  switch (profile.role) {
    case 'Super Administrador':
      return <AdminDashboard />;
    case 'Agente Inmobiliario':
      return <AgentDashboard />;
    // ... otros roles ...
    default:
      // Cualquier otro rol (como 'Cliente') va al portal público
      return <HomePage />;
  }
}