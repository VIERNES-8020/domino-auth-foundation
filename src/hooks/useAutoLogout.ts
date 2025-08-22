import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export const useAutoLogout = () => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const activityEventsRef = useRef<string[]>([
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ]);

  const resetTimer = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        await supabase.auth.signOut();
        toast.info('Sesión cerrada por inactividad', {
          description: 'Has sido desconectado automáticamente después de 10 minutos de inactividad.',
        });
        window.location.href = '/auth';
      } catch (error) {
        console.error('Error during auto logout:', error);
      }
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Check if user is authenticated before setting up the timer
    const checkAuthAndSetupTimer = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User is authenticated, set up activity monitoring
        resetTimer();
        
        // Add event listeners for user activity
        const handleActivity = () => resetTimer();
        
        activityEventsRef.current.forEach(event => {
          document.addEventListener(event, handleActivity, true);
        });

        // Monitor auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_OUT' || !session) {
            // User signed out, clear timer and remove listeners
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            activityEventsRef.current.forEach(eventType => {
              document.removeEventListener(eventType, handleActivity, true);
            });
          } else if (event === 'SIGNED_IN') {
            // User signed in, restart timer
            resetTimer();
          }
        });

        return () => {
          // Cleanup
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          activityEventsRef.current.forEach(eventType => {
            document.removeEventListener(eventType, handleActivity, true);
          });
          subscription.unsubscribe();
        };
      }
    };

    checkAuthAndSetupTimer();
  }, []);

  return null; // This hook doesn't return anything, it just manages the auto-logout
};