-- Add super admin policies for arxis_projects
CREATE POLICY "Super admins can manage all arxis projects"
ON arxis_projects
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.user_id = auth.uid()
  )
);

-- Add super admin policies for arxis_technical_reports  
CREATE POLICY "Super admins can manage all arxis technical reports"
ON arxis_technical_reports
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.user_id = auth.uid()
  )
);

-- Add super admin policies for arxis_maintenances
CREATE POLICY "Super admins can manage all arxis maintenances"
ON arxis_maintenances
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.user_id = auth.uid()
  )
);