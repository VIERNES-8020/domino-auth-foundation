-- Add currency column for price
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS price_currency TEXT NOT NULL DEFAULT 'USD';

-- Create storage buckets for property media
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-plans', 'property-plans', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for property-images bucket
CREATE POLICY IF NOT EXISTS "Public read property images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY IF NOT EXISTS "Agents can upload property images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'property-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Agents can update their property images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'property-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Agents can delete their property images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'property-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for property-plans bucket (public read as well)
CREATE POLICY IF NOT EXISTS "Public read property plans"
ON storage.objects
FOR SELECT
USING (bucket_id = 'property-plans');

CREATE POLICY IF NOT EXISTS "Agents can upload property plans"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'property-plans'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Agents can update their property plans"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'property-plans'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Agents can delete their property plans"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'property-plans'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
