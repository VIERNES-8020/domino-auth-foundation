-- Create storage bucket for property files (images and documents)
INSERT INTO storage.buckets (id, name, public) VALUES ('property-files', 'property-files', true);

-- Create RLS policies for property files
CREATE POLICY "Anyone can view property files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-files');

CREATE POLICY "Authenticated users can upload property files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'property-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update property files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'property-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete property files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'property-files' AND auth.role() = 'authenticated');