-- Create creator_subscriptions table for post notifications
CREATE TABLE public.creator_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subscriber_id, creator_id)
);

-- Enable RLS
ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscriptions" ON public.creator_subscriptions
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = subscriber_id));

CREATE POLICY "Users can subscribe to creators" ON public.creator_subscriptions
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = subscriber_id));

CREATE POLICY "Users can unsubscribe" ON public.creator_subscriptions
  FOR DELETE USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = subscriber_id));

-- Create trigger for new follow notifications
CREATE OR REPLACE FUNCTION public.notify_new_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- Get follower's name
  SELECT COALESCE(display_name, username) INTO follower_name
  FROM profiles WHERE id = NEW.follower_id;

  -- Create notification for the followed user
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.following_id,
    'new_follow',
    'New Follower',
    follower_name || ' started following you',
    jsonb_build_object(
      'follower_id', NEW.follower_id
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_new_follow ON public.follows;
CREATE TRIGGER on_new_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follow();

-- Create trigger for new direct messages
CREATE OR REPLACE FUNCTION public.notify_new_dm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Get sender's name
  SELECT COALESCE(display_name, username) INTO sender_name
  FROM profiles WHERE id = NEW.sender_id;

  -- Create notification for the receiver
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.receiver_id,
    'new_dm',
    'New Message',
    sender_name || ' sent you a message',
    jsonb_build_object(
      'sender_id', NEW.sender_id,
      'message_preview', LEFT(NEW.message, 50)
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_new_dm ON public.direct_messages;
CREATE TRIGGER on_new_dm
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_dm();

-- Create trigger for wishlist matching listings
CREATE OR REPLACE FUNCTION public.notify_wishlist_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wishlist_owner RECORD;
  owner_name TEXT;
BEGIN
  -- Get listing owner's name
  SELECT COALESCE(display_name, username) INTO owner_name
  FROM profiles WHERE id = NEW.owner_id;

  -- Find wishlist items that match this listing
  FOR wishlist_owner IN
    SELECT DISTINCT wi.profile_id
    FROM wishlist_items wi
    WHERE LOWER(wi.name) = LOWER(NEW.name)
      AND LOWER(wi.brand) = LOWER(NEW.brand)
      AND wi.profile_id != NEW.owner_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      wishlist_owner.profile_id,
      'wishlist_match',
      'Wishlist Item Available!',
      NEW.brand || ' ' || NEW.name || ' is now available for ' || 
        CASE WHEN NEW.listing_type = 'trade' THEN 'trade' 
             WHEN NEW.listing_type = 'sale' THEN 'sale' 
             ELSE 'trade/sale' END,
      jsonb_build_object(
        'listing_id', NEW.id,
        'fragrance_name', NEW.name,
        'fragrance_brand', NEW.brand,
        'listing_type', NEW.listing_type,
        'price', NEW.price
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_new_listing_wishlist ON public.listings;
CREATE TRIGGER on_new_listing_wishlist
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_wishlist_match();

-- Create trigger for creator post notifications (SOTD)
CREATE OR REPLACE FUNCTION public.notify_creator_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_name TEXT;
  subscriber RECORD;
BEGIN
  -- Get creator's name
  SELECT COALESCE(display_name, username) INTO creator_name
  FROM profiles WHERE id = NEW.profile_id;

  -- Notify all subscribers
  FOR subscriber IN
    SELECT subscriber_id
    FROM creator_subscriptions
    WHERE creator_id = NEW.profile_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      subscriber.subscriber_id,
      'creator_post',
      'New Post from ' || creator_name,
      creator_name || ' shared their SOTD: ' || NEW.fragrance_brand || ' ' || NEW.fragrance_name,
      jsonb_build_object(
        'creator_id', NEW.profile_id,
        'post_type', 'sotd',
        'post_id', NEW.id,
        'fragrance_name', NEW.fragrance_name,
        'fragrance_brand', NEW.fragrance_brand
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_creator_sotd ON public.scent_logs;
CREATE TRIGGER on_creator_sotd
  AFTER INSERT ON public.scent_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_creator_post();