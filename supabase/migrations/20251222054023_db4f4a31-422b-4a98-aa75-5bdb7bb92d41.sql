-- Create user_blocks table
CREATE TABLE public.user_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create user_reports table
CREATE TABLE public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id)
);

-- Create direct_messages table
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_likes table (for SOTD logs and collection items)
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL, -- 'sotd', 'collection'
  post_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, post_type, post_id)
);

-- Create post_comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL, -- 'sotd', 'collection'
  post_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_blocks
CREATE POLICY "Users can view their own blocks" ON public.user_blocks
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = blocker_id));

CREATE POLICY "Users can create blocks" ON public.user_blocks
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = blocker_id));

CREATE POLICY "Users can delete their own blocks" ON public.user_blocks
  FOR DELETE USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = blocker_id));

-- RLS Policies for user_reports
CREATE POLICY "Users can view their own reports" ON public.user_reports
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = reporter_id));

CREATE POLICY "Users can create reports" ON public.user_reports
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = reporter_id));

CREATE POLICY "Admins can view all reports" ON public.user_reports
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports" ON public.user_reports
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for direct_messages
CREATE POLICY "Users can view their own messages" ON public.direct_messages
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = sender_id) OR
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = receiver_id)
  );

CREATE POLICY "Users can send messages" ON public.direct_messages
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = sender_id) AND
    NOT EXISTS (SELECT 1 FROM user_blocks WHERE blocker_id = receiver_id AND blocked_id = sender_id)
  );

CREATE POLICY "Users can mark messages as read" ON public.direct_messages
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = receiver_id));

-- RLS Policies for post_likes
CREATE POLICY "Anyone can view likes" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can add likes" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = profile_id));

CREATE POLICY "Users can remove their likes" ON public.post_likes
  FOR DELETE USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = profile_id));

-- RLS Policies for post_comments
CREATE POLICY "Anyone can view comments" ON public.post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can add comments" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = profile_id));

CREATE POLICY "Users can delete their own comments" ON public.post_comments
  FOR DELETE USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = profile_id));

-- Enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;