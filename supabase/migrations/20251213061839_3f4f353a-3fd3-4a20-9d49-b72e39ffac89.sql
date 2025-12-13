-- Create function to notify user when a trade is proposed
CREATE OR REPLACE FUNCTION public.notify_trade_proposal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify the receiver about the trade proposal
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.receiver_id,
    'trade_proposal',
    'New Trade Proposal',
    'Someone wants to trade with you!',
    jsonb_build_object('trade_id', NEW.id, 'initiator_id', NEW.initiator_id)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for trade proposals
CREATE TRIGGER on_trade_created
  AFTER INSERT ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_trade_proposal();

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);