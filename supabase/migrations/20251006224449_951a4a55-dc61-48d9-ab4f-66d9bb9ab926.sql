-- Crear bucket para documentos de cierres de venta
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sale-documents',
  'sale-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Política: Los agentes pueden subir documentos a sus propias carpetas
CREATE POLICY "Agents can upload to their own folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'sale-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Los agentes pueden ver sus propios documentos
CREATE POLICY "Agents can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'sale-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Los agentes pueden eliminar sus propios documentos
CREATE POLICY "Agents can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'sale-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Super admins pueden ver todos los documentos
CREATE POLICY "Super admins can view all sale documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'sale-documents' 
  AND EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = auth.uid()
  )
);