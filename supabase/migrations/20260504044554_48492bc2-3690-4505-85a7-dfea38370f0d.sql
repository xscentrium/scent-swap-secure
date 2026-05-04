-- 1. Add columns
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS locked_initiator_value numeric,
  ADD COLUMN IF NOT EXISTS locked_receiver_value numeric,
  ADD COLUMN IF NOT EXISTS escrow_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS dispute_reason text,
  ADD COLUMN IF NOT EXISTS disputed_at timestamptz,
  ADD COLUMN IF NOT EXISTS released_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

-- Validation trigger: lock values from listings + compute escrow on insert
CREATE OR REPLACE FUNCTION public.lock_trade_values()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_init_value numeric;
  v_recv_value numeric;
BEGIN
  SELECT COALESCE(estimated_value, price, 0) INTO v_init_value
    FROM public.listings WHERE id = NEW.initiator_listing_id;

  IF NEW.receiver_listing_id IS NOT NULL THEN
    SELECT COALESCE(estimated_value, price, 0) INTO v_recv_value
      FROM public.listings WHERE id = NEW.receiver_listing_id;
  ELSE
    v_recv_value := 0;
  END IF;

  NEW.locked_initiator_value := v_init_value;
  NEW.locked_receiver_value := v_recv_value;
  NEW.escrow_amount_initiator := ROUND(v_init_value * 0.5, 2);
  NEW.escrow_amount_receiver := ROUND(v_recv_value * 0.5, 2);
  NEW.escrow_status := 'pending';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_trade_values_trg ON public.trades;
CREATE TRIGGER lock_trade_values_trg
  BEFORE INSERT ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.lock_trade_values();

-- Prevent tampering with locked values on update
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

DROP TRIGGER IF EXISTS protect_trade_locked_values_trg ON public.trades;
CREATE TRIGGER protect_trade_locked_values_trg
  BEFORE UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.protect_trade_locked_values();

-- 2. ID verification gating
-- Replace listings INSERT policy
DROP POLICY IF EXISTS "Users can create their own listings" ON public.listings;
CREATE POLICY "Users can create their own listings"
ON public.listings FOR INSERT
WITH CHECK (
  owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND (
    listing_type = 'sale'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = owner_id AND p.id_verified = true
    )
  )
);

-- Replace trades INSERT policy: both parties must be ID verified
DROP POLICY IF EXISTS "Users can create trades" ON public.trades;
CREATE POLICY "Users can create trades"
ON public.trades FOR INSERT
WITH CHECK (
  initiator_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = initiator_id AND id_verified = true)
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = receiver_id AND id_verified = true)
);