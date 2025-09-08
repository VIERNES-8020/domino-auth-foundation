-- Add assignment fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN assigned_corporate_phone text,
ADD COLUMN assigned_corporate_email text,
ADD COLUMN assignment_date timestamp with time zone;