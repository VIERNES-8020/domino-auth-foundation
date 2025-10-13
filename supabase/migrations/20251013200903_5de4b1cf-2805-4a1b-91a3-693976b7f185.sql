-- Crear política RLS para que usuarios autenticados (rol Contabilidad) puedan ver cierres validados
CREATE POLICY "contabilidad_puede_ver_cierres_validados"
ON sale_closures
FOR SELECT
TO authenticated
USING (
  status ILIKE '%validado%' OR 
  status ILIKE '%validated%'
);