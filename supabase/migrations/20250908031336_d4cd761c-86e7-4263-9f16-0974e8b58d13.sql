-- Add UPDATE policy for super admins to manage franchise applications
CREATE POLICY "Super admins can update franchise applications" 
ON franchise_applications 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM super_admins sa
  WHERE (sa.user_id = auth.uid())))
WITH CHECK (EXISTS ( SELECT 1
   FROM super_admins sa
  WHERE (sa.user_id = auth.uid())));