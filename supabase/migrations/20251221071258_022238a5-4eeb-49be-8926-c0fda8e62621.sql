-- Create scheduled_fragrances table for calendar feature
CREATE TABLE public.scheduled_fragrances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  fragrance_name TEXT NOT NULL,
  fragrance_brand TEXT NOT NULL,
  occasion TEXT,
  notes TEXT,
  is_worn BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, scheduled_date)
);

-- Enable RLS
ALTER TABLE public.scheduled_fragrances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scheduled fragrances" 
ON public.scheduled_fragrances FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = profile_id));

CREATE POLICY "Users can manage their own scheduled fragrances" 
ON public.scheduled_fragrances FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = profile_id));

-- Function to notify when badge is earned
CREATE OR REPLACE FUNCTION public.notify_badge_earned()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.profile_id,
    'badge_earned',
    'New Badge Earned!',
    'Congratulations! You earned the "' || NEW.badge_name || '" badge!',
    jsonb_build_object(
      'badge_type', NEW.badge_type,
      'badge_name', NEW.badge_name,
      'earned_at', NEW.earned_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for badge notifications
CREATE TRIGGER notify_on_badge_earned
AFTER INSERT ON public.user_badges
FOR EACH ROW EXECUTE FUNCTION public.notify_badge_earned();

-- Function to notify potential trade matches
CREATE OR REPLACE FUNCTION public.notify_trade_match()
RETURNS TRIGGER AS $$
DECLARE
  potential_match RECORD;
  match_score INTEGER;
BEGIN
  -- Only process if blind matching is enabled
  IF NEW.blind_match_enabled = false THEN
    RETURN NEW;
  END IF;

  -- Find potential matches
  FOR potential_match IN
    SELECT tp.profile_id, p.username,
      (
        SELECT COUNT(*) FROM unnest(NEW.preferred_brands) nb
        WHERE nb = ANY(tp.preferred_brands)
      ) * 20 +
      (
        SELECT COUNT(*) FROM unnest(NEW.preferred_notes) nn
        WHERE nn = ANY(tp.preferred_notes)
      ) * 10 as score
    FROM trade_preferences tp
    JOIN profiles p ON p.id = tp.profile_id
    WHERE tp.profile_id != NEW.profile_id
      AND tp.blind_match_enabled = true
    ORDER BY score DESC
    LIMIT 5
  LOOP
    IF potential_match.score > 30 THEN
      -- Notify the current user about the match
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        NEW.profile_id,
        'trade_match',
        'New Trade Match Found!',
        'We found a potential trade partner: @' || potential_match.username,
        jsonb_build_object(
          'matched_profile_id', potential_match.profile_id,
          'match_score', potential_match.score
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for trade match notifications
CREATE TRIGGER notify_on_trade_preferences_update
AFTER INSERT OR UPDATE ON public.trade_preferences
FOR EACH ROW EXECUTE FUNCTION public.notify_trade_match();