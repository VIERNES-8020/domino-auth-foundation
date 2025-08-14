import { useState, useEffect, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAndRole = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setLoading(false);
          return;
        }

        setUser(session.user);

        // Get user role from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (roleData && !roleError) {
          // Map database roles to display roles
          const displayRole = roleData.role === 'super_admin' || roleData.role === 'admin' 
            ? 'Super Administrador' 
            : 'Agente Inmobiliario';
          setUserRole(displayRole);
        } else {
          // Fallback to metadata role if no role in user_roles table
          const metadataRole = session.user.user_metadata?.role;
          setUserRole(metadataRole || 'Agente Inmobiliario');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserAndRole();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Re-check role when auth state changes
        checkUserAndRole();
      } else {
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  // Not authenticated - redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // User doesn't have required role - show access denied
  if (userRole !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-4">
            No tienes permisos para acceder a esta página.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Tu rol actual: {userRole || 'Sin rol asignado'}
          </p>
          <div className="space-x-4">
            <button 
              onClick={() => window.history.back()} 
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
            >
              Volver
            </button>
            <button 
              onClick={() => window.location.href = '/'} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User has correct role - render children
  return <>{children}</>;
};

export default ProtectedRoute;