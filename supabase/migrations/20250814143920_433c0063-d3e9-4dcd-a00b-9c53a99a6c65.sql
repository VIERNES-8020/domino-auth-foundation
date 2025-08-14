-- Create franchise applications table
CREATE TABLE public.franchise_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    city TEXT,
    country TEXT,
    message TEXT,
    photo_url TEXT,
    cv_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.franchise_applications ENABLE ROW LEVEL SECURITY;

-- Create policy for super admins to view all applications
CREATE POLICY "Super admins can view all franchise applications" 
ON public.franchise_applications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()
));

-- Create policy for inserting applications (public access)
CREATE POLICY "Anyone can submit franchise applications" 
ON public.franchise_applications 
FOR INSERT 
WITH CHECK (true);

-- Create agent leads table for contact-to-agent notifications
CREATE TABLE public.agent_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL,
    property_id UUID,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    message TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agent_leads ENABLE ROW LEVEL SECURITY;

-- Create policy for agents to view their own leads
CREATE POLICY "Agents can view their own leads" 
ON public.agent_leads 
FOR SELECT 
USING (auth.uid() = agent_id);

-- Create policy for inserting leads (public access)
CREATE POLICY "Anyone can create leads" 
ON public.agent_leads 
FOR INSERT 
WITH CHECK (true);

-- Create policy for agents to update their own leads
CREATE POLICY "Agents can update their own leads" 
ON public.agent_leads 
FOR UPDATE 
USING (auth.uid() = agent_id);

-- Create storage bucket for franchise documents
INSERT INTO storage.buckets (id, name, public) VALUES ('franchise-docs', 'franchise-docs', false);

-- Create storage policy for franchise document uploads
CREATE POLICY "Anyone can upload franchise documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'franchise-docs');

-- Create storage policy for viewing franchise documents (super admins only)
CREATE POLICY "Super admins can view franchise documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'franchise-docs' AND 
  EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid())
);