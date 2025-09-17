-- Add outcome column to property_visits table
ALTER TABLE public.property_visits 
ADD COLUMN outcome TEXT CHECK (outcome IN ('effective', 'denied'));