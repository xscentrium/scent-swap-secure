import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type TradeMatch = {
  wishlistOwner: {
    id: string;
    username: string;
    display_name: string | null;
  };
  fragranceName: string;
  fragranceBrand: string;
};

export const useTradeMatches = () => {
  const { profile } = useAuth();

  const { data: matches } = useQuery({
    queryKey: ['trade-matches', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Get user's collection items
      const { data: collectionItems, error: collectionError } = await supabase
        .from('collection_items')
        .select('name, brand')
        .eq('profile_id', profile.id);

      if (collectionError || !collectionItems?.length) return [];

      // Find wishlist items from OTHER users that match our collection
      const matchPromises = collectionItems.map(async (item) => {
        const { data: wishlistMatches } = await supabase
          .from('wishlist_items')
          .select(`
            name,
            brand,
            profile_id,
            profiles:public_profiles!wishlist_items_profile_id_fkey (
              id,
              username,
              display_name
            )
          `)
          .neq('profile_id', profile.id)
          .ilike('name', `%${item.name}%`)
          .ilike('brand', `%${item.brand}%`);

        return wishlistMatches?.map((match: any) => ({
          wishlistOwner: {
            id: match.profiles.id,
            username: match.profiles.username,
            display_name: match.profiles.display_name,
          },
          fragranceName: match.name,
          fragranceBrand: match.brand,
        })) || [];
      });

      const allMatches = await Promise.all(matchPromises);
      return allMatches.flat() as TradeMatch[];
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Show toast notification for new matches
  useEffect(() => {
    if (matches && matches.length > 0) {
      const shownKey = `trade-matches-shown-${profile?.id}`;
      const lastShown = localStorage.getItem(shownKey);
      const matchesKey = JSON.stringify(matches.map(m => `${m.fragranceName}-${m.wishlistOwner.id}`));
      
      if (lastShown !== matchesKey) {
        toast.info(
          `${matches.length} potential trade match${matches.length > 1 ? 'es' : ''} found!`,
          {
            description: 'Someone wants a fragrance from your collection.',
            action: {
              label: 'View',
              onClick: () => window.location.href = '/my-trades',
            },
          }
        );
        localStorage.setItem(shownKey, matchesKey);
      }
    }
  }, [matches, profile?.id]);

  return { matches: matches || [] };
};
