-- Add new columns to property_visits table for sales process (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_visits' AND column_name = 'visit_result') THEN
        ALTER TABLE public.property_visits ADD COLUMN visit_result text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_visits' AND column_name = 'sale_amount') THEN
        ALTER TABLE public.property_visits ADD COLUMN sale_amount numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_visits' AND column_name = 'commission_percentage') THEN
        ALTER TABLE public.property_visits ADD COLUMN commission_percentage numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_visits' AND column_name = 'commission_amount') THEN
        ALTER TABLE public.property_visits ADD COLUMN commission_amount numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_visits' AND column_name = 'currency') THEN
        ALTER TABLE public.property_visits ADD COLUMN currency text DEFAULT 'USD';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_visits' AND column_name = 'transaction_type') THEN
        ALTER TABLE public.property_visits ADD COLUMN transaction_type text;
    END IF;
END $$;