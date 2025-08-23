-- Fix storage buckets configuration and policies
UPDATE storage.buckets SET public = true WHERE id = 'property-videos';

-- Drop existing policies and recreate them properly
DROP POLICY IF EXISTS "Agents can upload their own property videos" ON storage.objects;
DROP POLICY IF EXISTS "Agents can view their own property videos" ON storage.objects;
DROP POLICY IF EXISTS "Plans are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Agents can upload property plans" ON storage.objects;

-- Create comprehensive storage policies for property videos (now public)
CREATE POLICY "Property videos are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-videos');

CREATE POLICY "Authenticated users can upload property videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'property-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update property videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'property-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete property videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'property-videos' AND auth.uid() IS NOT NULL);

-- Create comprehensive storage policies for property plans
CREATE POLICY "Property plans are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-plans');

CREATE POLICY "Authenticated users can upload property plans" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'property-plans' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update property plans" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'property-plans' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete property plans" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'property-plans' AND auth.uid() IS NOT NULL);

-- Create comprehensive storage policies for property images
CREATE POLICY "Property images are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update property images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete property images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);