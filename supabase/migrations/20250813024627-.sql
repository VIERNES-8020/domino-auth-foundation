-- Fix prior migration: use correct pg_policies column names
-- 1) Ensure profiles has required columns and unique constraint on agent_code
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS experience_summary TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS agent_code TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_agent_code_key'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_agent_code_key UNIQUE (agent_code);
  END IF;
END $$;

-- 2) Add avatar_url to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3) Create avatars bucket if missing
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);

-- 4) Policies on storage.objects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Public can view avatars' AND schemaname = 'storage' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public can view avatars"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can upload own avatar' AND schemaname = 'storage' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can upload own avatar"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can update own avatar' AND schemaname = 'storage' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can update own avatar"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
      bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;
