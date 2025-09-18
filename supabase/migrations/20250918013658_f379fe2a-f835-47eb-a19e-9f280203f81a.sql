-- Permitir a Super Admin VER todas las citas y notificaciones de agentes
DO $$ BEGIN
  -- Super Admin puede ver todas las visitas (property_visits)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'property_visits' 
      AND policyname = 'Super admins can view all property visits'
  ) THEN
    CREATE POLICY "Super admins can view all property visits"
    ON public.property_visits
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()
      )
    );
  END IF;

  -- Super Admin puede ver todas las notificaciones de agentes (agent_notifications)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'agent_notifications' 
      AND policyname = 'Super admins can view all agent notifications'
  ) THEN
    CREATE POLICY "Super admins can view all agent notifications"
    ON public.agent_notifications
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()
      )
    );
  END IF;
END $$;