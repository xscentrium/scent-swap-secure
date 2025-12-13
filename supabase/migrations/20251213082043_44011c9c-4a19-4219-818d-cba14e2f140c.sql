-- Add trade_matches_enabled column to profiles for opt-in feature
ALTER TABLE public.profiles
ADD COLUMN trade_matches_enabled boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.trade_matches_enabled IS 'Whether user wants to receive trade match notifications';