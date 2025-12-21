import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type FavoriteFragrance = {
  id: string;
  profile_id: string;
  fragrance_name: string;
  fragrance_brand: string;
  image_url: string | null;
  created_at: string;
};

export const useFavorites = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
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
      
      const { error } = await supabase
        .from('favorite_fragrances')
        .insert({
          profile_id: profile.id,
          fragrance_name: name,
          fragrance_brand: brand,
          image_url: imageUrl || null,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Already in favorites');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success('Added to favorites');
    },
    onError: (error: Error) => {
      if (error.message === 'Already in favorites') {
        toast.info('Already in your favorites');
      } else {
        toast.error('Failed to add to favorites');
      }
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async ({ name, brand }: { name: string; brand: string }) => {
      if (!profile?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('favorite_fragrances')
        .delete()
        .eq('profile_id', profile.id)
        .eq('fragrance_name', name)
        .eq('fragrance_brand', brand);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success('Removed from favorites');
    },
    onError: () => {
      toast.error('Failed to remove from favorites');
    },
  });

  const isFavorite = (name: string, brand: string) => {
    return favorites.some(
      f => f.fragrance_name.toLowerCase() === name.toLowerCase() && 
           f.fragrance_brand.toLowerCase() === brand.toLowerCase()
    );
  };

  const toggleFavorite = async (name: string, brand: string, imageUrl?: string) => {
    if (isFavorite(name, brand)) {
      await removeFavorite.mutateAsync({ name, brand });
    } else {
      await addFavorite.mutateAsync({ name, brand, imageUrl });
    }
  };

  return {
    favorites,
    isLoading,
    addFavorite: addFavorite.mutate,
    removeFavorite: removeFavorite.mutate,
    isFavorite,
    toggleFavorite,
    isAddingFavorite: addFavorite.isPending,
    isRemovingFavorite: removeFavorite.isPending,
  };
};
