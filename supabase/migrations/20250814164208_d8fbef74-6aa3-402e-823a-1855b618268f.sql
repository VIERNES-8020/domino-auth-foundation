-- Create reviews/testimonials table for client feedback
CREATE TABLE public.client_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  property_id UUID,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('venta', 'alquiler', 'anticrético')),
  company_rating INTEGER NOT NULL CHECK (company_rating >= 1 AND company_rating <= 5),
  agent_rating INTEGER NOT NULL CHECK (agent_rating >= 1 AND agent_rating <= 5),
  comment TEXT,
  client_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_approved BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for client reviews
CREATE POLICY "Anyone can view approved reviews" 
ON public.client_reviews 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Clients can create their own reviews" 
ON public.client_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own reviews" 
ON public.client_reviews 
FOR UPDATE 
USING (auth.uid() = client_id);

CREATE POLICY "Super admins can approve reviews" 
ON public.client_reviews 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Add index for better performance
CREATE INDEX idx_client_reviews_agent ON public.client_reviews(agent_id);
CREATE INDEX idx_client_reviews_approved ON public.client_reviews(is_approved);

-- Update agent_performance table to include average ratings from client reviews
CREATE OR REPLACE FUNCTION calculate_agent_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update agent performance based on client reviews
  INSERT INTO agent_performance (agent_id, average_rating, total_ratings, last_updated)
  SELECT 
    NEW.agent_id,
    AVG(agent_rating)::numeric,
    COUNT(*)::integer,
    now()
  FROM client_reviews 
  WHERE agent_id = NEW.agent_id AND is_approved = true
  ON CONFLICT (agent_id) 
  DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_ratings = EXCLUDED.total_ratings,
    last_updated = EXCLUDED.last_updated;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update agent performance
CREATE TRIGGER trigger_update_agent_performance
  AFTER INSERT OR UPDATE ON client_reviews
  FOR EACH ROW
  WHEN (NEW.is_approved = true)
  EXECUTE FUNCTION calculate_agent_performance();