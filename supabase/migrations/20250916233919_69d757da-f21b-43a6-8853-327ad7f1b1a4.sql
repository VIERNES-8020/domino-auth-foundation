-- Add is_archived field to profiles table
ALTER TABLE public.profiles ADD COLUMN is_archived boolean DEFAULT false;