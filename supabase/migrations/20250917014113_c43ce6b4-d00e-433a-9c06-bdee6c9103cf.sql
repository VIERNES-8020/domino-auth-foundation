-- Create property_assignments table to track property assignments between agents
CREATE TABLE public.property_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL,
  from_agent_id uuid NOT NULL,
  to_agent_id uuid NOT NULL,
  reason text NOT NULL,
  assignment_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.property_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for property assignments
CREATE POLICY "Agents can view assignments for their properties" 
ON public.property_assignments 
FOR SELECT 
USING (
  auth.uid() = from_agent_id OR 
  auth.uid() = to_agent_id OR
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_assignments.property_id 
    AND p.agent_id = auth.uid()
  )
);

CREATE POLICY "Agents can create assignments for their properties" 
ON public.property_assignments 
FOR INSERT 
WITH CHECK (
  auth.uid() = from_agent_id AND
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_assignments.property_id 
    AND p.agent_id = auth.uid()
  )
);

-- Super admins can view all assignments
CREATE POLICY "Super admins can view all assignments" 
ON public.property_assignments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM super_admins 
  WHERE super_admins.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_property_assignments_updated_at
  BEFORE UPDATE ON public.property_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_last_updated();