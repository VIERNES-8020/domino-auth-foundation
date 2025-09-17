-- Add property_code field to properties table for unique identification
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_code text;

-- Create unique index on property_code to ensure no duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_property_code ON public.properties(property_code);

-- Create function to generate property codes
CREATE OR REPLACE FUNCTION public.generate_property_code(
  p_property_type text,
  p_transaction_type text, 
  p_agent_id uuid
) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  type_code text;
  transaction_code text;
  agent_code text;
  sequence_number integer;
  final_code text;
BEGIN
  -- Map property types to codes
  type_code := CASE 
    WHEN LOWER(p_property_type) = 'casa' THEN 'C'
    WHEN LOWER(p_property_type) = 'departamento' THEN 'D'
    WHEN LOWER(p_property_type) = 'oficina' THEN 'O'
    WHEN LOWER(p_property_type) = 'terreno' THEN 'T'
    WHEN LOWER(p_property_type) = 'local comercial' THEN 'LC'
    ELSE 'P' -- Generic property
  END;
  
  -- Map transaction types to codes
  transaction_code := CASE 
    WHEN LOWER(p_transaction_type) = 'venta' THEN 'V'
    WHEN LOWER(p_transaction_type) = 'alquiler' THEN 'A'
    ELSE 'X' -- Unknown
  END;
  
  -- Get agent code from profiles table
  SELECT COALESCE(agent_code, 'AGENT' || EXTRACT(YEAR FROM CURRENT_DATE)::text) 
  INTO agent_code
  FROM public.profiles 
  WHERE id = p_agent_id;
  
  -- Get next sequence number for this type combination and agent
  SELECT COUNT(*) + 1
  INTO sequence_number
  FROM public.properties 
  WHERE property_code LIKE (type_code || transaction_code || '-%/' || agent_code);
  
  -- Format final code: CV-001/MCAL4139
  final_code := type_code || transaction_code || '-' || 
    LPAD(sequence_number::text, 3, '0') || '/' || agent_code;
  
  RETURN final_code;
END;
$$;

-- Create trigger function to auto-generate property codes
CREATE OR REPLACE FUNCTION public.auto_generate_property_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate code if not already set
  IF NEW.property_code IS NULL OR NEW.property_code = '' THEN
    NEW.property_code := public.generate_property_code(
      NEW.property_type,
      NEW.transaction_type,
      NEW.agent_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate property codes on insert
DROP TRIGGER IF EXISTS trigger_auto_generate_property_code ON public.properties;
CREATE TRIGGER trigger_auto_generate_property_code
  BEFORE INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_property_code();

-- Update existing properties to have property codes
UPDATE public.properties 
SET property_code = public.generate_property_code(property_type, transaction_type, agent_id)
WHERE property_code IS NULL OR property_code = '';