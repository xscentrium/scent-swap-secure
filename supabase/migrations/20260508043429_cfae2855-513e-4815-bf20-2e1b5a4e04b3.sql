-- Verification table: one row per listing
CREATE TABLE public.listing_image_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL UNIQUE,
  image_url text,
  status text NOT NULL DEFAULT 'pending', -- pending | verified | rejected | needs_reupload
  source text,        -- e.g. 'uploaded', host name, or 'unknown'
  reason text,
  reviewed_by uuid,   -- profile id of admin
  reviewed_at timestamptz,
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_liv_status ON public.listing_image_verifications(status);
CREATE INDEX idx_liv_listing ON public.listing_image_verifications(listing_id);

ALTER TABLE public.listing_image_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verifications viewable by everyone"
  ON public.listing_image_verifications FOR SELECT USING (true);

CREATE POLICY "Admins can insert verifications"
  ON public.listing_image_verifications FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update verifications"
  ON public.listing_image_verifications FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete verifications"
  ON public.listing_image_verifications FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_liv_updated_at
  BEFORE UPDATE ON public.listing_image_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: auto-create or refresh pending verification when a listing's image
-- changes (or on insert). Runs as SECURITY DEFINER so the seller's update succeeds
-- without needing admin RLS rights on the verification table.
CREATE OR REPLACE FUNCTION public.enqueue_listing_image_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR (TG_OP = 'UPDATE' AND NEW.image_url IS DISTINCT FROM OLD.image_url) THEN
    INSERT INTO public.listing_image_verifications (listing_id, image_url, status, source, reason, last_checked_at)
    VALUES (NEW.id, NEW.image_url, 'pending', NULL, 'Awaiting verification', now())
    ON CONFLICT (listing_id) DO UPDATE
      SET image_url = EXCLUDED.image_url,
          status = 'pending',
          source = NULL,
          reason = 'Image changed — re-verification queued',
          reviewed_by = NULL,
          reviewed_at = NULL,
          last_checked_at = now(),
          updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enqueue_listing_image_verification
  AFTER INSERT OR UPDATE OF image_url ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_listing_image_verification();

-- Backfill: create a pending row for every existing listing
INSERT INTO public.listing_image_verifications (listing_id, image_url, status, reason)
SELECT l.id, l.image_url, 'pending', 'Backfill — initial verification pending'
FROM public.listings l
ON CONFLICT (listing_id) DO NOTHING;