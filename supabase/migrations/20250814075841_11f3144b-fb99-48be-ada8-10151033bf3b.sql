-- Fix routing by adding is_super_admin field to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;

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

-- Create the trigger
CREATE TRIGGER sync_super_admin_flag_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.super_admins
  FOR EACH ROW EXECUTE FUNCTION public.sync_super_admin_flag();

-- Initialize existing super admins
UPDATE public.profiles 
SET is_super_admin = TRUE 
WHERE id IN (SELECT user_id FROM public.super_admins);

-- Create amenities table for Super Admin management
CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on amenities
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

-- RLS policies for amenities
CREATE POLICY "Anyone can view active amenities" ON public.amenities
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Super admins can manage amenities" ON public.amenities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_super_admin = TRUE
    )
  );

-- Insert default amenities with the corrected "Parrillero"
INSERT INTO public.amenities (name, icon_name) VALUES
  ('Piscina', 'waves'),
  ('Gimnasio', 'dumbbell'),
  ('Estacionamiento', 'car'),
  ('Jardín', 'trees'),
  ('Balcón', 'home'),
  ('Terraza', 'mountain'),
  ('Seguridad 24h', 'shield'),
  ('Ascensor', 'move-vertical'),
  ('Aire Acondicionado', 'thermometer'),
  ('Calefacción', 'flame'),
  ('Parrillero', 'chef-hat'),
  ('Cochera', 'garage')
ON CONFLICT (name) DO NOTHING;

-- Create real metrics view for dynamic data
CREATE OR REPLACE VIEW public.platform_metrics AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'agent')) as total_agents,
  (SELECT COUNT(*) FROM public.properties WHERE status = 'approved' AND (is_archived IS FALSE OR is_archived IS NULL)) as total_properties,
  (SELECT COUNT(DISTINCT franchise_id) FROM public.profiles WHERE franchise_id IS NOT NULL) as total_franchises,
  (SELECT AVG(price) FROM public.properties WHERE status = 'approved' AND price IS NOT NULL) as avg_property_price,
  (SELECT COUNT(*) FROM public.properties WHERE status = 'approved' AND created_at >= date_trunc('month', current_date)) as monthly_sales;

-- Create RLS policy for platform metrics
CREATE POLICY "Public can view platform metrics" ON public.platform_metrics
  FOR SELECT USING (TRUE);

-- Create update trigger for amenities
CREATE TRIGGER update_amenities_updated_at
  BEFORE UPDATE ON public.amenities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();