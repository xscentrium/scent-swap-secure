
-- Validate trade status transitions and escrow lifecycle
CREATE OR REPLACE FUNCTION public.validate_trade_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean := false;
BEGIN
  -- Skip if status unchanged
  IF NEW.status::text = OLD.status::text 
     AND COALESCE(NEW.escrow_status,'') = COALESCE(OLD.escrow_status,'') THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO v_is_admin;
  ELSE
    -- Allow service role / triggers
    v_is_admin := true;
  END IF;

  -- Validate status transitions
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
      WHEN 'completed' THEN
        RAISE EXCEPTION 'Completed trades cannot change status';
      WHEN 'cancelled' THEN
        RAISE EXCEPTION 'Cancelled trades cannot change status';
      ELSE
        NULL;
    END CASE;
  END IF;

  -- Auto-derive escrow_status to ensure consistency
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
    END IF;
  END IF;

  -- Validate escrow status values
  IF NEW.escrow_status NOT IN ('pending','held','released','refunded','disputed') THEN
    RAISE EXCEPTION 'Invalid escrow_status: %', NEW.escrow_status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_trade_transition ON public.trades;
CREATE TRIGGER trg_validate_trade_transition
BEFORE UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.validate_trade_transition();

-- Ensure protect_locked_values trigger is attached too
DROP TRIGGER IF EXISTS trg_protect_trade_locked_values ON public.trades;
CREATE TRIGGER trg_protect_trade_locked_values
BEFORE UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.protect_trade_locked_values();

-- Lock initial values trigger
DROP TRIGGER IF EXISTS trg_lock_trade_values ON public.trades;
CREATE TRIGGER trg_lock_trade_values
BEFORE INSERT ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.lock_trade_values();

-- Trust score recalc trigger
DROP TRIGGER IF EXISTS trg_trades_trust_scores ON public.trades;
CREATE TRIGGER trg_trades_trust_scores
AFTER UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_trust_scores();
