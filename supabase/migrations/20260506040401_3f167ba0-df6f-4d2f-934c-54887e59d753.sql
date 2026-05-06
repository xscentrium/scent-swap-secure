-- 1. Audit log table for dispute evidence actions
CREATE TABLE IF NOT EXISTS public.dispute_evidence_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL,
  actor_profile_id uuid,
  actor_user_id uuid,
  action text NOT NULL CHECK (action IN ('added','removed')),
  path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispute_evidence_log_trade ON public.dispute_evidence_log(trade_id, created_at);

ALTER TABLE public.dispute_evidence_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trade parties and admins can view evidence log" ON public.dispute_evidence_log;
CREATE POLICY "Trade parties and admins can view evidence log"
ON public.dispute_evidence_log FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.trades t
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE t.id = dispute_evidence_log.trade_id
      AND (t.initiator_id = p.id OR t.receiver_id = p.id)
  )
);

-- 2. Server-side validation + audit trigger on storage.objects for dispute-evidence
CREATE OR REPLACE FUNCTION public.validate_dispute_evidence_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  parts text[];
  uid_part text;
  trade_uuid uuid;
  mime text;
  size_bytes bigint;
  existing_count int;
  actor_profile uuid;
  allowed_mimes text[] := ARRAY[
    'image/png','image/jpeg','image/jpg','image/webp','image/heic','image/heif','application/pdf'
  ];
BEGIN
  IF NEW.bucket_id <> 'dispute-evidence' THEN
    RETURN NEW;
  END IF;

  parts := string_to_array(NEW.name, '/');
  IF array_length(parts, 1) < 3 THEN
    RAISE EXCEPTION 'Invalid evidence path. Expected <user-id>/<trade-id>/<filename>';
  END IF;

  uid_part := parts[1];
  IF uid_part <> auth.uid()::text THEN
    RAISE EXCEPTION 'You can only upload evidence to your own folder';
  END IF;

  BEGIN
    trade_uuid := parts[2]::uuid;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Invalid trade id in evidence path';
  END;

  -- Must be a participant in the trade
  SELECT id INTO actor_profile FROM public.profiles WHERE user_id = auth.uid();
  IF actor_profile IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.id = trade_uuid
      AND (t.initiator_id = actor_profile OR t.receiver_id = actor_profile)
  ) THEN
    RAISE EXCEPTION 'You are not a participant in this trade';
  END IF;

  -- MIME type validation
  mime := lower(coalesce(NEW.metadata->>'mimetype', ''));
  IF mime <> '' AND NOT (mime = ANY(allowed_mimes)) THEN
    RAISE EXCEPTION 'Unsupported file type %. Allowed: JPG, PNG, WEBP, HEIC, PDF', mime;
  END IF;

  -- Size validation (10 MB)
  size_bytes := COALESCE((NEW.metadata->>'size')::bigint, 0);
  IF size_bytes > 10 * 1024 * 1024 THEN
    RAISE EXCEPTION 'File exceeds 10 MB limit';
  END IF;

  -- Count validation (max 5 per trade folder)
  SELECT count(*) INTO existing_count
  FROM storage.objects o
  WHERE o.bucket_id = 'dispute-evidence'
    AND (string_to_array(o.name, '/'))[1] = uid_part
    AND (string_to_array(o.name, '/'))[2] = parts[2];
  IF existing_count >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 evidence files per trade';
  END IF;

  -- Audit
  INSERT INTO public.dispute_evidence_log (trade_id, actor_profile_id, actor_user_id, action, path)
  VALUES (trade_uuid, actor_profile, auth.uid(), 'added', NEW.name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dispute_evidence_validate ON storage.objects;
CREATE TRIGGER dispute_evidence_validate
BEFORE INSERT ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION public.validate_dispute_evidence_upload();

CREATE OR REPLACE FUNCTION public.log_dispute_evidence_remove()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  parts text[];
  trade_uuid uuid;
  actor_profile uuid;
BEGIN
  IF OLD.bucket_id <> 'dispute-evidence' THEN
    RETURN OLD;
  END IF;
  parts := string_to_array(OLD.name, '/');
  IF array_length(parts, 1) < 3 THEN
    RETURN OLD;
  END IF;
  BEGIN
    trade_uuid := parts[2]::uuid;
  EXCEPTION WHEN others THEN
    RETURN OLD;
  END;
  SELECT id INTO actor_profile FROM public.profiles WHERE user_id = auth.uid();
  INSERT INTO public.dispute_evidence_log (trade_id, actor_profile_id, actor_user_id, action, path)
  VALUES (trade_uuid, actor_profile, auth.uid(), 'removed', OLD.name);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS dispute_evidence_log_remove ON storage.objects;
CREATE TRIGGER dispute_evidence_log_remove
AFTER DELETE ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION public.log_dispute_evidence_remove();

-- 3. Tighten read access: require well-formed path and trade participation/admin
DROP POLICY IF EXISTS "Dispute evidence read access" ON storage.objects;
CREATE POLICY "Dispute evidence read access"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dispute-evidence'
  AND array_length(string_to_array(name, '/'), 1) >= 3
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (auth.uid() IS NOT NULL AND auth.uid()::text = (string_to_array(name, '/'))[1])
    OR EXISTS (
      SELECT 1
      FROM public.trades t
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE t.id::text = (string_to_array(name, '/'))[2]
        AND (t.initiator_id = p.id OR t.receiver_id = p.id)
    )
  )
);

-- Allow uploaders (and admins) to delete their own evidence; covered by the
-- existing admin policy + uploader check below.
DROP POLICY IF EXISTS "Uploaders can delete their dispute evidence" ON storage.objects;
CREATE POLICY "Uploaders can delete their dispute evidence"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dispute-evidence'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);