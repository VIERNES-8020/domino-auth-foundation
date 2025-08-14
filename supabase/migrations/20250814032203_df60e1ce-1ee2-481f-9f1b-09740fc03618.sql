-- Add is_archived column to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Create index for better performance on archived properties queries
CREATE INDEX IF NOT EXISTS idx_properties_archived ON public.properties(is_archived);

-- Create franchises table for super admin management
CREATE TABLE IF NOT EXISTS public.franchises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on franchises
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;

-- Create policies for franchises
CREATE POLICY "Super admins can manage all franchises" 
ON public.franchises 
FOR ALL 
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

CREATE POLICY "Public can view franchises" 
ON public.franchises 
FOR SELECT 
USING (true);

-- Update properties policies to include archived filter for public viewing
DROP POLICY IF EXISTS "Cualquier usuario puede ver propiedades aprobadas" ON public.properties;

CREATE POLICY "Public can view approved and non-archived properties" 
ON public.properties 
FOR SELECT 
USING (status = 'approved'::text AND (is_archived IS FALSE OR is_archived IS NULL));

-- Super admins can view all properties including archived
CREATE POLICY "Super admins can view all properties" 
ON public.properties 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Create trigger to update franchises updated_at
CREATE TRIGGER update_franchises_updated_at
BEFORE UPDATE ON public.franchises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();