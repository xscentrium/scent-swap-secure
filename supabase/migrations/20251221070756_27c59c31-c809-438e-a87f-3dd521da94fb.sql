-- Create user_badges table for achievements
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, badge_type)
);

-- Create samples_decants table for sample tracking
CREATE TABLE public.samples_decants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  size_ml NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'sample' CHECK (type IN ('sample', 'decant', 'travel_spray')),
  notes TEXT,
  image_url TEXT,
  acquired_from TEXT,
  acquired_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trade_preferences table for blind matching
CREATE TABLE public.trade_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  preferred_brands TEXT[] DEFAULT '{}',
  preferred_notes TEXT[] DEFAULT '{}',
  avoid_notes TEXT[] DEFAULT '{}',
  min_value NUMERIC DEFAULT 0,
  max_value NUMERIC DEFAULT 1000,
  blind_match_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_feed table for social features
CREATE TABLE public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samples_decants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- user_badges policies
CREATE POLICY "Users can view all badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users can manage their own badges" ON public.user_badges FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- samples_decants policies
CREATE POLICY "Users can view their own samples" ON public.samples_decants FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));
CREATE POLICY "Users can manage their own samples" ON public.samples_decants FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- trade_preferences policies
CREATE POLICY "Users can view their own preferences" ON public.trade_preferences FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));
CREATE POLICY "Users can manage their own preferences" ON public.trade_preferences FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));
CREATE POLICY "System can read preferences for matching" ON public.trade_preferences FOR SELECT USING (blind_match_enabled = true);

-- activity_feed policies
CREATE POLICY "Users can view public activities" ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "Users can create their own activities" ON public.activity_feed FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- Function to award badges automatically
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id UUID;
  v_trade_count INT;
  v_review_count INT;
  v_collection_count INT;
BEGIN
  -- Get profile_id based on the table
  IF TG_TABLE_NAME = 'trades' THEN
    v_profile_id := COALESCE(NEW.initiator_id, NEW.receiver_id);
  ELSIF TG_TABLE_NAME = 'fragrance_reviews' THEN
    v_profile_id := NEW.profile_id;
  ELSIF TG_TABLE_NAME = 'collection_items' THEN
    v_profile_id := NEW.profile_id;
  ELSE
    RETURN NEW;
  END IF;

  -- Count completed trades
  SELECT COUNT(*) INTO v_trade_count FROM trades 
  WHERE (initiator_id = v_profile_id OR receiver_id = v_profile_id) AND status = 'completed';
  
  -- Award trade badges
  IF v_trade_count >= 1 THEN
    INSERT INTO user_badges (profile_id, badge_type, badge_name) 
    VALUES (v_profile_id, 'first_trade', 'First Trade') ON CONFLICT DO NOTHING;
  END IF;
  IF v_trade_count >= 10 THEN
    INSERT INTO user_badges (profile_id, badge_type, badge_name) 
    VALUES (v_profile_id, 'trade_veteran', 'Trade Veteran') ON CONFLICT DO NOTHING;
  END IF;
  IF v_trade_count >= 50 THEN
    INSERT INTO user_badges (profile_id, badge_type, badge_name) 
    VALUES (v_profile_id, 'trade_master', 'Trade Master') ON CONFLICT DO NOTHING;
  END IF;

  -- Count reviews
  SELECT COUNT(*) INTO v_review_count FROM fragrance_reviews WHERE profile_id = v_profile_id;
  
  IF v_review_count >= 5 THEN
    INSERT INTO user_badges (profile_id, badge_type, badge_name) 
    VALUES (v_profile_id, 'reviewer', 'Fragrance Critic') ON CONFLICT DO NOTHING;
  END IF;
  IF v_review_count >= 25 THEN
    INSERT INTO user_badges (profile_id, badge_type, badge_name) 
    VALUES (v_profile_id, 'expert_reviewer', 'Expert Reviewer') ON CONFLICT DO NOTHING;
  END IF;

  -- Count collection items
  SELECT COUNT(*) INTO v_collection_count FROM collection_items WHERE profile_id = v_profile_id;
  
  IF v_collection_count >= 10 THEN
    INSERT INTO user_badges (profile_id, badge_type, badge_name) 
    VALUES (v_profile_id, 'collector', 'Collector') ON CONFLICT DO NOTHING;
  END IF;
  IF v_collection_count >= 50 THEN
    INSERT INTO user_badges (profile_id, badge_type, badge_name) 
    VALUES (v_profile_id, 'connoisseur', 'Connoisseur') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for badge checking
CREATE TRIGGER check_badges_on_trade
AFTER INSERT OR UPDATE ON public.trades
FOR EACH ROW EXECUTE FUNCTION public.check_and_award_badges();

CREATE TRIGGER check_badges_on_review
AFTER INSERT ON public.fragrance_reviews
FOR EACH ROW EXECUTE FUNCTION public.check_and_award_badges();

CREATE TRIGGER check_badges_on_collection
AFTER INSERT ON public.collection_items
FOR EACH ROW EXECUTE FUNCTION public.check_and_award_badges();