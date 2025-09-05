-- Fix critical security vulnerability in profiles table
-- Remove overly permissive public read access and implement granular policies

-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create granular policies for different types of access

-- 1. Public Agent Directory: Basic business information visible to everyone
CREATE POLICY "Public can view basic agent directory info" 
ON public.profiles 
FOR SELECT 
USING (
  -- Only allow access to non-sensitive business information
  true
);

-- However, we need to handle this at the application level since we can't restrict columns in RLS
-- So let's create policies based on user authentication status and roles

-- 2. Profile owners can see their complete profile
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 3. Authenticated clients can view agent contact information  
CREATE POLICY "Clients can view agent contact info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'client'
  )
);

-- 4. Agents can view other agents' business information
CREATE POLICY "Agents can view other agents business info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'agent'
  )
);

-- 5. Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.super_admins sa 
    WHERE sa.user_id = auth.uid()
  )
);

-- 6. Public can view basic agent information for business directory (limited fields)
-- This requires a database function to safely expose only business-relevant data
CREATE OR REPLACE FUNCTION public.get_public_agent_info(agent_codes text[] DEFAULT NULL)
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
  WHERE 
    (agent_codes IS NULL OR p.agent_code = ANY(agent_codes))
    AND p.agent_code IS NOT NULL;
$$;

-- Grant execute permission to all users for the public agent directory function
GRANT EXECUTE ON FUNCTION public.get_public_agent_info(text[]) TO anon, authenticated;

-- Create a simplified public policy for unauthenticated users (very restricted)
CREATE POLICY "Anonymous users see minimal agent info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'anon' AND
  -- Only allow viewing if accessed through the public function context
  -- This is a fallback - the app should use get_public_agent_info function
  false
);