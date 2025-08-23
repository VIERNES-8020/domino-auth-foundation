-- Create missing storage buckets for property videos and plans
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('property-videos', 'property-videos', true),
  ('property-plans', 'property-plans', true)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public;

-- Ensure buckets are public and accessible
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('property-videos', 'property-plans', 'property-images');