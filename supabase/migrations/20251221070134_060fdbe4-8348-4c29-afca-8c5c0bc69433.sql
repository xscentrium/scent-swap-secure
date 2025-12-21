-- Add scent preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS scent_preferences jsonb DEFAULT NULL;

-- Create scent_logs table for SOTD tracking
CREATE TABLE public.scent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fragrance_name text NOT NULL,
  fragrance_brand text NOT NULL,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  occasion text,
  mood text,
  weather text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, logged_date, fragrance_name, fragrance_brand)
);

-- Create trust_scores table
CREATE TABLE public.trust_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_trades_completed integer NOT NULL DEFAULT 0,
  total_trades_cancelled integer NOT NULL DEFAULT 0,
  average_rating numeric(3,2) DEFAULT NULL,
  total_ratings integer NOT NULL DEFAULT 0,
  verification_bonus integer NOT NULL DEFAULT 0,
  calculated_score numeric(4,2) NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now()
);

-- Create trade_ratings table for rating trade partners
CREATE TABLE public.trade_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rated_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  packaging_rating integer CHECK (packaging_rating >= 1 AND packaging_rating <= 5),
  accuracy_rating integer CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  review_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trade_id, rater_id)
);

-- Enable RLS
ALTER TABLE public.scent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_ratings ENABLE ROW LEVEL SECURITY;

-- Scent logs policies
CREATE POLICY "Users can view their own scent logs"
ON public.scent_logs FOR SELECT
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own scent logs"
ON public.scent_logs FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own scent logs"
ON public.scent_logs FOR UPDATE
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own scent logs"
ON public.scent_logs FOR DELETE
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Trust scores policies (viewable by everyone)
CREATE POLICY "Trust scores are viewable by everyone"
ON public.trust_scores FOR SELECT
USING (true);

CREATE POLICY "System can manage trust scores"
ON public.trust_scores FOR ALL
USING (true)
WITH CHECK (true);

-- Trade ratings policies
CREATE POLICY "Trade ratings are viewable by everyone"
ON public.trade_ratings FOR SELECT
USING (true);

CREATE POLICY "Users can rate trades they participated in"
ON public.trade_ratings FOR INSERT
WITH CHECK (
  rater_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM trades 
    WHERE id = trade_id 
    AND status = 'completed'
    AND (initiator_id = rater_id OR receiver_id = rater_id)
  )
);

-- Function to recalculate trust score
CREATE OR REPLACE FUNCTION public.recalculate_trust_score(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed integer;
  v_cancelled integer;
  v_avg_rating numeric;
  v_total_ratings integer;
  v_verification_bonus integer;
  v_score numeric;
BEGIN
  -- Count completed and cancelled trades
  SELECT 
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'cancelled')
  INTO v_completed, v_cancelled
  FROM trades
  WHERE initiator_id = p_profile_id OR receiver_id = p_profile_id;
  
  -- Calculate average rating
  SELECT AVG(rating), COUNT(*)
  INTO v_avg_rating, v_total_ratings
  FROM trade_ratings
  WHERE rated_id = p_profile_id;
  
  -- Calculate verification bonus
  SELECT 
    CASE WHEN id_verified THEN 20 ELSE 0 END +
    CASE WHEN email_verified THEN 5 ELSE 0 END +
    CASE WHEN instagram_verified THEN 5 ELSE 0 END +
    CASE WHEN twitter_verified THEN 5 ELSE 0 END
  INTO v_verification_bonus
  FROM profiles
  WHERE id = p_profile_id;
  
  -- Calculate score (0-100)
  v_score := LEAST(100, 
    COALESCE(v_avg_rating * 10, 25) + -- Up to 50 points from ratings
    LEAST(v_completed * 2, 25) + -- Up to 25 points from completed trades
    v_verification_bonus - -- Up to 35 points from verification
    (v_cancelled * 5) -- Penalty for cancelled trades
  );
  
  -- Upsert trust score
  INSERT INTO trust_scores (profile_id, total_trades_completed, total_trades_cancelled, average_rating, total_ratings, verification_bonus, calculated_score, last_updated)
  VALUES (p_profile_id, v_completed, v_cancelled, v_avg_rating, v_total_ratings, v_verification_bonus, GREATEST(0, v_score), now())
  ON CONFLICT (profile_id) DO UPDATE SET
    total_trades_completed = EXCLUDED.total_trades_completed,
    total_trades_cancelled = EXCLUDED.total_trades_cancelled,
    average_rating = EXCLUDED.average_rating,
    total_ratings = EXCLUDED.total_ratings,
    verification_bonus = EXCLUDED.verification_bonus,
    calculated_score = EXCLUDED.calculated_score,
    last_updated = EXCLUDED.last_updated;
END;
$$;

-- Trigger to update trust score when trade status changes
CREATE OR REPLACE FUNCTION public.trigger_update_trust_scores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM recalculate_trust_score(NEW.initiator_id);
    PERFORM recalculate_trust_score(NEW.receiver_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_trade_status_change
AFTER UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_trust_scores();

-- Trigger to update trust score when rating is added
CREATE OR REPLACE FUNCTION public.trigger_update_trust_score_on_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM recalculate_trust_score(NEW.rated_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_trade_rating_added
AFTER INSERT ON public.trade_ratings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_trust_score_on_rating();