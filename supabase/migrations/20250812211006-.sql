-- Add price_currency to properties and create favorites table with RLS
-- 1) Add price_currency column (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'price_currency'
  ) THEN
    ALTER TABLE public.properties
      ADD COLUMN price_currency TEXT NOT NULL DEFAULT 'USD' CHECK (price_currency IN ('USD','BOB'));
  END IF;
END $$;

-- 2) Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'favorites' AND policyname = 'Users can view their own favorites'
  ) THEN
    CREATE POLICY "Users can view their own favorites"
      ON public.favorites
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'favorites' AND policyname = 'Users can insert their own favorites'
  ) THEN
    CREATE POLICY "Users can insert their own favorites"
      ON public.favorites
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'favorites' AND policyname = 'Users can delete their own favorites'
  ) THEN
    CREATE POLICY "Users can delete their own favorites"
      ON public.favorites
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;