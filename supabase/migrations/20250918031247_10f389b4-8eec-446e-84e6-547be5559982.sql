-- Allow super admins to read all agent leads so Admin Dashboard can detect assignments
CREATE POLICY "Super admins can view all agent leads"
ON public.agent_leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()
  )
);