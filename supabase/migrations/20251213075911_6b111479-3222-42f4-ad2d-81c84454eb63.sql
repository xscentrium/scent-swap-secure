-- Add guardian account linking for users under 16
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_verified boolean DEFAULT false;

-- Add RLS policy for guardian linking
CREATE POLICY "Users can update their guardian" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);