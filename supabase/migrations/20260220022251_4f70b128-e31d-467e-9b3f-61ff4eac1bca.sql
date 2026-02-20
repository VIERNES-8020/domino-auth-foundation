
-- Update get_public_agent_info to exclude archived agents
CREATE OR REPLACE FUNCTION public.get_public_agent_info(agent_codes text[] DEFAULT NULL)
RETURNS TABLE(
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
    AND p.agent_code IS NOT NULL
    AND (p.is_archived IS NULL OR p.is_archived = false);
$$;

-- Also update get_public_agent_directory to exclude archived
CREATE OR REPLACE FUNCTION public.get_public_agent_directory()
RETURNS TABLE(
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
    p.agent_code IS NOT NULL
    AND (p.is_archived IS NULL OR p.is_archived = false);
$$;
