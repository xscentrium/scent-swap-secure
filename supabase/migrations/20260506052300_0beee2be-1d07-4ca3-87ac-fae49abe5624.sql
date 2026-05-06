
-- 1) Escrow events log
CREATE TABLE public.escrow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  actor_user_id uuid,
  actor_profile_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_escrow_events_trade ON public.escrow_events(trade_id, created_at);

ALTER TABLE public.escrow_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trade parties and admins can view escrow events"
ON public.escrow_events FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM trades t
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE t.id = escrow_events.trade_id
      AND (t.initiator_id = p.id OR t.receiver_id = p.id)
  )
);

-- 2) Two-party "I received" columns
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS initiator_received boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS receiver_received boolean NOT NULL DEFAULT false;

-- 3) Trigger to record escrow transitions
CREATE OR REPLACE FUNCTION public.record_escrow_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_profile uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT id INTO actor_profile FROM profiles WHERE user_id = auth.uid();
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO escrow_events (trade_id, event_type, to_status, actor_user_id, actor_profile_id, metadata)
    VALUES (NEW.id, 'created', NEW.escrow_status, auth.uid(), actor_profile,
            jsonb_build_object('escrow_amount_initiator', NEW.escrow_amount_initiator,
                               'escrow_amount_receiver', NEW.escrow_amount_receiver));
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.escrow_status,'') IS DISTINCT FROM COALESCE(OLD.escrow_status,'') THEN
    INSERT INTO escrow_events (trade_id, event_type, from_status, to_status, actor_user_id, actor_profile_id)
    VALUES (NEW.id, NEW.escrow_status, OLD.escrow_status, NEW.escrow_status, auth.uid(), actor_profile);
  END IF;

  IF NEW.initiator_received IS DISTINCT FROM OLD.initiator_received AND NEW.initiator_received = true THEN
    INSERT INTO escrow_events (trade_id, event_type, actor_user_id, actor_profile_id, metadata)
    VALUES (NEW.id, 'initiator_received', auth.uid(), actor_profile, '{}'::jsonb);
  END IF;
  IF NEW.receiver_received IS DISTINCT FROM OLD.receiver_received AND NEW.receiver_received = true THEN
    INSERT INTO escrow_events (trade_id, event_type, actor_user_id, actor_profile_id, metadata)
    VALUES (NEW.id, 'receiver_received', auth.uid(), actor_profile, '{}'::jsonb);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_escrow_event_ins ON public.trades;
CREATE TRIGGER trg_record_escrow_event_ins
AFTER INSERT ON public.trades
FOR EACH ROW EXECUTE FUNCTION public.record_escrow_event();

DROP TRIGGER IF EXISTS trg_record_escrow_event_upd ON public.trades;
CREATE TRIGGER trg_record_escrow_event_upd
AFTER UPDATE ON public.trades
FOR EACH ROW EXECUTE FUNCTION public.record_escrow_event();

-- 4) Update validate_trade_transition: completion requires both-received (or admin)
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
        -- Require BOTH parties to confirm receipt before completion (admin override allowed)
        IF NEW.status::text = 'completed' AND NOT v_is_admin THEN
          IF NOT (COALESCE(NEW.initiator_received, false) AND COALESCE(NEW.receiver_received, false)) THEN
            RAISE EXCEPTION 'Both parties must confirm "I received it" before escrow can release';
          END IF;
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
      ELSE NULL;
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
