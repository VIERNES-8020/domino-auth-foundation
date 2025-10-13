
-- Permitir a usuarios con rol SUPERVISIÓN actualizar perfiles de agentes
CREATE POLICY "Supervisors can update agent profiles"
ON public.profiles
FOR UPDATE
TO public
USING (
  -- El usuario debe tener rol de SUPERVISIÓN
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.rol_id = r.id
    WHERE p.id = auth.uid() 
    AND r.nombre = 'SUPERVISIÓN'
  )
  -- Y solo puede actualizar perfiles que tengan agent_code (son agentes)
  AND agent_code IS NOT NULL
)
WITH CHECK (
  -- El usuario debe tener rol de SUPERVISIÓN
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.rol_id = r.id
    WHERE p.id = auth.uid() 
    AND r.nombre = 'SUPERVISIÓN'
  )
  -- Y solo puede actualizar perfiles que tengan agent_code (son agentes)
  AND agent_code IS NOT NULL
);
