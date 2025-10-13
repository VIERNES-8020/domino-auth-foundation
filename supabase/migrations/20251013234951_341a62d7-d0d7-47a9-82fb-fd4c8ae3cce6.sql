-- Crear tabla para proyectos ARXIS
CREATE TABLE IF NOT EXISTS public.arxis_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL CHECK (project_type IN ('Nuevo', 'Remodelación', 'Mantenimiento', 'Asesoría técnica')),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'on_hold', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  budget NUMERIC,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla para reportes técnicos
CREATE TABLE IF NOT EXISTS public.arxis_technical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.arxis_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  report_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  document_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla para mantenimientos programados
CREATE TABLE IF NOT EXISTS public.arxis_maintenances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.arxis_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  assigned_to TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en las tablas
ALTER TABLE public.arxis_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arxis_technical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arxis_maintenances ENABLE ROW LEVEL SECURITY;

-- Políticas para arxis_projects
CREATE POLICY "ARXIS managers can view all projects"
ON public.arxis_projects FOR SELECT
TO authenticated
USING (public.user_has_role_by_name(auth.uid(), 'ARXIS'));

CREATE POLICY "ARXIS managers can insert projects"
ON public.arxis_projects FOR INSERT
TO authenticated
WITH CHECK (public.user_has_role_by_name(auth.uid(), 'ARXIS'));

CREATE POLICY "ARXIS managers can update projects"
ON public.arxis_projects FOR UPDATE
TO authenticated
USING (public.user_has_role_by_name(auth.uid(), 'ARXIS'))
WITH CHECK (public.user_has_role_by_name(auth.uid(), 'ARXIS'));

CREATE POLICY "ARXIS managers can delete projects"
ON public.arxis_projects FOR DELETE
TO authenticated
USING (public.user_has_role_by_name(auth.uid(), 'ARXIS'));

-- Políticas para arxis_technical_reports
CREATE POLICY "ARXIS managers can view all reports"
ON public.arxis_technical_reports FOR SELECT
TO authenticated
USING (public.user_has_role_by_name(auth.uid(), 'ARXIS'));

CREATE POLICY "ARXIS managers can insert reports"
ON public.arxis_technical_reports FOR INSERT
TO authenticated
WITH CHECK (public.user_has_role_by_name(auth.uid(), 'ARXIS'));

CREATE POLICY "ARXIS managers can update reports"
ON public.arxis_technical_reports FOR UPDATE
TO authenticated
USING (public.user_has_role_by_name(auth.uid(), 'ARXIS'))
WITH CHECK (public.user_has_role_by_name(auth.uid(), 'ARXIS'));

CREATE POLICY "ARXIS managers can delete reports"
ON public.arxis_technical_reports FOR DELETE
TO authenticated
USING (public.user_has_role_by_name(auth.uid(), 'ARXIS'));

-- Políticas para arxis_maintenances
CREATE POLICY "ARXIS managers can view all maintenances"
ON public.arxis_maintenances FOR SELECT
TO authenticated
USING (public.user_has_role_by_name(auth.uid(), 'ARXIS'));

CREATE POLICY "ARXIS managers can insert maintenances"
ON public.arxis_maintenances FOR INSERT
TO authenticated
WITH CHECK (public.user_has_role_by_name(auth.uid(), 'ARXIS'));

CREATE POLICY "ARXIS managers can update maintenances"
ON public.arxis_maintenances FOR UPDATE
TO authenticated
USING (public.user_has_role_by_name(auth.uid(), 'ARXIS'))
WITH CHECK (public.user_has_role_by_name(auth.uid(), 'ARXIS'));

CREATE POLICY "ARXIS managers can delete maintenances"
ON public.arxis_maintenances FOR DELETE
TO authenticated
USING (public.user_has_role_by_name(auth.uid(), 'ARXIS'));

-- Política para permitir eliminar solicitudes de franquicia
CREATE POLICY "ARXIS managers can delete franchise applications"
ON public.franchise_applications FOR DELETE
TO authenticated
USING (public.user_has_role_by_name(auth.uid(), 'ARXIS'));