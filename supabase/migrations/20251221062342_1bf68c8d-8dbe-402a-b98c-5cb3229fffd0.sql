-- Create favorites table
CREATE TABLE public.favorite_fragrances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fragrance_name TEXT NOT NULL,
  fragrance_brand TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, fragrance_name, fragrance_brand)
);

-- Enable RLS
ALTER TABLE public.favorite_fragrances ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own favorites"
ON public.favorite_fragrances
FOR SELECT
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can add their own favorites"
ON public.favorite_fragrances
FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can remove their own favorites"
ON public.favorite_fragrances
FOR DELETE
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create function to notify collection owners when their fragrance is reviewed
CREATE OR REPLACE FUNCTION public.notify_review_to_collection_owners()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  reviewer_name TEXT;
  collection_owner RECORD;
BEGIN
  -- Get reviewer's name
  SELECT COALESCE(display_name, username) INTO reviewer_name
  FROM profiles WHERE id = NEW.profile_id;

  -- Find all users who have this fragrance in their collection (except the reviewer)
  FOR collection_owner IN
    SELECT DISTINCT ci.profile_id
    FROM collection_items ci
    WHERE LOWER(ci.name) = LOWER(NEW.fragrance_name)
      AND LOWER(ci.brand) = LOWER(NEW.fragrance_brand)
      AND ci.profile_id != NEW.profile_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      collection_owner.profile_id,
      'fragrance_review',
      'New Review on Your Fragrance',
      reviewer_name || ' reviewed ' || NEW.fragrance_brand || ' ' || NEW.fragrance_name,
      jsonb_build_object(
        'fragrance_name', NEW.fragrance_name,
        'fragrance_brand', NEW.fragrance_brand,
        'review_id', NEW.id,
        'reviewer_id', NEW.profile_id
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for review notifications
CREATE TRIGGER on_fragrance_review_created
  AFTER INSERT ON public.fragrance_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_review_to_collection_owners();