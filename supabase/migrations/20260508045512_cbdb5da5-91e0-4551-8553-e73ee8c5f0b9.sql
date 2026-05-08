
-- ============== FRAGRANCE CATALOG ==============
CREATE TABLE public.fragrances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  name text NOT NULL,
  slug text UNIQUE,
  year integer,
  gender text CHECK (gender IN ('men','women','unisex')),
  perfumer text,
  description text,
  image_url text,
  source text DEFAULT 'manual',
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand, name, year)
);
CREATE INDEX idx_fragrances_brand_name ON public.fragrances (lower(brand), lower(name));
CREATE INDEX idx_fragrances_search ON public.fragrances USING gin (to_tsvector('simple', brand || ' ' || name));

CREATE TABLE public.fragrance_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fragrance_id uuid NOT NULL REFERENCES public.fragrances(id) ON DELETE CASCADE,
  concentration text NOT NULL DEFAULT 'EDP',
  size_ml numeric NOT NULL,
  batch_year integer,
  barcode text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fragrance_id, concentration, size_ml, batch_year)
);
CREATE INDEX idx_fragrance_variants_fragrance ON public.fragrance_variants(fragrance_id);

CREATE TABLE public.fragrance_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fragrance_id uuid NOT NULL REFERENCES public.fragrances(id) ON DELETE CASCADE,
  note text NOT NULL,
  layer text NOT NULL CHECK (layer IN ('top','middle','base')),
  position integer DEFAULT 0,
  UNIQUE (fragrance_id, note, layer)
);
CREATE INDEX idx_fragrance_notes_note ON public.fragrance_notes (lower(note));
CREATE INDEX idx_fragrance_notes_fragrance ON public.fragrance_notes(fragrance_id);

CREATE TABLE public.fragrance_accords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fragrance_id uuid NOT NULL REFERENCES public.fragrances(id) ON DELETE CASCADE,
  accord text NOT NULL,
  strength integer NOT NULL DEFAULT 50 CHECK (strength BETWEEN 0 AND 100),
  UNIQUE (fragrance_id, accord)
);
CREATE INDEX idx_fragrance_accords_accord ON public.fragrance_accords (lower(accord));
CREATE INDEX idx_fragrance_accords_fragrance ON public.fragrance_accords(fragrance_id);

CREATE TABLE public.fragrance_user_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fragrance_id uuid NOT NULL REFERENCES public.fragrances(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL,
  rating text NOT NULL CHECK (rating IN ('love','like','ok','dislike','hate')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fragrance_id, profile_id)
);
CREATE INDEX idx_fragrance_user_ratings_frag ON public.fragrance_user_ratings(fragrance_id);

CREATE TABLE public.fragrance_season_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fragrance_id uuid NOT NULL REFERENCES public.fragrances(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL,
  tag text NOT NULL CHECK (tag IN ('winter','spring','summer','fall','day','night')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fragrance_id, profile_id, tag)
);
CREATE INDEX idx_fragrance_season_votes_frag ON public.fragrance_season_votes(fragrance_id);

CREATE TABLE public.fragrance_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  brand text NOT NULL,
  name text NOT NULL,
  year integer,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Portfolio linking
ALTER TABLE public.collection_items ADD COLUMN fragrance_id uuid REFERENCES public.fragrances(id);
ALTER TABLE public.collection_items ADD COLUMN variant_id uuid REFERENCES public.fragrance_variants(id);
ALTER TABLE public.collection_items ADD COLUMN portfolio text NOT NULL DEFAULT 'main' CHECK (portfolio IN ('main','wishlist','sold','samples'));
ALTER TABLE public.favorite_fragrances ADD COLUMN fragrance_id uuid REFERENCES public.fragrances(id);
ALTER TABLE public.samples_decants ADD COLUMN fragrance_id uuid REFERENCES public.fragrances(id);
ALTER TABLE public.samples_decants ADD COLUMN variant_id uuid REFERENCES public.fragrance_variants(id);

-- updated_at trigger
CREATE TRIGGER trg_fragrances_updated BEFORE UPDATE ON public.fragrances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.fragrances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragrance_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragrance_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragrance_accords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragrance_user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragrance_season_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragrance_suggestions ENABLE ROW LEVEL SECURITY;

-- Public read for catalog
CREATE POLICY "Catalog public read" ON public.fragrances FOR SELECT USING (approved = true OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins manage fragrances" ON public.fragrances FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Variants public read" ON public.fragrance_variants FOR SELECT USING (true);
CREATE POLICY "Admins manage variants" ON public.fragrance_variants FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Notes public read" ON public.fragrance_notes FOR SELECT USING (true);
CREATE POLICY "Admins manage notes" ON public.fragrance_notes FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Accords public read" ON public.fragrance_accords FOR SELECT USING (true);
CREATE POLICY "Admins manage accords" ON public.fragrance_accords FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "User ratings public read" ON public.fragrance_user_ratings FOR SELECT USING (true);
CREATE POLICY "Users insert own rating" ON public.fragrance_user_ratings FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users update own rating" ON public.fragrance_user_ratings FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users delete own rating" ON public.fragrance_user_ratings FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Season votes public read" ON public.fragrance_season_votes FOR SELECT USING (true);
CREATE POLICY "Users insert own season vote" ON public.fragrance_season_votes FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users delete own season vote" ON public.fragrance_season_votes FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Suggestions own read" ON public.fragrance_suggestions FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Users create suggestions" ON public.fragrance_suggestions FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins update suggestions" ON public.fragrance_suggestions FOR UPDATE USING (has_role(auth.uid(),'admin'::app_role));

-- ============== FORUM ==============
CREATE TABLE public.forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.forum_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  upvotes integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_forum_threads_category ON public.forum_threads(category_id, is_pinned DESC, last_activity_at DESC);

CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL,
  parent_reply_id uuid REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  body text NOT NULL,
  upvotes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_forum_replies_thread ON public.forum_replies(thread_id);

CREATE TABLE public.forum_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('thread','reply')),
  target_id uuid NOT NULL,
  value integer NOT NULL CHECK (value IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, target_type, target_id)
);

CREATE TABLE public.forum_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL
);

CREATE TABLE public.thread_tags (
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.forum_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (thread_id, tag_id)
);

ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories public read" ON public.forum_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.forum_categories FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Threads public read" ON public.forum_threads FOR SELECT USING (true);
CREATE POLICY "Users create threads" ON public.forum_threads FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Authors update own thread" ON public.forum_threads FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authors or admins delete thread" ON public.forum_threads FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Replies public read" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Users create replies" ON public.forum_replies FOR INSERT WITH CHECK (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND NOT EXISTS (SELECT 1 FROM forum_threads WHERE id = thread_id AND is_locked = true)
);
CREATE POLICY "Authors update own reply" ON public.forum_replies FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authors or admins delete reply" ON public.forum_replies FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Votes public read" ON public.forum_votes FOR SELECT USING (true);
CREATE POLICY "Users vote" ON public.forum_votes FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users update own vote" ON public.forum_votes FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users delete own vote" ON public.forum_votes FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tags public read" ON public.forum_tags FOR SELECT USING (true);
CREATE POLICY "Admins manage tags" ON public.forum_tags FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Thread tags public read" ON public.thread_tags FOR SELECT USING (true);
CREATE POLICY "Thread author tags" ON public.thread_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM forum_threads t JOIN profiles p ON p.id = t.profile_id WHERE t.id = thread_id AND p.user_id = auth.uid())
  OR has_role(auth.uid(),'admin'::app_role)
);
CREATE POLICY "Thread author untag" ON public.thread_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM forum_threads t JOIN profiles p ON p.id = t.profile_id WHERE t.id = thread_id AND p.user_id = auth.uid())
  OR has_role(auth.uid(),'admin'::app_role)
);

-- Vote tally trigger
CREATE OR REPLACE FUNCTION public.recount_forum_votes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_target_type text; v_target_id uuid; v_total integer;
BEGIN
  v_target_type := COALESCE(NEW.target_type, OLD.target_type);
  v_target_id   := COALESCE(NEW.target_id, OLD.target_id);
  SELECT COALESCE(SUM(value),0) INTO v_total FROM forum_votes WHERE target_type = v_target_type AND target_id = v_target_id;
  IF v_target_type = 'thread' THEN
    UPDATE forum_threads SET upvotes = v_total WHERE id = v_target_id;
  ELSE
    UPDATE forum_replies SET upvotes = v_total WHERE id = v_target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_forum_votes AFTER INSERT OR UPDATE OR DELETE ON public.forum_votes FOR EACH ROW EXECUTE FUNCTION public.recount_forum_votes();

-- Reply count + last_activity trigger
CREATE OR REPLACE FUNCTION public.bump_thread_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_threads SET reply_count = reply_count + 1, last_activity_at = now() WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_threads SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.thread_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_forum_replies_activity AFTER INSERT OR DELETE ON public.forum_replies FOR EACH ROW EXECUTE FUNCTION public.bump_thread_activity();

CREATE TRIGGER trg_forum_threads_updated BEFORE UPDATE ON public.forum_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== NEWS ==============
CREATE TABLE public.news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  content text,
  source text NOT NULL,
  source_url text NOT NULL UNIQUE,
  image_url text,
  tags text[] DEFAULT '{}',
  is_ai_curated boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_news_published ON public.news_articles(published_at DESC);

ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "News public read" ON public.news_articles FOR SELECT USING (true);
CREATE POLICY "Admins manage news" ON public.news_articles FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Seed forum categories
INSERT INTO public.forum_categories (slug, name, description, position) VALUES
  ('general', 'General Discussion', 'Anything fragrance-related', 1),
  ('reviews', 'Reviews & Reactions', 'Share your thoughts on fragrances', 2),
  ('recommendations', 'Recommendations', 'Looking for your next signature?', 3),
  ('clones-dupes', 'Clones & Dupes', 'Discuss alternatives and dupes', 4),
  ('industry-news', 'Industry News', 'Releases, brand drama, perfumer news', 5),
  ('trades', 'Trades & Marketplace', 'Trade talk and marketplace tips', 6),
  ('niche', 'Niche & Indie', 'Niche houses and small brands', 7);

-- Search RPC
CREATE OR REPLACE FUNCTION public.search_fragrances(q text, lim int DEFAULT 20)
RETURNS TABLE (id uuid, brand text, name text, year integer, image_url text, gender text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id, f.brand, f.name, f.year, f.image_url, f.gender
  FROM fragrances f
  WHERE f.approved = true
    AND (q IS NULL OR q = '' OR f.brand ILIKE '%'||q||'%' OR f.name ILIKE '%'||q||'%' OR (f.brand || ' ' || f.name) ILIKE '%'||q||'%')
  ORDER BY
    CASE WHEN lower(f.name) = lower(q) THEN 0
         WHEN lower(f.brand || ' ' || f.name) ILIKE lower(q)||'%' THEN 1
         ELSE 2 END,
    f.name
  LIMIT lim;
$$;

-- Search by note
CREATE OR REPLACE FUNCTION public.search_fragrances_by_note(note_q text, lim int DEFAULT 50)
RETURNS TABLE (id uuid, brand text, name text, year integer, image_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT f.id, f.brand, f.name, f.year, f.image_url
  FROM fragrances f
  JOIN fragrance_notes n ON n.fragrance_id = f.id
  WHERE f.approved = true AND lower(n.note) LIKE lower(note_q)||'%'
  ORDER BY f.name
  LIMIT lim;
$$;

-- Search by accord
CREATE OR REPLACE FUNCTION public.search_fragrances_by_accord(accord_q text, lim int DEFAULT 50)
RETURNS TABLE (id uuid, brand text, name text, year integer, image_url text, strength integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id, f.brand, f.name, f.year, f.image_url, a.strength
  FROM fragrances f
  JOIN fragrance_accords a ON a.fragrance_id = f.id
  WHERE f.approved = true AND lower(a.accord) = lower(accord_q)
  ORDER BY a.strength DESC, f.name
  LIMIT lim;
$$;
