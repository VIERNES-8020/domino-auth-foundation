CREATE OR REPLACE FUNCTION public.update_property_geolocation(
  p_property_id uuid,
  p_longitude double precision,
  p_latitude double precision
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE properties
  SET geolocation = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)
  WHERE id = p_property_id;
END;
$$;