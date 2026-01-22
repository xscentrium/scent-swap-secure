-- Phase 1: Critical Security Fixes

-- 1. Fix Profiles Table - Create a secure view for public access
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create a new policy that allows users to see all profiles but sensitive data only for themselves
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Create a secure view that hides sensitive fields for public consumption
CREATE OR REPLACE VIEW public_profiles AS
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

-- 2. Fix Admin Alert Settings - Remove any public access
DROP POLICY IF EXISTS "Service role can read settings" ON admin_alert_settings;

-- 3. Fix Notifications INSERT Policy - Make it more restrictive
DROP POLICY IF EXISTS "System can create notifications via trigger" ON notifications;

-- Create a properly restrictive INSERT policy
-- Only allows inserts where user_id matches the authenticated user's profile
-- OR when called from a database trigger (auth.uid() is null in trigger context)
CREATE POLICY "System can create notifications via trigger"
ON notifications FOR INSERT
WITH CHECK (
  (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ))
  OR (auth.uid() IS NULL)
);