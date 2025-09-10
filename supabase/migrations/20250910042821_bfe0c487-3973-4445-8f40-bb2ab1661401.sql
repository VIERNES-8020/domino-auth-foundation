-- Create a function to handle user profile creation during admin user creation
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id uuid,
  p_full_name text,
  p_identity_card text DEFAULT NULL,
  p_corporate_phone text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile data
  INSERT INTO public.profiles (
    id,
    full_name,
    identity_card,
    corporate_phone,
    email
  ) VALUES (
    p_user_id,
    p_full_name,
    p_identity_card,
    p_corporate_phone,
    p_email
  );
END;
$$;