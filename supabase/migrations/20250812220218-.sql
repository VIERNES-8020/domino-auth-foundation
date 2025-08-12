-- Harden function search_path for security
CREATE OR REPLACE FUNCTION public.get_agent_public_stats(_agent_id uuid)
RETURNS TABLE(average_rating numeric, total_ratings integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(AVG((ar.trato_rating + ar.asesoramiento_rating) / 2.0), 0)::numeric AS average_rating,
         COUNT(*)::int AS total_ratings
  FROM public.agent_ratings ar
  WHERE ar.agent_id = _agent_id;
$$;

CREATE OR REPLACE FUNCTION public.get_agent_properties_secure(_agent_id uuid)
RETURNS SETOF public.properties
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
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

REVOKE ALL ON FUNCTION public.get_agent_public_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_agent_public_stats(uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.get_agent_properties_secure(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_agent_properties_secure(uuid) TO authenticated;