-- Eliminar la política problemática
DROP POLICY IF EXISTS "Supervisors can update agent profiles" ON public.profiles;

-- Crear función security definer para verificar rol por nombre
CREATE OR REPLACE FUNCTION public.user_has_role_by_name(_user_id uuid, _role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.roles r ON p.rol_id = r.id
    WHERE p.id = _user_id
      AND r.nombre = _role_name
  )
$$;

-- Recrear la política usando la función security definer
CREATE POLICY "Supervisors can update agent profiles"
ON public.profiles
FOR UPDATE
TO public
USING (
  -- El usuario debe tener rol de SUPERVISIÓN
  public.user_has_role_by_name(auth.uid(), 'SUPERVISIÓN')
  -- Y solo puede actualizar perfiles que tengan agent_code (son agentes)
  AND agent_code IS NOT NULL
)
WITH CHECK (
  -- El usuario debe tener rol de SUPERVISIÓN
  public.user_has_role_by_name(auth.uid(), 'SUPERVISIÓN')
  -- Y solo puede actualizar perfiles que tengan agent_code (son agentes)
  AND agent_code IS NOT NULL
);