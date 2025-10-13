-- Agregar el nuevo rol "Administrador de ARXIS" en la tabla roles
INSERT INTO public.roles (nombre, descripcion)
VALUES (
  'ARXIS',
  'Control y gestión de proyectos de arquitectura, construcción y mantenimiento del departamento ARXIS.'
)
ON CONFLICT DO NOTHING;

-- Crear permisos específicos para el rol ARXIS
INSERT INTO public.permisos (nombre, descripcion)
VALUES 
  ('proyectos_arxis_full', 'Acceso completo a módulos de Proyectos ARXIS'),
  ('solicitudes_arxis_full', 'Acceso completo a Solicitudes ARXIS'),
  ('reportes_tecnicos_full', 'Acceso completo a Reportes Técnicos'),
  ('propiedades_read', 'Lectura de datos de propiedades (solo consulta)'),
  ('clientes_read', 'Lectura de datos de clientes (solo consulta)')
ON CONFLICT DO NOTHING;

-- Asignar permisos al rol ARXIS
INSERT INTO public.rol_permisos (rol_id, permiso_id)
SELECT 
  r.id as rol_id,
  p.id as permiso_id
FROM 
  public.roles r
CROSS JOIN 
  public.permisos p
WHERE 
  r.nombre = 'ARXIS'
  AND p.nombre IN (
    'proyectos_arxis_full',
    'solicitudes_arxis_full', 
    'reportes_tecnicos_full',
    'propiedades_read',
    'clientes_read'
  )
ON CONFLICT DO NOTHING;