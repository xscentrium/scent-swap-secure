-- 1. Fix Admin Alert Settings - Remove overly permissive policy
DROP POLICY IF EXISTS "Service role can read settings" ON admin_alert_settings;

-- 2. Fix Notifications INSERT Policy - Restrict to proper inserts
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

CREATE POLICY "System can create notifications via trigger"
ON notifications FOR INSERT
WITH CHECK (
  -- Only allow inserts where the user_id matches the inserting user's profile
  -- or via service role (for triggers/edge functions)
  user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
  OR auth.uid() IS NULL
);

-- 3. Create support_tickets table for contact form
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id)
);

-- Enable RLS on support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a support ticket
CREATE POLICY "Anyone can submit support tickets"
ON support_tickets FOR INSERT
WITH CHECK (true);

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON support_tickets FOR SELECT
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON support_tickets FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update tickets
CREATE POLICY "Admins can update tickets"
ON support_tickets FOR UPDATE
USING (has_role(auth.uid(), 'admin'));