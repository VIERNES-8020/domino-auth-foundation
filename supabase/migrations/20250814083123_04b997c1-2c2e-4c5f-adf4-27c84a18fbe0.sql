-- Create storage buckets for file management
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('property-images', 'property-images', true),
  ('property-plans', 'property-plans', true),
  ('watermarks', 'watermarks', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for property images
CREATE POLICY "Anyone can view property images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own property images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own property images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Storage policies for property plans  
CREATE POLICY "Anyone can view property plans" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-plans');

CREATE POLICY "Authenticated users can upload property plans" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'property-plans' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own property plans" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'property-plans' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own property plans" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'property-plans' AND auth.role() = 'authenticated');

-- Storage policies for watermarks (admin only)
CREATE POLICY "Anyone can view watermarks" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'watermarks');

CREATE POLICY "Super admins can upload watermarks" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'watermarks' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
);

CREATE POLICY "Super admins can update watermarks" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'watermarks' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
);

CREATE POLICY "Super admins can delete watermarks" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'watermarks' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
);

-- Update properties table to ensure correct property types
UPDATE properties 
SET property_type = CASE 
  WHEN property_type = 'house' THEN 'casa'
  WHEN property_type = 'apartment' THEN 'departamento'  
  WHEN property_type = 'land' THEN 'terreno'
  WHEN property_type = 'office' THEN 'oficina'
  WHEN property_type = 'local_comercial' THEN 'local_comercial'
  ELSE property_type
END
WHERE property_type IN ('house', 'apartment', 'land', 'office');

-- Add archive reason field for better tracking
ALTER TABLE properties ADD COLUMN IF NOT EXISTS archive_reason TEXT;