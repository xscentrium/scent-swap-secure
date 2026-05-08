import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { AIRecommendations } from '@/components/AIRecommendations';
import { FragranceLayering } from '@/components/FragranceLayering';
import { FavoritesManager } from '@/components/FavoritesManager';
import { SocialFeed } from '@/components/SocialFeed';
import { TrendingFragrances } from '@/components/TrendingFragrances';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  GitCompare,
  Search as SearchIcon,
  Layers,
  Heart,
  TrendingUp,
  Users,
  Wand2,
  Compass,
} from 'lucide-react';

const Discover = () => {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const search = params.get('search')?.trim() ?? '';

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

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-40 -right-40 w-[520px] h-[520px] rounded-full bg-accent/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <main className="relative pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>

          {/* Editorial header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs uppercase tracking-[0.18em] text-primary mb-5">
              <Compass className="w-3.5 h-3.5" />
              Discover
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Find your next
              <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                signature scent.
              </span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
              AI-curated recommendations, expert layering pairings, and a live pulse on what the
              community is wearing right now.
            </p>

            {/* Quick action chips */}
            <div className="mt-7 flex flex-wrap gap-3">
              {[
                { icon: Wand2, label: 'AI Picks', href: '#ai' },
                { icon: Layers, label: 'Layering', href: '#layering' },
                { icon: GitCompare, label: 'Compare', href: '/compare' },
                { icon: TrendingUp, label: 'Trending', href: '#trending' },
                { icon: Users, label: 'Friends', href: '#feed' },
                { icon: Heart, label: 'Favorites', href: '#favorites' },
              ].map((c) =>
                c.href.startsWith('#') ? (
                  <a
                    key={c.label}
                    href={c.href}
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/60 bg-card/50 backdrop-blur text-sm hover:border-primary/50 hover:bg-card transition-all"
                  >
                    <c.icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                    {c.label}
                  </a>
                ) : (
                  <Link
                    key={c.label}
                    to={c.href}
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/60 bg-card/50 backdrop-blur text-sm hover:border-primary/50 hover:bg-card transition-all"
                  >
                    <c.icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                    {c.label}
                  </Link>
                )
              )}
            </div>
          </motion.div>

          {search && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <Card className="p-6 border-primary/20">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <SearchIcon className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-serif text-2xl">
                    Results for{' '}
                    <span className="italic text-primary">"{search}"</span>
                  </h2>
                  <Badge variant="outline" className="ml-auto">
                    {catalogResults?.length ?? 0}
                  </Badge>
                </div>
                {catalogResults && catalogResults.length > 0 ? (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {catalogResults.map((f: any) => (
                      <Link key={f.id} to={`/fragrance/${f.id}`}>
                        <Card className="p-4 hover:border-primary transition flex gap-3">
                          <div className="w-14 h-14 rounded bg-muted overflow-hidden shrink-0">
                            {f.image_url && (
                              <img
                                src={f.image_url}
                                alt={f.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground truncate">{f.brand}</p>
                            <p className="font-medium truncate">{f.name}</p>
                            <div className="flex gap-1 mt-1">
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
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No fragrances found in the catalog yet. Try the{' '}
                    <Link className="underline" to="/browse">
                      Browse
                    </Link>{' '}
                    page or suggest one to be added.
                  </p>
                )}
              </Card>
            </motion.div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <section id="ai" className="scroll-mt-24">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Wand2 className="w-4 h-4 text-primary" />
                  <h2 className="font-serif text-xl">Curated for you</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent ml-2" />
                </div>
                <AIRecommendations collection={collection} wishlist={wishlist} />
              </section>

              <section id="layering" className="scroll-mt-24">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Layers className="w-4 h-4 text-primary" />
                  <h2 className="font-serif text-xl">The art of layering</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent ml-2" />
                </div>
                <FragranceLayering />
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <section id="feed" className="scroll-mt-24">
                <SocialFeed />
              </section>
              <section id="trending" className="scroll-mt-24">
                <TrendingFragrances />
              </section>
              <section id="favorites" className="scroll-mt-24">
                <FavoritesManager />
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Discover;
