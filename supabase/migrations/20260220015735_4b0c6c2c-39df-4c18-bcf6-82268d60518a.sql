CREATE POLICY "Super admins can update all properties"
ON public.properties
FOR UPDATE
USING (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid()));