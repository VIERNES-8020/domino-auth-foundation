-- Allow office managers to view and validate sale closures
CREATE POLICY "Office managers can view all closures"
ON public.sale_closures
FOR SELECT
TO authenticated
USING (
  public.user_has_role_by_name(auth.uid(), 'ADMINISTRACIÓN')
);

CREATE POLICY "Office managers can validate closures"
ON public.sale_closures
FOR UPDATE
TO authenticated
USING (
  public.user_has_role_by_name(auth.uid(), 'ADMINISTRACIÓN')
)
WITH CHECK (
  public.user_has_role_by_name(auth.uid(), 'ADMINISTRACIÓN')
);