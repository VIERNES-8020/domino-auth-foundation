-- Add edit_count column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS edit_count integer DEFAULT 0;