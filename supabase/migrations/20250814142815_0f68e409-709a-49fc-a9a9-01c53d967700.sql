-- Create storage buckets for property videos and plans
INSERT INTO storage.buckets (id, name, public) VALUES ('property-videos', 'property-videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('property-plans', 'property-plans', true);

-- Create policies for property videos
CREATE POLICY "Property videos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-videos');

CREATE POLICY "Authenticated users can upload property videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'property-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own property videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'property-videos' AND auth.role() = 'authenticated');

-- Create policies for property plans
CREATE POLICY "Property plans are publicly accessible" 
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