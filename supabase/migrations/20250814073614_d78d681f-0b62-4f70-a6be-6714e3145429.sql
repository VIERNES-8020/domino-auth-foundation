-- Add constructed area field to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS constructed_area_m2 numeric;

-- Create storage buckets for property multimedia if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-videos', 'property-videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-plans', 'property-plans', true)
ON CONFLICT (id) DO NOTHING;