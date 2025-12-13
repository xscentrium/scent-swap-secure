-- Create function to notify on trade messages
CREATE OR REPLACE FUNCTION public.notify_trade_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  other_user_id uuid;
  sender_name text;
BEGIN
  -- Get the sender's display name
  SELECT COALESCE(display_name, username) INTO sender_name
  FROM profiles WHERE id = NEW.sender_id;

  -- Find the other user in the trade
  SELECT CASE 
    WHEN t.initiator_id = NEW.sender_id THEN t.receiver_id
    ELSE t.initiator_id
  END INTO other_user_id
  FROM trades t WHERE t.id = NEW.trade_id;

  -- Create notification for the other user
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    other_user_id,
    'trade_message',
    'New Message',
    sender_name || ' sent you a message',
    jsonb_build_object('trade_id', NEW.trade_id, 'sender_id', NEW.sender_id)
  );

  RETURN NEW;
END;
$$;

-- Create trigger for trade messages
CREATE TRIGGER on_trade_message_created
  AFTER INSERT ON public.trade_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_trade_message();

-- Add RLS policies for admins to manage user roles
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));