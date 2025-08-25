-- Add new columns to property_visits table for sales process
ALTER TABLE public.property_visits 
ADD COLUMN IF NOT EXISTS visit_result text,
ADD COLUMN IF NOT EXISTS sale_amount numeric,
ADD COLUMN IF NOT EXISTS commission_percentage numeric,
ADD COLUMN IF NOT EXISTS commission_amount numeric,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS transaction_type text;

-- Update status column to use specific values
ALTER TABLE public.property_visits 
ALTER COLUMN status TYPE text;

-- Add check constraint for status values
ALTER TABLE public.property_visits 
ADD CONSTRAINT property_visits_status_check 
CHECK (status IN ('pending', 'confirmed', 'completed', 'successful', 'rejected'));

-- Add check constraint for currency values
ALTER TABLE public.property_visits 
ADD CONSTRAINT property_visits_currency_check 
CHECK (currency IN ('USD', 'BOB'));

-- Add check constraint for transaction_type values
ALTER TABLE public.property_visits 
ADD CONSTRAINT property_visits_transaction_type_check 
CHECK (transaction_type IN ('venta', 'alquiler', 'anticretico'));

-- Add check constraint for visit_result values
ALTER TABLE public.property_visits 
ADD CONSTRAINT property_visits_visit_result_check 
CHECK (visit_result IN ('successful', 'rejected'));