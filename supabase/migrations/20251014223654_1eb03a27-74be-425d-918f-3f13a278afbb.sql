-- Permitir lectura pública de proyectos ARXIS completados
CREATE POLICY "Public can view completed ARXIS projects"
ON public.arxis_projects
FOR SELECT
USING (status = 'completed');