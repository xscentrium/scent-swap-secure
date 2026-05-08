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
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              Discover Fragrances
            </h1>
            <p className="text-muted-foreground">
              Get personalized recommendations, explore layering options, and save your favorites
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button variant="outline" asChild>
              <Link to="/compare">
                <GitCompare className="w-4 h-4 mr-2" />
                Compare Fragrances
              </Link>
            </Button>
          </div>

          {search && (
            <Card className="mb-6 p-5">
              <div className="flex items-center gap-2 mb-4">
                <SearchIcon className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-serif text-xl">
                  Results for "<span className="text-primary">{search}</span>"
                </h2>
                <Badge variant="outline" className="ml-auto">{catalogResults?.length ?? 0}</Badge>
              </div>
              {catalogResults && catalogResults.length > 0 ? (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {catalogResults.map((f: any) => (
                    <Link key={f.id} to={`/fragrance/${f.id}`}>
                      <Card className="p-4 hover:border-primary transition flex gap-3">
                        <div className="w-14 h-14 rounded bg-muted overflow-hidden shrink-0">
                          {f.image_url && <img src={f.image_url} alt={f.name} className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground truncate">{f.brand}</p>
                          <p className="font-medium truncate">{f.name}</p>
                          <div className="flex gap-1 mt-1">
                            {f.year && <Badge variant="secondary" className="text-[10px] py-0">{f.year}</Badge>}
                            {f.gender && <Badge variant="outline" className="text-[10px] py-0">{f.gender}</Badge>}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No fragrances found in the catalog yet. Try the <Link className="underline" to="/browse">Browse</Link> page or suggest one to be added.
                </p>
              )}
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Recommendations */}
              <AIRecommendations collection={collection} wishlist={wishlist} />

              {/* Fragrance Layering */}
              <FragranceLayering />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Social Feed - Friends Activity */}
              <SocialFeed />
              
              {/* Trending Fragrances */}
              <TrendingFragrances />
              
              {/* Favorites */}
              <FavoritesManager />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Discover;
