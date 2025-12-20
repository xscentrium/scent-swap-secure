-- Create fragrance reviews table
CREATE TABLE public.fragrance_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fragrance_name TEXT NOT NULL,
  fragrance_brand TEXT NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  longevity_rating INTEGER CHECK (longevity_rating >= 1 AND longevity_rating <= 5),
  sillage_rating INTEGER CHECK (sillage_rating >= 1 AND sillage_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  review_text TEXT,
  pros TEXT[],
  cons TEXT[],
  season_preferences TEXT[],
  occasion_preferences TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, fragrance_name, fragrance_brand)
);

-- Create price history table
CREATE TABLE public.fragrance_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fragrance_name TEXT NOT NULL,
  fragrance_brand TEXT NOT NULL,
  size TEXT NOT NULL,
  price NUMERIC NOT NULL,
  condition TEXT NOT NULL DEFAULT 'excellent',
  source TEXT, -- 'listing', 'trade', 'user_report'
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_price_history_fragrance ON public.fragrance_price_history(fragrance_name, fragrance_brand);
CREATE INDEX idx_fragrance_reviews_fragrance ON public.fragrance_reviews(fragrance_name, fragrance_brand);

-- Enable RLS
ALTER TABLE public.fragrance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragrance_price_history ENABLE ROW LEVEL SECURITY;

-- Reviews policies: everyone can view, users can manage their own
CREATE POLICY "Reviews are viewable by everyone" 
ON public.fragrance_reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own reviews" 
ON public.fragrance_reviews 
FOR INSERT 
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own reviews" 
ON public.fragrance_reviews 
FOR UPDATE 
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own reviews" 
ON public.fragrance_reviews 
FOR DELETE 
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Price history policies: everyone can view, system can insert
CREATE POLICY "Price history is viewable by everyone" 
ON public.fragrance_price_history 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can report prices" 
ON public.fragrance_price_history 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger for updated_at on reviews
CREATE TRIGGER update_fragrance_reviews_updated_at
BEFORE UPDATE ON public.fragrance_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();