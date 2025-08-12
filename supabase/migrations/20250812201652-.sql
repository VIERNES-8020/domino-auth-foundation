-- Create storage buckets for property assets (idempotent)
insert into storage.buckets (id, name, public)
values
  ('property-photos', 'property-photos', true),
  ('property-plans', 'property-plans', true)
on conflict (id) do nothing;

-- Policies for property-photos (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read - property photos'
  ) THEN
    CREATE POLICY "Public read - property photos"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'property-photos');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload to their folder - property photos'
  ) THEN
    CREATE POLICY "Users can upload to their folder - property photos"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'property-photos'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own files - property photos'
  ) THEN
    CREATE POLICY "Users can update their own files - property photos"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'property-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own files - property photos'
  ) THEN
    CREATE POLICY "Users can delete their own files - property photos"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'property-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Policies for property-plans (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read - property plans'
  ) THEN
    CREATE POLICY "Public read - property plans"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'property-plans');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload to their folder - property plans'
  ) THEN
    CREATE POLICY "Users can upload to their folder - property plans"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'property-plans'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own files - property plans'
  ) THEN
    CREATE POLICY "Users can update their own files - property plans"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'property-plans'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own files - property plans'
  ) THEN
    CREATE POLICY "Users can delete their own files - property plans"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'property-plans'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;