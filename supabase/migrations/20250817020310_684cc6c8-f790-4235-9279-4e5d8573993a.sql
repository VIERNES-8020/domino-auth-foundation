-- Create storage buckets for property files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('property-images', 'property-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
  ('property-videos', 'property-videos', true, 52428800, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
  ('property-plans', 'property-plans', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']);

-- Create RLS policies for property images
CREATE POLICY "Anyone can view property images" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their property images" ON storage.objects
FOR UPDATE USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their property images" ON storage.objects
FOR DELETE USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Create RLS policies for property videos
CREATE POLICY "Anyone can view property videos" ON storage.objects
FOR SELECT USING (bucket_id = 'property-videos');

CREATE POLICY "Authenticated users can upload property videos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'property-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their property videos" ON storage.objects
FOR UPDATE USING (bucket_id = 'property-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their property videos" ON storage.objects
FOR DELETE USING (bucket_id = 'property-videos' AND auth.role() = 'authenticated');

-- Create RLS policies for property plans
CREATE POLICY "Anyone can view property plans" ON storage.objects
FOR SELECT USING (bucket_id = 'property-plans');

CREATE POLICY "Authenticated users can upload property plans" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'property-plans' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their property plans" ON storage.objects
FOR UPDATE USING (bucket_id = 'property-plans' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their property plans" ON storage.objects
FOR DELETE USING (bucket_id = 'property-plans' AND auth.role() = 'authenticated');