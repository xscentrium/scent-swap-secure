-- Create collection_items table for "My Collection" (fragrances user owns)
CREATE TABLE public.collection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  size TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wishlist_items table for "Wishlist" (fragrances user wants)
CREATE TABLE public.wishlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  notes TEXT,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Collection items policies
CREATE POLICY "Collection items are viewable by everyone"
ON public.collection_items FOR SELECT
USING (true);

CREATE POLICY "Users can create their own collection items"
ON public.collection_items FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own collection items"
ON public.collection_items FOR UPDATE
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own collection items"
ON public.collection_items FOR DELETE
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Wishlist items policies
CREATE POLICY "Wishlist items are viewable by everyone"
ON public.wishlist_items FOR SELECT
USING (true);

CREATE POLICY "Users can create their own wishlist items"
ON public.wishlist_items FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own wishlist items"
ON public.wishlist_items FOR UPDATE
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own wishlist items"
ON public.wishlist_items FOR DELETE
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));