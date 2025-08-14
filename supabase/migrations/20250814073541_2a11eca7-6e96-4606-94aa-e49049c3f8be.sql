-- Add constructed area field to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS constructed_area_m2 numeric;

-- Update the existing amenities to replace "Barbacoa" with "Parrillero"
-- First let's check if we have amenities data in the amenities table
DO $$
BEGIN
  -- Update amenities if the table exists and has "Barbacoa"
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'amenities') THEN
    UPDATE public.amenities SET name = 'Parrillero' WHERE name = 'Barbacoa';
  END IF;
END $$;

-- Create storage bucket for property multimedia if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-videos', 'property-videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-plans', 'property-plans', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for property images
CREATE POLICY IF NOT EXISTS "Agents can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Public can view property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY IF NOT EXISTS "Agents can update their property images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Agents can delete their property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for property videos
CREATE POLICY IF NOT EXISTS "Agents can upload property videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Public can view property videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-videos');

CREATE POLICY IF NOT EXISTS "Agents can update their property videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Agents can delete their property videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for property plans
CREATE POLICY IF NOT EXISTS "Agents can upload property plans"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-plans' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Public can view property plans"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-plans');

CREATE POLICY IF NOT EXISTS "Agents can update their property plans"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-plans' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Agents can delete their property plans"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-plans' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);