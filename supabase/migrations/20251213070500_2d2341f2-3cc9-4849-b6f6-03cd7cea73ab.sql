-- Add birthday and username change tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birthday date,
ADD COLUMN IF NOT EXISTS username_last_changed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Add unique constraint on username
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Update the condition enum to include more options
ALTER TYPE public.fragrance_condition ADD VALUE IF NOT EXISTS 'like_new';

-- Reorder enum values (create new type with correct order)
-- Note: We already have the like_new value from types.ts, so we're good