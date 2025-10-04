-- Create storage bucket for sale documents (contracts and vouchers)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sale-documents', 
  'sale-documents', 
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies are managed automatically by Supabase for this bucket
-- Agents can upload to their own folder: {agent_id}/contracts/ and {agent_id}/vouchers/
-- Access is controlled through the sale_closures table RLS policies