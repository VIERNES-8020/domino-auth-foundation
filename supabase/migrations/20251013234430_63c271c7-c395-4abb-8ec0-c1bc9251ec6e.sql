-- Agregar política RLS para que usuarios con rol ARXIS puedan ver franchise_applications
CREATE POLICY "ARXIS managers can view all franchise applications"
ON public.franchise_applications
FOR SELECT
TO authenticated
USING (
  public.user_has_role_by_name(auth.uid(), 'ARXIS')
);

-- También permitir que actualicen el estado de las solicitudes
CREATE POLICY "ARXIS managers can update franchise applications"
ON public.franchise_applications
FOR UPDATE
TO authenticated
USING (
  public.user_has_role_by_name(auth.uid(), 'ARXIS')
)
WITH CHECK (
  public.user_has_role_by_name(auth.uid(), 'ARXIS')
);