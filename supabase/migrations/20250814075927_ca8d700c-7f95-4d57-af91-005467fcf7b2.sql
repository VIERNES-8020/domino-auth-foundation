-- Drop the view and recreate as a function to avoid RLS issues
DROP VIEW IF EXISTS public.platform_metrics;

-- Create a function instead of a view for better security
CREATE OR REPLACE FUNCTION public.get_platform_metrics()
RETURNS TABLE(
  total_agents BIGINT,
  total_properties BIGINT,
  total_franchises BIGINT,
  avg_property_price NUMERIC,
  monthly_sales BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'agent'))::BIGINT as total_agents,
    (SELECT COUNT(*) FROM public.properties WHERE status = 'approved' AND (is_archived IS FALSE OR is_archived IS NULL))::BIGINT as total_properties,
    (SELECT COUNT(DISTINCT franchise_id) FROM public.profiles WHERE franchise_id IS NOT NULL)::BIGINT as total_franchises,
    (SELECT AVG(price) FROM public.properties WHERE status = 'approved' AND price IS NOT NULL) as avg_property_price,
    (SELECT COUNT(*) FROM public.properties WHERE status = 'approved' AND created_at >= date_trunc('month', current_date))::BIGINT as monthly_sales;
END;
$$;