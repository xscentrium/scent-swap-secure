-- Create function to notify collection owners when someone reviews a fragrance they own
CREATE OR REPLACE FUNCTION public.notify_review_to_collection_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create trigger for new reviews
DROP TRIGGER IF EXISTS on_review_created_notify_owners ON public.fragrance_reviews;
CREATE TRIGGER on_review_created_notify_owners
AFTER INSERT ON public.fragrance_reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_review_to_collection_owners();