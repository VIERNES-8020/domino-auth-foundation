-- Allow super admins to update any profile
CREATE POLICY "Super admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1 
  FROM super_admins 
  WHERE super_admins.user_id = auth.uid()
));