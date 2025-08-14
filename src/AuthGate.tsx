import { useState, useEffect } from 'react';
import { supabase } from './integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import Index from './pages/Index'; // Auth page
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import HomePage from './pages/HomePage'; // Public portal

interface UserRole {
  role: string;
}

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthGate: Initializing...');
    
    const fetchSessionAndProfile = async () => {
      console.log('AuthGate: Fetching session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('AuthGate: Session:', session);
      
      setSession(session);
      if (session) {
        await fetchUserRole(session.user);
      }
      setLoading(false);
    };
    
    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthGate: Auth state changed:', event, session);
      setSession(session);
      if (session) {
        await fetchUserRole(session.user);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (user: User) => {
    try {
      console.log('AuthGate: Fetching user role for:', user.id);
      
      // First try user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (roleData && !roleError) {
        console.log('AuthGate: Role from user_roles:', roleData.role);
        setUserRole(roleData.role);
        return;
      }
      
      // Fallback to profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData && !profileError) {
        console.log('AuthGate: Profile data:', profileData);
        // Fallback to user metadata or default role
        const role = user.user_metadata?.role || 'Agente Inmobiliario';
        console.log('AuthGate: Role from metadata/default:', role);
        setUserRole(role);
        return;
      }
      
      console.warn('AuthGate: No role found, defaulting to Agente Inmobiliario');
      setUserRole('Agente Inmobiliario');
      
    } catch (error) {
      console.error("AuthGate: Error fetching user role:", error);
      // If we can't get the role, log out to prevent loops
      await supabase.auth.signOut();
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    console.log('AuthGate: No session, showing auth page');
    return <Index />;
  }

  if (userRole) {
    console.log('AuthGate: Routing user with role:', userRole);
    
    switch (userRole) {
      case 'Super Administrador':
        console.log('AuthGate: Routing to Admin Dashboard');
        return <AdminDashboard />;
      case 'Agente Inmobiliario':
        console.log('AuthGate: Routing to Agent Dashboard');
        return <AgentDashboard />;
      default:
        console.log('AuthGate: Unknown role, routing to public portal');
        return <HomePage />;
    }
  }
  
  // Show loading state while fetching role
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Verificando permisos...</p>
      </div>
    </div>
  );
}