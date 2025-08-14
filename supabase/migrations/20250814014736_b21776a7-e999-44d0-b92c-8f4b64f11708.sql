-- Add minimal RLS policy for user_roles to satisfy linter and secure reads
DO $$ BEGIN
  BEGIN
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;