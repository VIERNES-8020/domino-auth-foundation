-- Fix RLS warning for spatial_ref_sys table
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to spatial reference systems
CREATE POLICY "Public read access to spatial reference systems" 
ON public.spatial_ref_sys 
FOR SELECT 
USING (true);