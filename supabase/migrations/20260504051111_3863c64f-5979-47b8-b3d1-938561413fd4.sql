-- 1. Add dispute evidence column
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS dispute_evidence_urls text[] DEFAULT '{}'::text[];

-- 2. Storage bucket for dispute evidence (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispute-evidence', 'dispute-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload to a folder named with their auth uid
CREATE POLICY "Trade parties can upload dispute evidence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dispute-evidence'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Trade parties + admins can read
CREATE POLICY "Trade parties and admins can read dispute evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dispute-evidence'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- 3. Notifications on escrow_status changes
CREATE OR REPLACE FUNCTION public.notify_escrow_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  init_user uuid;
  recv_user uuid;
  title_text text;
  msg_text text;
BEGIN
  IF COALESCE(NEW.escrow_status,'') = COALESCE(OLD.escrow_status,'') THEN
    RETURN NEW;
  END IF;

  CASE NEW.escrow_status
    WHEN 'held'     THEN title_text := 'Escrow Held';     msg_text := 'Escrow has been locked for your trade.';
    WHEN 'released' THEN title_text := 'Escrow Released'; msg_text := 'Escrow has been released — trade complete.';
    WHEN 'refunded' THEN title_text := 'Escrow Refunded'; msg_text := 'Escrow has been refunded to both parties.';
    WHEN 'disputed' THEN title_text := 'Trade Disputed';  msg_text := 'A dispute has been opened on your trade.';
    ELSE RETURN NEW;
  END CASE;

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES
    (NEW.initiator_id, 'escrow_' || NEW.escrow_status, title_text, msg_text, jsonb_build_object('trade_id', NEW.id, 'escrow_status', NEW.escrow_status)),
    (NEW.receiver_id,  'escrow_' || NEW.escrow_status, title_text, msg_text, jsonb_build_object('trade_id', NEW.id, 'escrow_status', NEW.escrow_status));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trades_notify_escrow_change ON public.trades;
CREATE TRIGGER trades_notify_escrow_change
AFTER UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.notify_escrow_status_change();