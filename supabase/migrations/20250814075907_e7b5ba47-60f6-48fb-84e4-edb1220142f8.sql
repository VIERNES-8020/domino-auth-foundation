-- Fix routing by adding is_super_admin field to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Create trigger to set is_super_admin for existing super admins
CREATE OR REPLACE FUNCTION public.sync_super_admin_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- When a super_admin record is inserted or updated
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.profiles 
    SET is_super_admin = TRUE 
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
  
  -- When a super_admin record is deleted
  IF TG_OP = 'DELETE' THEN
    UPDATE public.profiles 
    SET is_super_admin = FALSE 
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists then create new one
DROP TRIGGER IF EXISTS sync_super_admin_flag_trigger ON public.super_admins;
CREATE TRIGGER sync_super_admin_flag_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.super_admins
  FOR EACH ROW EXECUTE FUNCTION public.sync_super_admin_flag();

-- Initialize existing super admins
UPDATE public.profiles 
SET is_super_admin = TRUE 
WHERE id IN (SELECT user_id FROM public.super_admins);

-- Update existing amenities to have "Parrillero" instead of "Barbacoa"
UPDATE public.amenities 
SET name = 'Parrillero', icon_svg = '<svg>chef-hat</svg>'
WHERE name = 'Barbacoa' OR name = 'Barbacoa/Parrillero' OR name ILIKE '%barbacoa%';

-- Insert "Parrillero" if it doesn't exist
INSERT INTO public.amenities (name, icon_svg) 
VALUES ('Parrillero', '<svg>chef-hat</svg>')
ON CONFLICT (name) DO NOTHING;

-- Create real metrics view for dynamic data
CREATE OR REPLACE VIEW public.platform_metrics AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'agent')) as total_agents,
  (SELECT COUNT(*) FROM public.properties WHERE status = 'approved' AND (is_archived IS FALSE OR is_archived IS NULL)) as total_properties,
  (SELECT COUNT(DISTINCT franchise_id) FROM public.profiles WHERE franchise_id IS NOT NULL) as total_franchises,
  (SELECT AVG(price) FROM public.properties WHERE status = 'approved' AND price IS NOT NULL) as avg_property_price,
  (SELECT COUNT(*) FROM public.properties WHERE status = 'approved' AND created_at >= date_trunc('month', current_date)) as monthly_sales;