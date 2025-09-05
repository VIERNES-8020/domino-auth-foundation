-- Fix search_path security issues without breaking dependencies

-- 1. Update existing functions to have secure search_path (use CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.touch_last_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  new.last_updated = now();
  return new;
END;
$$;

-- 2. Update the get_franchise_leaderboard function
CREATE OR REPLACE FUNCTION public.get_franchise_leaderboard(franchise_id_param uuid)
RETURNS TABLE(rank bigint, name text, average_rating numeric, sales_month integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rank() OVER (ORDER BY ap.average_rating DESC, ap.properties_sold_month DESC, ap.last_updated DESC) as rank,
    coalesce(nullif(p.full_name, ''), ('Agente ' || substring(ap.agent_id::text, 1, 8))) as name,
    ap.average_rating,
    ap.properties_sold_month as sales_month
  FROM public.agent_performance ap
  LEFT JOIN public.profiles p ON ap.agent_id = p.id
  WHERE (franchise_id_param IS NULL OR p.franchise_id = franchise_id_param)
  ORDER BY rank;
END;
$$;

-- 3. Update the has_role function  
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;