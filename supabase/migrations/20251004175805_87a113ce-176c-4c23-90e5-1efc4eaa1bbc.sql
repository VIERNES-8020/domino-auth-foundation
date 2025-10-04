-- Create sale_closures table for tracking property sale closures
CREATE TABLE public.sale_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_captador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  agent_vendedor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  published_price NUMERIC NOT NULL,
  closure_price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  closure_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'rent')),
  contract_url TEXT,
  voucher_urls TEXT[],
  office_percentage NUMERIC NOT NULL DEFAULT 30.0,
  captador_percentage NUMERIC NOT NULL DEFAULT 35.0,
  vendedor_percentage NUMERIC NOT NULL DEFAULT 35.0,
  office_amount NUMERIC GENERATED ALWAYS AS (closure_price * office_percentage / 100) STORED,
  captador_amount NUMERIC GENERATED ALWAYS AS (closure_price * captador_percentage / 100) STORED,
  vendedor_amount NUMERIC GENERATED ALWAYS AS (closure_price * vendedor_percentage / 100) STORED,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sale_closures ENABLE ROW LEVEL SECURITY;

-- Agents can view closures they're involved in
CREATE POLICY "Agents can view their closures"
ON public.sale_closures
FOR SELECT
USING (
  auth.uid() = agent_captador_id OR 
  auth.uid() = agent_vendedor_id
);

-- Agents can create closures where they are captador or vendedor
CREATE POLICY "Agents can create closures"
ON public.sale_closures
FOR INSERT
WITH CHECK (
  auth.uid() = agent_captador_id OR 
  auth.uid() = agent_vendedor_id
);

-- Agents can update closures they're involved in (only if pending)
CREATE POLICY "Agents can update pending closures"
ON public.sale_closures
FOR UPDATE
USING (
  (auth.uid() = agent_captador_id OR auth.uid() = agent_vendedor_id) 
  AND status = 'pending'
);

-- Super admins can view all closures
CREATE POLICY "Super admins can view all closures"
ON public.sale_closures
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM super_admins sa
    WHERE sa.user_id = auth.uid()
  )
);

-- Super admins can update any closure (for validation)
CREATE POLICY "Super admins can update closures"
ON public.sale_closures
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM super_admins sa
    WHERE sa.user_id = auth.uid()
  )
);

-- Super admins can delete closures
CREATE POLICY "Super admins can delete closures"
ON public.sale_closures
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM super_admins sa
    WHERE sa.user_id = auth.uid()
  )
);

-- Create trigger to update updated_at
CREATE TRIGGER update_sale_closures_updated_at
  BEFORE UPDATE ON public.sale_closures
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_last_updated();

-- Create index for better performance
CREATE INDEX idx_sale_closures_agent_captador ON public.sale_closures(agent_captador_id);
CREATE INDEX idx_sale_closures_agent_vendedor ON public.sale_closures(agent_vendedor_id);
CREATE INDEX idx_sale_closures_property ON public.sale_closures(property_id);
CREATE INDEX idx_sale_closures_status ON public.sale_closures(status);