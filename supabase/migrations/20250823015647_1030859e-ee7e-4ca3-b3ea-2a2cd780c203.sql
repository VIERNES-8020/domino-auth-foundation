-- Create property_reviews table for property-specific reviews
CREATE TABLE public.property_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for property_reviews
CREATE POLICY "Property reviews are viewable by everyone when approved" 
ON public.property_reviews 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Anyone can create property reviews" 
ON public.property_reviews 
FOR INSERT 
WITH CHECK (true);

-- Create property_visits table for visit scheduling
CREATE TABLE public.property_visits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL,
    agent_id UUID NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    message TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;

-- Create policies for property_visits
CREATE POLICY "Agents can view visits for their properties" 
ON public.property_visits 
FOR SELECT 
USING (agent_id = auth.uid());

CREATE POLICY "Anyone can schedule property visits" 
ON public.property_visits 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Agents can update their property visits" 
ON public.property_visits 
FOR UPDATE 
USING (agent_id = auth.uid());

-- Create trigger for automatic timestamp updates on property_reviews
CREATE TRIGGER update_property_reviews_updated_at
BEFORE UPDATE ON public.property_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on property_visits
CREATE TRIGGER update_property_visits_updated_at
BEFORE UPDATE ON public.property_visits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_property_reviews_property_id ON public.property_reviews(property_id);
CREATE INDEX idx_property_reviews_approved ON public.property_reviews(is_approved);
CREATE INDEX idx_property_visits_property_id ON public.property_visits(property_id);
CREATE INDEX idx_property_visits_agent_id ON public.property_visits(agent_id);
CREATE INDEX idx_property_visits_scheduled_at ON public.property_visits(scheduled_at);