-- Create enum for trade status
CREATE TYPE public.trade_status AS ENUM ('pending', 'accepted', 'escrow_held', 'completed', 'cancelled', 'disputed');

-- Create trades table for the escrow/trade workflow
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  initiator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  initiator_listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  receiver_listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  status trade_status NOT NULL DEFAULT 'pending',
  escrow_amount_initiator NUMERIC,
  escrow_amount_receiver NUMERIC,
  initiator_confirmed BOOLEAN DEFAULT false,
  receiver_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Trade policies
CREATE POLICY "Users can view trades they are involved in"
ON public.trades
FOR SELECT
USING (
  initiator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR receiver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create trades"
ON public.trades
FOR INSERT
WITH CHECK (
  initiator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update trades they are involved in"
ON public.trades
FOR UPDATE
USING (
  initiator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR receiver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_trades_updated_at
BEFORE UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create messages table for trade conversations
CREATE TABLE public.trade_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trade_messages ENABLE ROW LEVEL SECURITY;

-- Message policies
CREATE POLICY "Users can view messages for their trades"
ON public.trade_messages
FOR SELECT
USING (
  trade_id IN (
    SELECT id FROM trades 
    WHERE initiator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their trades"
ON public.trade_messages
FOR INSERT
WITH CHECK (
  sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND trade_id IN (
    SELECT id FROM trades 
    WHERE initiator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);