-- Create GiST index for spatial queries if missing
CREATE INDEX IF NOT EXISTS idx_properties_geolocation_gix ON public.properties USING GIST (geolocation);

-- Nearby properties RPC using PostGIS
CREATE OR REPLACE FUNCTION public.properties_nearby(
  lon double precision,
  lat double precision,
  radius_km double precision
)
RETURNS SETOF public.properties
LANGUAGE sql
STABLE
AS $$
  SELECT p.*
  FROM public.properties p
  WHERE p.status = 'approved'
    AND p.geolocation IS NOT NULL
    AND ST_DWithin(
      p.geolocation::geography,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
      radius_km * 1000.0
    )
  ORDER BY ST_Distance(
    p.geolocation::geography,
    ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
  );
$$;