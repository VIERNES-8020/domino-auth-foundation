-- Move PostGIS extension objects to the extensions schema to satisfy linter
-- (no-op if already in the correct schema)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'postgis' AND n.nspname <> 'extensions'
  ) THEN
    ALTER EXTENSION postgis SET SCHEMA extensions;
  END IF;
END $$;