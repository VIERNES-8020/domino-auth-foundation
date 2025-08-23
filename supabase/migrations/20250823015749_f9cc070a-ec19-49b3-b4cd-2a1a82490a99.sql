-- Create RPC function to get property reviews (to avoid TypeScript issues)
CREATE OR REPLACE FUNCTION public.get_property_reviews(property_id_param UUID)
RETURNS TABLE(
    id UUID,
    rating INTEGER,
    comment TEXT,
    client_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.rating,
        pr.comment,
        pr.client_name,
        pr.created_at
    FROM public.property_reviews pr
    WHERE pr.property_id = property_id_param
    AND pr.is_approved = true
    ORDER BY pr.created_at DESC;
END;
$$;