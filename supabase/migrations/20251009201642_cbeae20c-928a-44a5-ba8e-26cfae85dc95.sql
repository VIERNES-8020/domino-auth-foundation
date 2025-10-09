-- Drop the incorrect foreign key constraint on profiles table
-- The constraint is referencing a non-existent 'users' table in public schema
-- when it should reference auth.users

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add the correct foreign key constraint to auth.users
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;