-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to read only approved listings
DROP POLICY IF EXISTS "Cualquier usuario puede ver propiedades aprobadas" ON public.properties;
CREATE POLICY "Cualquier usuario puede ver propiedades aprobadas"
ON public.properties
FOR SELECT
USING (status = 'approved');