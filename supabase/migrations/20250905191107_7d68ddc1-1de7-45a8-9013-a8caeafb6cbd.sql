-- Fix critical security vulnerability in profiles table
-- Completely rebuild RLS policies with proper security

-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public can view basic agent directory info" ON public.profiles; 
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Clients can view agent contact info" ON public.profiles;
DROP POLICY IF EXISTS "Agents can view other agents business info" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous users see minimal agent info" ON public.profiles;

-- Create secure granular policies

-- 1. Profile owners can see their complete profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Super admins can view all profiles  
CREATE POLICY "Super admins view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.super_admins sa 
    WHERE sa.user_id = auth.uid()
  )
);

-- 3. Authenticated users can view basic agent business information
CREATE POLICY "Authenticated users view agent business info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND
  agent_code IS NOT NULL
);

-- 4. Create a secure public function for agent directory (non-sensitive data only)
CREATE OR REPLACE FUNCTION public.get_public_agent_directory()
RETURNS TABLE (
  id uuid,
  full_name text,
  agent_code text,
  avatar_url text,
  title text,
  bio text,
  experience_summary text,
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  twitter_url text,
  website_url text
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.agent_code,
    p.avatar_url,
    p.title,
    p.bio,
    p.experience_summary,
    p.facebook_url,
    p.instagram_url,
    p.linkedin_url,
    p.twitter_url,
    p.website_url
  FROM public.profiles p
  WHERE p.agent_code IS NOT NULL;
$$;

-- Grant execute permission for the public agent directory function
GRANT EXECUTE ON FUNCTION public.get_public_agent_directory() TO anon, authenticated;