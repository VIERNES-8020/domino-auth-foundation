-- Crear el bucket para documentos de franquicia
INSERT INTO storage.buckets (id, name, public) 
VALUES ('franchise-docs', 'franchise-docs', true);

-- Políticas para permitir subida de archivos por cualquier usuario
CREATE POLICY "Anyone can upload franchise documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'franchise-docs');

-- Política para permitir ver documentos de franquicia (público)
CREATE POLICY "Anyone can view franchise documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'franchise-docs');

-- Política para actualizar documentos
CREATE POLICY "Anyone can update franchise documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'franchise-docs');

-- Política para eliminar documentos (solo super admins)
CREATE POLICY "Super admins can delete franchise documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'franchise-docs' AND EXISTS (
  SELECT 1 FROM super_admins WHERE user_id = auth.uid()
));