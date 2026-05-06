
-- 1) Add error_message column to log so failed removals can be audited with details
ALTER TABLE public.dispute_evidence_log
  ADD COLUMN IF NOT EXISTS error_message text;

-- 2) Server-side trade-participant check before DELETE on dispute-evidence objects
CREATE OR REPLACE FUNCTION public.validate_dispute_evidence_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parts text[];
  trade_uuid uuid;
  actor_profile uuid;
BEGIN
  IF OLD.bucket_id <> 'dispute-evidence' THEN
    RETURN OLD;
  END IF;

  -- Admins can always delete
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN OLD;
  END IF;

  parts := string_to_array(OLD.name, '/');
  IF array_length(parts, 1) < 3 THEN
    RAISE EXCEPTION 'Invalid evidence path';
  END IF;

  BEGIN
    trade_uuid := parts[2]::uuid;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Invalid trade id in evidence path';
  END;

  SELECT id INTO actor_profile FROM public.profiles WHERE user_id = auth.uid();
  IF actor_profile IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.id = trade_uuid
      AND (t.initiator_id = actor_profile OR t.receiver_id = actor_profile)
  ) THEN
    RAISE EXCEPTION 'Only trade participants can remove this evidence';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS validate_dispute_evidence_delete_trg ON storage.objects;
CREATE TRIGGER validate_dispute_evidence_delete_trg
  BEFORE DELETE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_dispute_evidence_delete();

-- 3) Allow clients to log a failed-removal audit entry safely via SECURITY DEFINER RPC
CREATE OR REPLACE FUNCTION public.log_dispute_evidence_failure(
  p_trade_id uuid,
  p_path text,
  p_error text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_profile uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO actor_profile FROM public.profiles WHERE user_id = auth.uid();

  -- Caller must be a participant in the trade
  IF actor_profile IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.id = p_trade_id
      AND (t.initiator_id = actor_profile OR t.receiver_id = actor_profile)
  ) THEN
    RAISE EXCEPTION 'Not a participant in this trade';
  END IF;

  INSERT INTO public.dispute_evidence_log (trade_id, actor_profile_id, actor_user_id, action, path, error_message)
  VALUES (p_trade_id, actor_profile, auth.uid(), 'failed_remove', p_path, LEFT(COALESCE(p_error, ''), 500));
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_dispute_evidence_failure(uuid, text, text) TO authenticated;
