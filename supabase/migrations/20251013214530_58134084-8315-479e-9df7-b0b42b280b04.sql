-- Crear política para que office managers puedan ver todas las propiedades
CREATE POLICY "Office managers can view all properties"
ON public.properties
FOR SELECT
TO public
USING (
  public.user_has_role_by_name(auth.uid(), 'ADMINISTRACIÓN')
);

-- Crear política para que office managers puedan actualizar propiedades (aprobar/rechazar)
CREATE POLICY "Office managers can update properties"
ON public.properties
FOR UPDATE
TO public
USING (
  public.user_has_role_by_name(auth.uid(), 'ADMINISTRACIÓN')
)
WITH CHECK (
  public.user_has_role_by_name(auth.uid(), 'ADMINISTRACIÓN')
);