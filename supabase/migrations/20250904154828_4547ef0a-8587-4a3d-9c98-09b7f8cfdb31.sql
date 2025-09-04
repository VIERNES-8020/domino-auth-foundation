-- Allow super admins to manage user roles for other users
CREATE POLICY "Super admins can manage all user roles" 
ON public.user_roles 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM super_admins 
  WHERE super_admins.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM super_admins 
  WHERE super_admins.user_id = auth.uid()
));