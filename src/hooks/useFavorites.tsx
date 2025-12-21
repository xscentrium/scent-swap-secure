import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface FavoriteFragrance {
  id: string;
  profile_id: string;
  fragrance_name: string;
  fragrance_brand: string;
  image_url: string | null;
  created_at: string;
}

export const useFavorites = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading, refetch } = useQuery({
    queryKey: ['favorites', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('favorite_fragrances')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FavoriteFragrance[];
    },
    enabled: !!profile?.id,
  });

  const addFavorite = useMutation({
    mutationFn: async ({ name, brand, imageUrl }: { name: string; brand: string; imageUrl?: string }) => {
      if (!profile?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('favorite_fragrances')
        .insert({
          profile_id: profile.id,
          fragrance_name: name,
          fragrance_brand: brand,
          image_url: imageUrl || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', profile?.id] });
      toast.success('Added to favorites');
    },
    onError: (error) => {
      toast.error('Failed to add to favorites');
      console.error(error);
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (favoriteId: string) => {
      const { error } = await supabase
        .from('favorite_fragrances')
        .delete()
        .eq('id', favoriteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', profile?.id] });
      toast.success('Removed from favorites');
    },
    onError: (error) => {
      toast.error('Failed to remove from favorites');
      console.error(error);
    },
  });

  const isFavorite = (name: string, brand: string) => {
    return favorites.some(
      f => f.fragrance_name.toLowerCase() === name.toLowerCase() && 
           f.fragrance_brand.toLowerCase() === brand.toLowerCase()
    );
  };

  const getFavoriteId = (name: string, brand: string) => {
    const fav = favorites.find(
      f => f.fragrance_name.toLowerCase() === name.toLowerCase() && 
           f.fragrance_brand.toLowerCase() === brand.toLowerCase()
    );
    return fav?.id;
  };

  const toggleFavorite = async (name: string, brand: string, imageUrl?: string) => {
    const existingId = getFavoriteId(name, brand);
    if (existingId) {
      await removeFavorite.mutateAsync(existingId);
    } else {
      await addFavorite.mutateAsync({ name, brand, imageUrl });
    }
  };

  return {
    favorites,
    isLoading,
    addFavorite: addFavorite.mutateAsync,
    removeFavorite: removeFavorite.mutateAsync,
    isFavorite,
    getFavoriteId,
    toggleFavorite,
    refetch,
  };
};
