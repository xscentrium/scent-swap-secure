-- Add email digest columns to notification_preferences
ALTER TABLE public.notification_preferences
ADD COLUMN email_digest_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN email_digest_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (email_digest_frequency IN ('daily', 'weekly')),
ADD COLUMN last_digest_sent_at TIMESTAMP WITH TIME ZONE;