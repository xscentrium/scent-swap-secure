-- Harden dispute-evidence storage RLS
-- Drop the previous read policy and replace with a stricter one that:
--  * lets the uploader read their own files
--  * lets the OTHER trade party read evidence attached to a trade they're in
--  * lets admins read everything
-- Listing is still constrained by per-row SELECT, so users cannot enumerate
-- other users' folders.

DROP POLICY IF EXISTS "Trade parties and admins can read dispute evidence" ON storage.objects;

CREATE POLICY "Dispute evidence read access"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dispute-evidence'
  AND (
    -- Uploader reads their own files
    auth.uid()::text = (storage.foldername(name))[1]
    -- Admins read everything
    OR public.has_role(auth.uid(), 'admin'::app_role)
    -- Other trade participant reads evidence of a shared trade
    OR EXISTS (
      SELECT 1
      FROM public.trades t
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE t.id::text = (storage.foldername(name))[2]
        AND (t.initiator_id = p.id OR t.receiver_id = p.id)
    )
  )
);

-- Prevent updates/deletes by anyone except admins (evidence is immutable)
DROP POLICY IF EXISTS "Admins can manage dispute evidence" ON storage.objects;
CREATE POLICY "Admins can manage dispute evidence"
ON storage.objects FOR ALL
USING (
  bucket_id = 'dispute-evidence'
  AND public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'dispute-evidence'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);