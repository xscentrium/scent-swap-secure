
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS disputed_by uuid,
  ADD COLUMN IF NOT EXISTS resolved_by uuid,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- Allow these to be set during status transitions
CREATE OR REPLACE FUNCTION public.protect_trade_locked_values()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.locked_initiator_value IS DISTINCT FROM OLD.locked_initiator_value
     OR NEW.locked_receiver_value IS DISTINCT FROM OLD.locked_receiver_value
     OR NEW.escrow_amount_initiator IS DISTINCT FROM OLD.escrow_amount_initiator
     OR NEW.escrow_amount_receiver IS DISTINCT FROM OLD.escrow_amount_receiver
     OR NEW.initiator_listing_id IS DISTINCT FROM OLD.initiator_listing_id
     OR NEW.receiver_listing_id IS DISTINCT FROM OLD.receiver_listing_id THEN
    RAISE EXCEPTION 'Locked trade values cannot be modified';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_trade_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean := false;
  v_actor_profile uuid;
BEGIN
  IF NEW.status::text = OLD.status::text 
     AND COALESCE(NEW.escrow_status,'') = COALESCE(OLD.escrow_status,'') THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO v_is_admin;
    SELECT id INTO v_actor_profile FROM public.profiles WHERE user_id = auth.uid();
  ELSE
    v_is_admin := true;
  END IF;

  IF NEW.status::text <> OLD.status::text THEN
    CASE OLD.status::text
      WHEN 'pending' THEN
        IF NEW.status::text NOT IN ('accepted','cancelled') THEN
          RAISE EXCEPTION 'Invalid status transition from pending to %', NEW.status;
        END IF;
      WHEN 'accepted' THEN
        IF NEW.status::text NOT IN ('completed','disputed') THEN
          RAISE EXCEPTION 'Invalid status transition from accepted to %. Cancellation is only allowed before acceptance.', NEW.status;
        END IF;
      WHEN 'disputed' THEN
        IF NOT v_is_admin THEN
          RAISE EXCEPTION 'Only admins can resolve disputed trades';
        END IF;
        IF NEW.status::text NOT IN ('completed','cancelled') THEN
          RAISE EXCEPTION 'Disputed trades can only be resolved as completed or cancelled';
        END IF;
        NEW.resolved_by := v_actor_profile;
        NEW.resolved_at := COALESCE(NEW.resolved_at, now());
      WHEN 'completed' THEN
        RAISE EXCEPTION 'Completed trades cannot change status';
      WHEN 'cancelled' THEN
        RAISE EXCEPTION 'Cancelled trades cannot change status';
      ELSE
        NULL;
    END CASE;
  END IF;

  IF NEW.status::text <> OLD.status::text THEN
    IF NEW.status::text = 'accepted' THEN
      NEW.escrow_status := 'held';
    ELSIF NEW.status::text = 'cancelled' THEN
      NEW.escrow_status := 'refunded';
      NEW.refunded_at := COALESCE(NEW.refunded_at, now());
    ELSIF NEW.status::text = 'completed' THEN
      NEW.escrow_status := 'released';
      NEW.released_at := COALESCE(NEW.released_at, now());
    ELSIF NEW.status::text = 'disputed' THEN
      NEW.escrow_status := 'disputed';
      NEW.disputed_at := COALESCE(NEW.disputed_at, now());
      NEW.disputed_by := COALESCE(NEW.disputed_by, v_actor_profile);
    END IF;
  END IF;

  IF NEW.escrow_status NOT IN ('pending','held','released','refunded','disputed') THEN
    RAISE EXCEPTION 'Invalid escrow_status: %', NEW.escrow_status;
  END IF;

  RETURN NEW;
END;
$$;
