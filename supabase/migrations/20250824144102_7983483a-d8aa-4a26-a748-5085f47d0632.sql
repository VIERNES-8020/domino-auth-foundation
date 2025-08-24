-- Create additional storage buckets for specific file types
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('property-images', 'property-images', true),
  ('property-plans', 'property-plans', true),
  ('property-videos', 'property-videos', true);

-- Create RLS policies for property images
CREATE POLICY "Anyone can view property images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update property images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete property images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Create RLS policies for property plans
CREATE POLICY "Anyone can view property plans" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-plans');

CREATE POLICY "Authenticated users can upload property plans" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'property-plans' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update property plans" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'property-plans' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete property plans" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'property-plans' AND auth.role() = 'authenticated');

-- Create RLS policies for property videos
CREATE POLICY "Anyone can view property videos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-videos');

CREATE POLICY "Authenticated users can upload property videos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'property-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update property videos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'property-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete property videos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'property-videos' AND auth.role() = 'authenticated');