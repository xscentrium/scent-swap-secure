import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from "@/components/SEO";
import { AIRecommendations } from '@/components/AIRecommendations';
import { FragranceLayering } from '@/components/FragranceLayering';
import { FavoritesManager } from '@/components/FavoritesManager';
import { SocialFeed } from '@/components/SocialFeed';
import { TrendingFragrances } from '@/components/TrendingFragrances';
import { FragranceDetailsModal } from '@/components/FragranceDetailsModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  Search as SearchIcon,
  Wand2,
} from 'lucide-react';

const Discover = () => {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const search = params.get('search')?.trim() ?? '';
  const [activeFragrance, setActiveFragrance] = useState<{ name: string; brand: string; imageUrl?: string | null } | null>(null);

  const { data: catalogResults } = useQuery({
    queryKey: ['discover-catalog-search', search],
    queryFn: async () => {
      if (!search) return [];
      const tokens = search.split(/\s+/).filter(t => t.length > 1);
      if (tokens.length === 0) return [];
      // Each token must match either name or brand (AND across tokens, OR within)
      let q = supabase.from('fragrances')
        .select('id, name, brand, year, image_url, gender')
        .eq('approved', true);
      for (const t of tokens) {
        const safe = t.replace(/[%,()]/g, '');
        q = q.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%`);
      }
      const { data } = await q.limit(40);
      let local = data ?? [];

      // If local catalog has few/no matches, hit the live API (auto-imports into DB)
      if (local.length < 5) {
        try {
          const { data: live } = await supabase.functions.invoke('fragrance-search-live', {
            body: null,
            // @ts-ignore — invoke supports query via path; fall back to manual fetch
          });
          // invoke doesn't pass query string, so use direct fetch:
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fragrance-search-live?q=${encodeURIComponent(search)}&limit=30`;
          const r = await fetch(url, {
            headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          });
          if (r.ok) {
            const json = await r.json();
            const remote = (json.results ?? []) as any[];
            const seen = new Set(local.map((f: any) => f.id));
            for (const f of remote) {
              if (!seen.has(f.id)) {
                local.push(f);
                seen.add(f.id);
              }
            }
          }
        } catch (e) {
          console.error('live search failed', e);
        }
      }
      return local;
    },
    enabled: !!search,
  });

  const { data: collection } = useQuery({
    queryKey: ['collection', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('collection_items')
        .select('name, brand')
        .eq('profile_id', profile.id);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('wishlist_items')
        .select('name, brand')
        .eq('profile_id', profile.id);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const moods = [
    { label: 'Fresh', hue: '180 40% 88%', emoji: '🌊', q: 'fresh aquatic' },
    { label: 'Woody', hue: '28 30% 70%', emoji: '🪵', q: 'woody' },
    { label: 'Oud', hue: '20 25% 35%', emoji: '🕌', q: 'oud' },
    { label: 'Floral', hue: '340 35% 85%', emoji: '🌸', q: 'floral' },
    { label: 'Spicy', hue: '14 50% 60%', emoji: '🌶️', q: 'spicy' },
    { label: 'Gourmand', hue: '32 45% 70%', emoji: '🍯', q: 'gourmand vanilla' },
    { label: 'Citrus', hue: '50 70% 75%', emoji: '🍋', q: 'citrus' },
    { label: 'Smoky', hue: '0 0% 40%', emoji: '🔥', q: 'smoky leather' },
  ];

  const occasions = [
    { label: 'Date Night', sub: 'Magnetic, intimate', icon: '🌙' },
    { label: 'Office', sub: 'Polished, restrained', icon: '☕' },
    { label: 'Weekend', sub: 'Easy, expressive', icon: '🌿' },
    { label: 'Black Tie', sub: 'Statement, deep', icon: '🥂' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any } },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SEO
        title="Discover Fragrances & Collectors | Xscentrium"
        description="Curated discovery: trending fragrances, AI recommendations, and collectors to follow on Xscentrium."
        path="/discover"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Discover Fragrances & Collectors",
          url: "https://xscentrium.com/discover",
          description: "Curated discovery: trending fragrances, AI recommendations, and collectors to follow on Xscentrium.",
          isPartOf: { "@type": "WebSite", name: "Xscentrium", url: "https://xscentrium.com/" },
        }}
      />
      {/* Editorial backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-[hsl(var(--gold)/0.08)] blur-3xl" />
        <div className="absolute top-[30%] -right-40 w-[640px] h-[640px] rounded-full bg-accent/30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <main className="relative pt-20 pb-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>

          {search && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <Card className="p-6 border-foreground/20">
                <div className="flex items-center gap-3 mb-5">
                  <SearchIcon className="w-4 h-4" />
                  <h2 className="font-serif text-2xl">
                    Results for <span className="italic">"{search}"</span>
                  </h2>
                  <Badge variant="outline" className="ml-auto">
                    {catalogResults?.length ?? 0}
                  </Badge>
                </div>
                {catalogResults && catalogResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catalogResults.map((f: any) => (
                      <Card key={f.id} className="p-4 hover:border-foreground transition flex flex-col gap-3">
                        <div className="flex gap-3">
                          <div className="w-14 h-14 rounded-sm bg-muted overflow-hidden shrink-0">
                            {f.image_url && (
                              <img
                                src={f.image_url}
                                alt={`${f.brand} ${f.name} bottle`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground truncate">{f.brand}</p>
                            <p className="font-medium truncate">{f.name}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {f.year && (
                                <Badge variant="secondary" className="text-[10px] py-0">
                                  {f.year}
                                </Badge>
                              )}
                              {f.gender && (
                                <Badge variant="outline" className="text-[10px] py-0">
                                  {f.gender}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5 pt-2 border-t border-border/40 mt-auto">
                          <button
                            type="button"
                            onClick={() => setActiveFragrance({ name: f.name, brand: f.brand, imageUrl: f.image_url })}
                            aria-label={`Quick view of ${f.brand} ${f.name}`}
                            className="flex-1 min-w-0 min-h-11 text-[11px] sm:text-xs px-1.5 rounded-sm bg-muted hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition font-medium whitespace-nowrap"
                          >
                            Quick view
                          </button>
                          <Link
                            to={`/fragrance/${f.id}`}
                            aria-label={`Open full page for ${f.brand} ${f.name}`}
                            className="flex-1 min-w-0 min-h-11 inline-flex items-center justify-center text-[11px] sm:text-xs px-1.5 rounded-sm bg-primary/10 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-primary transition font-medium whitespace-nowrap"
                          >
                            Full page →
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No fragrances found in the catalog yet. Try the{' '}
                    <Link className="underline" to="/browse">
                      Browse
                    </Link>{' '}
                    page.
                  </p>
                )}
              </Card>
            </motion.div>
          )}

          {/* HERO — editorial split */}
          <motion.section
            variants={container}
            initial="hidden"
            animate="show"
            className="grid lg:grid-cols-12 gap-10 items-end mb-20"
          >
            <div className="lg:col-span-7">
              <motion.div variants={item} className="flex items-center gap-3 mb-6">
                <div className="h-px w-12 bg-foreground/40" />
                <span className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                  Vol. 01 — Discover
                </span>
              </motion.div>

              <motion.h1
                variants={item}
                className="font-serif font-bold leading-[0.95] tracking-tight text-[clamp(2.75rem,7vw,5.75rem)]"
              >
                The quiet art
                <span className="block italic font-light text-muted-foreground">
                  of finding your
                </span>
                <span className="block">
                  signature{' '}
                  <span className="relative inline-block">
                    scent
                    <span className="absolute left-0 -bottom-1 h-[6px] w-full bg-[hsl(var(--gold)/0.45)] -z-10" />
                  </span>
                  .
                </span>
              </motion.h1>

              <motion.p
                variants={item}
                className="mt-8 text-lg text-muted-foreground max-w-xl leading-relaxed"
              >
                Curated by humans, refined by AI. Explore mood, layer with intent, and follow the
                noses you trust — all in one editorial space.
              </motion.p>

              <motion.div variants={item} className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-none px-7 h-12 tracking-wide">
                  <Link to="/scent-quiz">
                    <Wand2 className="w-4 h-4 mr-2" />
                    Take the Scent Quiz
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-none px-7 h-12 tracking-wide"
                >
                  <Link to="/browse">
                    Browse Library
                    <SearchIcon className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </motion.div>

              {/* Mini stats strip */}
              <motion.dl
                variants={item}
                className="mt-12 grid grid-cols-3 gap-6 max-w-lg border-t border-border pt-6"
              >
                {[
                  { k: '12k+', v: 'Fragrances' },
                  { k: '4.2k', v: 'Verified noses' },
                  { k: '98%', v: 'Match accuracy' },
                ].map((s) => (
                  <div key={s.v}>
                    <dt className="font-serif text-3xl">{s.k}</dt>
                    <dd className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                      {s.v}
                    </dd>
                  </div>
                ))}
              </motion.dl>
            </div>

            {/* Right column — stacked editorial cards */}
            <motion.div variants={item} className="lg:col-span-5 hidden lg:block relative h-[520px]">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="absolute top-0 right-0 w-[78%] h-[88%] rounded-sm overflow-hidden border border-border shadow-2xl bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--secondary))] to-[hsl(var(--muted))]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--gold)/0.25),_transparent_60%)]" />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background/95 to-transparent">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                    Editor's Note
                  </p>
                  <p className="font-serif text-xl leading-snug">
                    "A fragrance is the most intense form of memory."
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">— Jean-Claude Ellena</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute bottom-0 left-0 w-[55%] h-[55%] rounded-sm overflow-hidden border border-border shadow-xl bg-foreground"
              >
                <div className="absolute inset-0 bg-[conic-gradient(from_220deg_at_50%_50%,hsl(var(--gold)/0.4),transparent_60%)]" />
                <div className="absolute inset-0 p-6 flex flex-col justify-between text-background">
                  <Sparkles className="w-5 h-5 text-[hsl(var(--gold))]" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] opacity-70 mb-1">
                      Live now
                    </p>
                    <p className="font-serif text-lg leading-tight">
                      AI is blending<br />your next match
                    </p>
                  </div>
                </div>
                <span className="absolute top-4 right-4 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--gold))] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--gold))]" />
                </span>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* MOOD GRID */}
          <section className="mb-20">
            <div className="flex items-end justify-between mb-7">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  01 — By mood
                </p>
                <h2 className="font-serif text-3xl md:text-4xl">Pick a feeling.</h2>
              </div>
              <Link
                to="/browse"
                className="text-sm story-link hidden sm:inline-block text-muted-foreground hover:text-foreground"
              >
                Explore all
              </Link>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
            >
              {moods.map((m) => (
                <motion.div key={m.label} variants={item}>
                  <Link
                    to={`/browse?notes=${encodeURIComponent(m.q)}`}
                    className="group relative block aspect-[4/5] rounded-sm overflow-hidden border border-border hover:border-foreground/40 transition-colors"
                    style={{ background: `hsl(${m.hue})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />
                    <div className="absolute top-4 left-4 text-3xl opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-transform duration-500">
                      {m.emoji}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="font-serif text-xl tracking-tight">{m.label}</p>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/60 mt-1 translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        Explore →
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* OCCASIONS */}
          <section className="mb-20">
            <div className="mb-7">
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                02 — By occasion
              </p>
              <h2 className="font-serif text-3xl md:text-4xl">Wear it well.</h2>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {occasions.map((o) => (
                <motion.div key={o.label} variants={item}>
                  <Link
                    to={`/discover?search=${encodeURIComponent(o.label)}`}
                    className="group block p-6 rounded-sm border border-border bg-card hover:bg-foreground hover:text-background transition-all duration-500 h-full"
                  >
                    <div className="text-3xl mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1">
                      {o.icon}
                    </div>
                    <p className="font-serif text-xl mb-1">{o.label}</p>
                    <p className="text-xs text-muted-foreground group-hover:text-background/70 transition-colors">
                      {o.sub}
                    </p>
                    <div className="mt-6 flex items-center text-[11px] uppercase tracking-[0.25em] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                      View edit →
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* MAIN GRID */}
          <div className="grid gap-8 lg:grid-cols-3 mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 space-y-10"
            >
              <section id="ai" className="scroll-mt-24">
                <div className="flex items-baseline gap-4 mb-5">
                  <span className="font-serif text-5xl text-foreground/15">03</span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      Curated for you
                    </p>
                    <h2 className="font-serif text-2xl">AI recommendations</h2>
                  </div>
                </div>
                <AIRecommendations collection={collection} wishlist={wishlist} />
              </section>

              <section id="layering" className="scroll-mt-24">
                <div className="flex items-baseline gap-4 mb-5">
                  <span className="font-serif text-5xl text-foreground/15">04</span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      The art of
                    </p>
                    <h2 className="font-serif text-2xl">Layering</h2>
                  </div>
                </div>
                <FragranceLayering />
              </section>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="space-y-8"
            >
              <section id="feed" className="scroll-mt-24">
                <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
                  Friends
                </p>
                <SocialFeed />
              </section>
              <section id="trending" className="scroll-mt-24">
                <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
                  Trending
                </p>
                <TrendingFragrances />
              </section>
              <section id="favorites" className="scroll-mt-24">
                <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
                  Saved
                </p>
                <FavoritesManager />
              </section>
            </motion.aside>
          </div>

          {/* FOOTER QUOTE */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="border-t border-border pt-12 text-center max-w-3xl mx-auto"
          >
            <p className="font-serif italic text-2xl md:text-3xl leading-relaxed text-foreground/80">
              "Perfume is the indispensable complement to the personality of a person — the finishing
              touch on a dress."
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-5">
              — Christian Dior
            </p>
          </motion.div>
        </div>
      </main>
      <FragranceDetailsModal
        open={!!activeFragrance}
        onOpenChange={(v) => !v && setActiveFragrance(null)}
        name={activeFragrance?.name ?? ''}
        brand={activeFragrance?.brand ?? ''}
        imageUrl={activeFragrance?.imageUrl ?? null}
        onSelectSimilar={(name, brand) => setActiveFragrance({ name, brand })}
      />
    </div>
  );
};

export default Discover;
