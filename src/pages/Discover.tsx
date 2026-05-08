import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
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
import { ArrowLeft, Sparkles, GitCompare, Search as SearchIcon } from 'lucide-react';

const Discover = () => {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const search = params.get('search')?.trim() ?? '';

  const { data: catalogResults } = useQuery({
    queryKey: ['discover-catalog-search', search],
    queryFn: async () => {
      if (!search) return [];
      const { data } = await supabase
        .from('fragrances')
        .select('id, name, brand, year, image_url, gender')
        .or(`name.ilike.%${search}%,brand.ilike.%${search}%`)
        .eq('approved', true)
        .limit(24);
      return data ?? [];
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
