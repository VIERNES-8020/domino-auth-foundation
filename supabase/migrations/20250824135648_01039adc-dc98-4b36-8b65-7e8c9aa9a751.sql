-- Crear buckets de storage necesarios para propiedades
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('property-images', 'property-images', true),
  ('property-plans', 'property-plans', true),
  ('property-videos', 'property-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para property-images bucket (imágenes públicas)
CREATE POLICY "Property images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their property images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their property images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

-- Políticas para property-plans bucket (planos públicos)
CREATE POLICY "Property plans are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-plans');

CREATE POLICY "Authenticated users can upload property plans" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-plans' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their property plans" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-plans' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their property plans" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-plans' 
  AND auth.role() = 'authenticated'
);

-- Políticas para property-videos bucket (videos públicos)
CREATE POLICY "Property videos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-videos');

CREATE POLICY "Authenticated users can upload property videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-videos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their property videos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-videos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their property videos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-videos' 
  AND auth.role() = 'authenticated'
);