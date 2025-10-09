-- Crear tabla de roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Crear tabla de permisos
CREATE TABLE IF NOT EXISTS public.permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Crear tabla de relación entre roles y permisos
CREATE TABLE IF NOT EXISTS public.rol_permisos (
  rol_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permiso_id UUID NOT NULL REFERENCES public.permisos(id) ON DELETE CASCADE,
  PRIMARY KEY (rol_id, permiso_id)
);

-- Agregar columna rol_id a profiles (relación con roles)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rol_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rol_permisos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para roles (solo super admin puede modificar)
CREATE POLICY "Super admins pueden gestionar roles"
ON public.roles
FOR ALL
USING (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()));

CREATE POLICY "Usuarios autenticados pueden ver roles"
ON public.roles
FOR SELECT
USING (auth.role() = 'authenticated');

-- Políticas RLS para permisos (solo super admin puede modificar)
CREATE POLICY "Super admins pueden gestionar permisos"
ON public.permisos
FOR ALL
USING (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()));

CREATE POLICY "Usuarios autenticados pueden ver permisos"
ON public.permisos
FOR SELECT
USING (auth.role() = 'authenticated');

-- Políticas RLS para rol_permisos (solo super admin puede modificar)
CREATE POLICY "Super admins pueden gestionar rol_permisos"
ON public.rol_permisos
FOR ALL
USING (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()));

CREATE POLICY "Usuarios autenticados pueden ver rol_permisos"
ON public.rol_permisos
FOR SELECT
USING (auth.role() = 'authenticated');

-- Insertar roles predefinidos
INSERT INTO public.roles (nombre, descripcion) VALUES
  ('SUPERADMIN', 'Acceso total al sistema'),
  ('CONTABILIDAD', 'Solo reportes y datos financieros'),
  ('SUPERVISIÓN', 'Control de agentes, aprobaciones y documentación'),
  ('ADMINISTRACIÓN', 'Control local de contabilidad y operaciones (Encargado de Oficina)'),
  ('AGENTE', 'Carga de propiedades, solicitudes y gestión básica')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar permisos básicos predefinidos
INSERT INTO public.permisos (nombre, descripcion) VALUES
  ('gestionar_usuarios', 'Crear, editar y eliminar usuarios'),
  ('gestionar_propiedades', 'Crear, editar y eliminar propiedades'),
  ('ver_reportes', 'Acceso a reportes y estadísticas'),
  ('aprobar_documentos', 'Aprobar documentación y cierres'),
  ('gestionar_agentes', 'Supervisar y gestionar agentes'),
  ('gestionar_finanzas', 'Acceso a datos financieros y contabilidad'),
  ('configurar_sistema', 'Acceso a configuración global'),
  ('ver_propiedades', 'Visualizar propiedades'),
  ('programar_visitas', 'Agendar visitas a propiedades'),
  ('gestionar_leads', 'Administrar leads y clientes')
ON CONFLICT (nombre) DO NOTHING;

-- Asignar permisos a roles (configuración inicial básica)
-- SUPERADMIN - todos los permisos
INSERT INTO public.rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id 
FROM public.roles r
CROSS JOIN public.permisos p
WHERE r.nombre = 'SUPERADMIN'
ON CONFLICT DO NOTHING;

-- CONTABILIDAD - solo reportes y finanzas
INSERT INTO public.rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id 
FROM public.roles r, public.permisos p
WHERE r.nombre = 'CONTABILIDAD' 
AND p.nombre IN ('ver_reportes', 'gestionar_finanzas')
ON CONFLICT DO NOTHING;

-- SUPERVISIÓN - control de agentes y aprobaciones
INSERT INTO public.rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id 
FROM public.roles r, public.permisos p
WHERE r.nombre = 'SUPERVISIÓN' 
AND p.nombre IN ('gestionar_agentes', 'aprobar_documentos', 'ver_reportes', 'ver_propiedades')
ON CONFLICT DO NOTHING;

-- ADMINISTRACIÓN - control local
INSERT INTO public.rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id 
FROM public.roles r, public.permisos p
WHERE r.nombre = 'ADMINISTRACIÓN' 
AND p.nombre IN ('gestionar_finanzas', 'ver_reportes', 'gestionar_agentes', 'ver_propiedades')
ON CONFLICT DO NOTHING;

-- AGENTE - gestión básica
INSERT INTO public.rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id 
FROM public.roles r, public.permisos p
WHERE r.nombre = 'AGENTE' 
AND p.nombre IN ('gestionar_propiedades', 'ver_propiedades', 'programar_visitas', 'gestionar_leads')
ON CONFLICT DO NOTHING;