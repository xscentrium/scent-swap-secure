-- Fix trust_scores policy to be more restrictive
-- Trust scores should only be managed by database triggers/functions, not direct client access

DROP POLICY IF EXISTS "System can manage trust scores" ON trust_scores;

-- Create separate policies for different operations
-- SELECT: Everyone can view trust scores (needed for profile display)
-- Already exists: "Trust scores are viewable by everyone"

-- INSERT/UPDATE/DELETE: Only via database triggers (when auth.uid() is null)
-- This prevents direct client manipulation while allowing trigger-based updates
CREATE POLICY "System can manage trust scores"
ON trust_scores FOR ALL
USING (auth.uid() IS NULL)
WITH CHECK (auth.uid() IS NULL);