-- ============ trade_shipments ============
CREATE TABLE IF NOT EXISTS public.trade_shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL,
  sender_profile_id UUID NOT NULL,
  recipient_profile_id UUID NOT NULL,
  carrier TEXT NOT NULL,
  tracking_number TEXT NOT NULL,
  tracking_url TEXT,
  label_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trade_id, sender_profile_id),
  CHECK (status IN ('pending','label_created','in_transit','delivered','exception','returned'))
);

ALTER TABLE public.trade_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trade parties can view shipments"
ON public.trade_shipments FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.trades t
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE t.id = trade_shipments.trade_id
      AND (t.initiator_id = p.id OR t.receiver_id = p.id)
  )
);

CREATE POLICY "Sender can create their shipment"
ON public.trade_shipments FOR INSERT
WITH CHECK (
  sender_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.id = trade_shipments.trade_id
      AND (t.initiator_id = sender_profile_id OR t.receiver_id = sender_profile_id)
  )
);

CREATE POLICY "Sender can update their shipment"
ON public.trade_shipments FOR UPDATE
USING (
  sender_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE TRIGGER trg_trade_shipments_updated_at
BEFORE UPDATE ON public.trade_shipments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_trade_shipments_trade ON public.trade_shipments(trade_id);

-- ============ listing_authenticity_flags ============
CREATE TABLE IF NOT EXISTS public.listing_authenticity_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  voter_profile_id UUID NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('authentic','suspicious')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, voter_profile_id)
);

ALTER TABLE public.listing_authenticity_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticity flags are viewable by everyone"
ON public.listing_authenticity_flags FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.listing_authenticity_flags FOR INSERT
WITH CHECK (
  voter_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Voter can update their vote"
ON public.listing_authenticity_flags FOR UPDATE
USING (voter_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Voter can delete their vote"
ON public.listing_authenticity_flags FOR DELETE
USING (voter_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_authflags_listing ON public.listing_authenticity_flags(listing_id);

-- ============ listing_batch_codes ============
CREATE TABLE IF NOT EXISTS public.listing_batch_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL UNIQUE,
  owner_profile_id UUID NOT NULL,
  batch_code TEXT NOT NULL,
  decoded_year INT,
  decoded_factory TEXT,
  ai_plausibility_score INT,           -- 0..100
  ai_verdict TEXT,                     -- 'plausible' | 'questionable' | 'unknown'
  ai_explanation TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_batch_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Batch codes are viewable by everyone"
ON public.listing_batch_codes FOR SELECT USING (true);

CREATE POLICY "Listing owner can insert their batch code"
ON public.listing_batch_codes FOR INSERT
WITH CHECK (
  owner_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.listings l WHERE l.id = listing_batch_codes.listing_id AND l.owner_id = owner_profile_id
  )
);

CREATE POLICY "Listing owner can update their batch code"
ON public.listing_batch_codes FOR UPDATE
USING (owner_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Listing owner can delete their batch code"
ON public.listing_batch_codes FOR DELETE
USING (owner_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE TRIGGER trg_listing_batch_codes_updated_at
BEFORE UPDATE ON public.listing_batch_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Storage: shipping-labels bucket ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('shipping-labels','shipping-labels', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Trade parties can read shipping labels"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'shipping-labels'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      auth.uid() IS NOT NULL
      AND (string_to_array(name, '/'))[1] = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1
      FROM public.trade_shipments s
      JOIN public.trades t ON t.id = s.trade_id
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE s.label_url LIKE '%' || name
        AND (t.initiator_id = p.id OR t.receiver_id = p.id)
    )
  )
);

CREATE POLICY "Users can upload their own shipping labels"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shipping-labels'
  AND auth.uid() IS NOT NULL
  AND (string_to_array(name, '/'))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own shipping labels"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'shipping-labels'
  AND auth.uid() IS NOT NULL
  AND (string_to_array(name, '/'))[1] = auth.uid()::text
);