-- Create search analytics table
CREATE TABLE public.search_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  filter_type TEXT NOT NULL DEFAULT 'all',
  results_count INTEGER NOT NULL DEFAULT 0,
  profile_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast queries on popular searches
CREATE INDEX idx_search_analytics_query ON public.search_analytics(query);
CREATE INDEX idx_search_analytics_created_at ON public.search_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert search analytics (even anonymous users)
CREATE POLICY "Anyone can insert search analytics"
ON public.search_analytics
FOR INSERT
WITH CHECK (true);

-- Only admins can view all analytics
CREATE POLICY "Admins can view all search analytics"
ON public.search_analytics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own search history
CREATE POLICY "Users can view their own search history"
ON public.search_analytics
FOR SELECT
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));