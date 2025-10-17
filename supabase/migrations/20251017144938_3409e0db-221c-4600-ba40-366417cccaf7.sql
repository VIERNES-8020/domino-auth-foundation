-- Permitir que usuarios no autenticados vean perfiles públicos de agentes
CREATE POLICY "Public can view agent profiles"
ON profiles
FOR SELECT
USING (agent_code IS NOT NULL);