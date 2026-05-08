ALTER TABLE public.listing_image_verifications
  ADD CONSTRAINT listing_image_verifications_listing_id_fkey
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;