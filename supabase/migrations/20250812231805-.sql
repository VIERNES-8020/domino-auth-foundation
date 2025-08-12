-- Add constructed area column for properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS constructed_area_m2 NUMERIC(10, 2);
