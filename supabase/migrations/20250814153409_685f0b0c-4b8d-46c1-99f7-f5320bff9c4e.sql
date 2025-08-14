-- Add concluded status fields to properties table
ALTER TABLE public.properties 
ADD COLUMN concluded_status TEXT DEFAULT NULL,
ADD COLUMN concluded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create listing_leads table for "Vende o Alquila" submissions
CREATE TABLE public.listing_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    city_country TEXT,
    request_type TEXT NOT NULL CHECK (request_type IN ('venta', 'alquiler')),
    property_location TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on listing_leads
ALTER TABLE public.listing_leads ENABLE ROW LEVEL SECURITY;

-- Policy for anyone to create listing leads
CREATE POLICY "Anyone can create listing leads" 
ON public.listing_leads 
FOR INSERT 
WITH CHECK (true);

-- Policy for super admins to view all listing leads
CREATE POLICY "Super admins can view all listing leads" 
ON public.listing_leads 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM super_admins sa 
    WHERE sa.user_id = auth.uid()
));

-- Policy for super admins to update listing leads
CREATE POLICY "Super admins can update listing leads" 
ON public.listing_leads 
FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM super_admins sa 
    WHERE sa.user_id = auth.uid()
));

-- Create admin notifications for listing leads
CREATE OR REPLACE FUNCTION notify_admin_of_listing_lead()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notification for all super admins
    INSERT INTO admin_notifications (user_id, title, message, type)
    SELECT 
        sa.user_id,
        'Nueva Solicitud de Venta/Alquiler',
        'Nuevo lead: ' || NEW.full_name || ' quiere ' || 
        CASE WHEN NEW.request_type = 'venta' THEN 'vender' ELSE 'alquilar' END ||
        ' su propiedad en ' || COALESCE(NEW.property_location, 'ubicación no especificada'),
        'listing_lead'
    FROM super_admins sa;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for listing lead notifications
CREATE TRIGGER notify_admin_listing_lead_trigger
    AFTER INSERT ON public.listing_leads
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_of_listing_lead();