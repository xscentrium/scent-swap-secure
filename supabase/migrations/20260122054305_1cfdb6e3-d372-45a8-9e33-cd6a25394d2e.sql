-- Fix Security Definer View - Make it use invoker's permissions
DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  username,
  display_name,
  avatar_url,
  bio,
  is_influencer,
  instagram_url,
  instagram_verified,
  twitter_url,
  twitter_verified,
  facebook_url,
  facebook_verified,
  tiktok_url,
  tiktok_verified,
  email_verified,
  id_verified,
  trade_matches_enabled,
  referral_code,
  created_at,
  updated_at
FROM profiles;

-- Grant access to the view
GRANT SELECT ON public_profiles TO anon, authenticated;