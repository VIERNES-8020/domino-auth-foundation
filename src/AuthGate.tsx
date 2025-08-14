import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import Index from './pages/Index'; // Auth page
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';

interface UserRole {
  role: string;
}

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthGate: Initializing...');
    
    const fetchSessionAndProfile = async () => {
      console.log('AuthGate: Fetching session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('AuthGate: Session:', session);
      
      setSession(session);
      if (session) {
        await fetchUserRole(session.user);
      } else {
        setLoading(false);
      }
    };
    
    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthGate: Auth state changed:', event, session);
      setSession(session);
      if (session) {
        setLoading(true);
        await fetchUserRole(session.user);
      } else {
        setUserRole(null);
        setLoading(false);
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
        
        // Map database roles to UI expectations
        const displayRole = roleData.role === 'super_admin' || roleData.role === 'admin' ? 'Super Administrador' : 'Agente Inmobiliario';
        setUserRole(displayRole);
        setLoading(false);
        
        if (roleData.role === 'super_admin' || roleData.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard/agent', { replace: true });
        }
        return;
      }
      
      // Fallback to user metadata if no role found in user_roles table
      const metadataRole = user.user_metadata?.role;
      if (metadataRole) {
        console.log('AuthGate: Role from metadata:', metadataRole);
        setUserRole(metadataRole);
        setLoading(false);
        
        // Redirect based on role
        if (metadataRole === 'Super Administrador') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard/agent', { replace: true });
        }
        return;
      }
      
      // Final fallback - default to agent role
      console.warn('AuthGate: No role found, defaulting to Agente Inmobiliario');
      setUserRole('Agente Inmobiliario');
      setLoading(false);
      navigate('/dashboard/agent', { replace: true });
      
    } catch (error) {
      console.error("AuthGate: Error fetching user role:", error);
      setLoading(false);
      // If we can't get the role, log out to prevent loops
      await supabase.auth.signOut();
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    console.log('AuthGate: No session, showing auth page');
    return <Index />;
  }

  // If we have session and role, show appropriate dashboard
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
        console.log('AuthGate: Default routing to Agent Dashboard');
        return <AgentDashboard />;
    }
  }
  
  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}