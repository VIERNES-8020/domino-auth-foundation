-- Fix remaining security warnings from linter

-- 1. Fix search_path for existing functions that don't have it set properly
-- Update the touch_last_updated function to have secure search_path
DROP FUNCTION IF EXISTS public.touch_last_updated();
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

-- Update the get_franchise_leaderboard function to have secure search_path  
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

-- Update the has_role function to ensure secure search_path
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

-- 2. Check for tables without RLS and enable it
-- Enable RLS on any tables in public schema that might not have it
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns')
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', rec.schemaname, rec.tablename);
  END LOOP;
END
$$;