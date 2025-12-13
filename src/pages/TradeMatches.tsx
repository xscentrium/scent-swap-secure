import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeftRight, MessageSquare, User, AlertCircle, Settings } from 'lucide-react';

type TradeMatch = {
  wishlistOwner: {
    id: string;
    username: string;
    display_name: string | null;
  };
  fragranceName: string;
  fragranceBrand: string;
  priority: string;
};

const TradeMatches = () => {
  const { profile, loading } = useAuth();

  const { data: isEnabled, isLoading: checkingEnabled } = useQuery({
    queryKey: ['trade-matches-enabled', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return false;
      const { data } = await supabase
        .from('profiles')
        .select('trade_matches_enabled')
        .eq('id', profile.id)
        .single();
      return data?.trade_matches_enabled ?? false;
    },
    enabled: !!profile?.id,
  });

  const { data: matches, isLoading: loadingMatches } = useQuery({
    queryKey: ['trade-matches-full', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Get user's collection items
      const { data: collectionItems, error: collectionError } = await supabase
        .from('collection_items')
        .select('name, brand')
        .eq('profile_id', profile.id);

      if (collectionError || !collectionItems?.length) return [];

      // Find wishlist items from OTHER users that match our collection
      const allMatches: TradeMatch[] = [];
      
      for (const item of collectionItems) {
        const { data: wishlistMatches } = await supabase
          .from('wishlist_items')
          .select(`
            name,
            brand,
            priority,
            profile_id,
            profiles!wishlist_items_profile_id_fkey (
              id,
              username,
              display_name
            )
          `)
          .neq('profile_id', profile.id)
          .ilike('name', `%${item.name}%`)
          .ilike('brand', `%${item.brand}%`);

        if (wishlistMatches) {
          for (const match of wishlistMatches) {
            const profiles = match.profiles as any;
            allMatches.push({
              wishlistOwner: {
                id: profiles.id,
                username: profiles.username,
                display_name: profiles.display_name,
              },
              fragranceName: match.name,
              fragranceBrand: match.brand,
              priority: match.priority || 'medium',
            });
          }
        }
      }

      return allMatches;
    },
    enabled: !!profile?.id && isEnabled === true,
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'low':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading || checkingEnabled) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center pt-32">
          <h1 className="text-2xl font-serif font-bold mb-2">Sign in Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to view trade matches.</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-serif font-bold mb-2">Trade Matches Disabled</h1>
            <p className="text-muted-foreground mb-6">
              Enable trade matches in your settings to see potential trade opportunities
              when your collection matches other users' wishlists.
            </p>
            <Button asChild>
              <Link to="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Go to Settings
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2">Trade Matches</h1>
            <p className="text-muted-foreground">
              Users whose wishlists match items in your collection
            </p>
          </div>

          {loadingMatches ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : matches && matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((match, index) => (
                <Card key={`${match.wishlistOwner.id}-${match.fragranceName}-${index}`}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Link 
                            to={`/profile/${match.wishlistOwner.username}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            @{match.wishlistOwner.username}
                          </Link>
                          <span className="text-muted-foreground">wants</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{match.fragranceName}</span>
                          <span className="text-muted-foreground">by {match.fragranceBrand}</span>
                          <Badge className={getPriorityColor(match.priority)}>
                            {match.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/profile/${match.wishlistOwner.username}`}>
                          <User className="w-4 h-4 mr-1" />
                          Profile
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link to={`/messages?to=${match.wishlistOwner.username}&about=trade:${match.fragranceName}`}>
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Offer Trade
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No Trade Matches Found</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  When other users add items to their wishlist that match your collection,
                  they'll appear here as potential trade opportunities.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default TradeMatches;