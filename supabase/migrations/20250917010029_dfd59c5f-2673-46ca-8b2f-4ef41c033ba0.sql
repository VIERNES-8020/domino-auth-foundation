-- Update property code generation function to include all property types
CREATE OR REPLACE FUNCTION public.generate_property_code(
  p_property_type text,
  p_transaction_type text, 
  p_agent_id uuid
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  type_code text;
  transaction_code text;
  agent_code_value text;
  sequence_number integer;
  final_code text;
BEGIN
  -- Map property types to codes (including edificio and other types)
  type_code := CASE 
    WHEN LOWER(p_property_type) = 'casa' THEN 'C'
    WHEN LOWER(p_property_type) = 'departamento' THEN 'D'
    WHEN LOWER(p_property_type) = 'oficina' THEN 'O'
    WHEN LOWER(p_property_type) = 'terreno' THEN 'T'
    WHEN LOWER(p_property_type) = 'local comercial' OR LOWER(p_property_type) = 'local_comercial' THEN 'LC'
    WHEN LOWER(p_property_type) = 'edificio' THEN 'E'
    WHEN LOWER(p_property_type) = 'galpon' OR LOWER(p_property_type) = 'galpón' THEN 'G'
    WHEN LOWER(p_property_type) = 'lote' THEN 'L'
    WHEN LOWER(p_property_type) = 'quinta' THEN 'Q'
    WHEN LOWER(p_property_type) = 'bodega' THEN 'B'
    ELSE 'P' -- Generic property for any other types
  END;
  
  -- Map transaction types to codes
  transaction_code := CASE 
    WHEN LOWER(p_transaction_type) = 'venta' THEN 'V'
    WHEN LOWER(p_transaction_type) = 'alquiler' THEN 'A'
    WHEN LOWER(p_transaction_type) = 'anticretico' THEN 'AC'
    ELSE 'X' -- Unknown
  END;
  
  -- Get agent code from profiles table
  SELECT COALESCE(profiles.agent_code, 'AGENT' || EXTRACT(YEAR FROM CURRENT_DATE)::text) 
  INTO agent_code_value
  FROM public.profiles 
  WHERE profiles.id = p_agent_id;
  
  -- Get next sequence number for this type combination and agent
  SELECT COUNT(*) + 1
  INTO sequence_number
  FROM public.properties 
  WHERE property_code LIKE (type_code || transaction_code || '-%/' || agent_code_value);
  
  -- Format final code: EV-001/MCAL4139 for edificio venta
  final_code := type_code || transaction_code || '-' || 
    LPAD(sequence_number::text, 3, '0') || '/' || agent_code_value;
  
  RETURN final_code;
END;
$$;

-- Update existing properties that might not have codes yet
UPDATE public.properties 
SET property_code = public.generate_property_code(property_type, transaction_type, agent_id)
WHERE property_code IS NULL OR property_code = '';