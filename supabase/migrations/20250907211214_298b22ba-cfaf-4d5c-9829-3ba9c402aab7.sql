-- Verificar y crear el bucket franchise-docs si no existe
DO $$
BEGIN
  -- Intentar insertar el bucket, si ya existe, no hará nada
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('franchise-docs', 'franchise-docs', true)
  ON CONFLICT (id) DO NOTHING;
  
  -- Asegurar que el bucket sea público
  UPDATE storage.buckets 
  SET public = true 
  WHERE id = 'franchise-docs';
END $$;

-- Crear políticas RLS para el bucket franchise-docs
CREATE POLICY "Allow public read access to franchise docs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'franchise-docs');

CREATE POLICY "Allow authenticated users to upload franchise docs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'franchise-docs' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update franchise docs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'franchise-docs' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete franchise docs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'franchise-docs' AND auth.role() = 'authenticated');