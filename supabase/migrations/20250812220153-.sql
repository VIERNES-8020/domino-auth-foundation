-- 1) Add new profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_card TEXT,
  ADD COLUMN IF NOT EXISTS corporate_phone TEXT,
  ADD COLUMN IF NOT EXISTS agent_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS experience_summary TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2) Collaboration notifications table
CREATE TABLE IF NOT EXISTS public.agent_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_agent_id uuid NOT NULL,
  from_agent_id uuid NOT NULL,
  property_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read boolean NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  -- Select: only recipient can read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_notifications' AND policyname = 'Recipient can view their notifications'
  ) THEN
    CREATE POLICY "Recipient can view their notifications"
    ON public.agent_notifications
    FOR SELECT
    USING (auth.uid() = to_agent_id);
  END IF;

  -- Insert: only sender can insert, and property must belong to recipient
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_notifications' AND policyname = 'Agents can create notifications for other agents properties'
  ) THEN
    CREATE POLICY "Agents can create notifications for other agents properties"
    ON public.agent_notifications
    FOR INSERT
    WITH CHECK (
      auth.uid() = from_agent_id AND EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = property_id AND p.agent_id = to_agent_id
      )
    );
  END IF;

  -- Update: recipient can mark as read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_notifications' AND policyname = 'Recipient can update their notifications'
  ) THEN
    CREATE POLICY "Recipient can update their notifications"
    ON public.agent_notifications
    FOR UPDATE
    USING (auth.uid() = to_agent_id)
    WITH CHECK (auth.uid() = to_agent_id);
  END IF;

  -- Delete: recipient can delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_notifications' AND policyname = 'Recipient can delete their notifications'
  ) THEN
    CREATE POLICY "Recipient can delete their notifications"
    ON public.agent_notifications
    FOR DELETE
    USING (auth.uid() = to_agent_id);
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_agent_notifications_to_agent ON public.agent_notifications (to_agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_property ON public.agent_notifications (property_id);

-- 3) Public stats function for agent ratings (bypass RLS safely)
CREATE OR REPLACE FUNCTION public.get_agent_public_stats(_agent_id uuid)
RETURNS TABLE(average_rating numeric, total_ratings integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(AVG((ar.trato_rating + ar.asesoramiento_rating) / 2.0), 0)::numeric AS average_rating,
         COUNT(*)::int AS total_ratings
  FROM public.agent_ratings ar
  WHERE ar.agent_id = _agent_id;
$$;

REVOKE ALL ON FUNCTION public.get_agent_public_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_agent_public_stats(uuid) TO anon, authenticated;

-- 4) Secure function to allow agents to view another agent's full properties (collaboration)
CREATE OR REPLACE FUNCTION public.get_agent_properties_secure(_agent_id uuid)
RETURNS SETOF public.properties
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow if caller is an agent (has an agent_code)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid() AND pr.agent_code IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT p.* FROM public.properties p
  WHERE p.agent_id = _agent_id
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_agent_properties_secure(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_agent_properties_secure(uuid) TO authenticated;