DROP VIEW public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT id, user_id, username, display_name, avatar_url, bio, is_influencer,
  instagram_url, instagram_verified, twitter_url, twitter_verified,
  facebook_url, facebook_verified, tiktok_url, tiktok_verified,
  email_verified, id_verified, trade_matches_enabled, referral_code,
  show_followers, created_at, updated_at
FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;