-- Cambiar bucket sale-documents a público para permitir acceso directo a las URLs
UPDATE storage.buckets 
SET public = true 
WHERE id = 'sale-documents';