-- Fix: The trigger on property_change_requests uses touch_last_updated() which references 
-- NEW.last_updated, but the column is actually "updated_at". Replace with correct function.

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop the broken trigger and recreate with correct function
DROP TRIGGER IF EXISTS update_property_change_requests_updated_at ON public.property_change_requests;

CREATE TRIGGER update_property_change_requests_updated_at
  BEFORE UPDATE ON public.property_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();