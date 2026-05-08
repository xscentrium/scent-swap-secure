
-- Map notification.type -> send-trade-email event
CREATE OR REPLACE FUNCTION public.send_email_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event text;
  v_url text;
  v_anon text;
BEGIN
  v_event := CASE NEW.type
    WHEN 'trade_proposal'   THEN 'trade_proposal'
    WHEN 'trade_message'    THEN 'trade_message'
    WHEN 'escrow_held'      THEN 'escrow_held'
    WHEN 'escrow_released'  THEN 'escrow_released'
    WHEN 'escrow_refunded'  THEN 'escrow_refunded'
    WHEN 'escrow_disputed'  THEN 'escrow_disputed'
    WHEN 'id_verification_approved' THEN 'id_verification_approved'
    WHEN 'id_verification_rejected' THEN 'id_verification_rejected'
    WHEN 'receipt_confirmed' THEN 'receipt_confirmed'
    ELSE NULL
  END;

  IF v_event IS NULL THEN
    RETURN NEW;
  END IF;

  v_url := 'https://neuxsthayhuzavuyuouw.supabase.co/functions/v1/send-trade-email';

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object(
      'event', v_event,
      'profile_id', NEW.user_id,
      'data', COALESCE(NEW.data, '{}'::jsonb)
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- never block notification creation if email dispatch fails
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_send_email ON public.notifications;
CREATE TRIGGER notifications_send_email
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.send_email_on_notification();
