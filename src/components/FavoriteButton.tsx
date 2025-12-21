import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  name: string;
  brand: string;
  imageUrl?: string;
  size?: 'sm' | 'default' | 'icon';
  className?: string;
}

export const FavoriteButton = ({ name, brand, imageUrl, size = 'icon', className }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, isAddingFavorite, isRemovingFavorite } = useFavorites();

  if (!user) return null;

  const isFav = isFavorite(name, brand);
  const isLoading = isAddingFavorite || isRemovingFavorite;

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn(className)}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(name, brand, imageUrl);
      }}
      disabled={isLoading}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart 
        className={cn(
          "w-4 h-4 transition-colors",
          isFav && "fill-red-500 text-red-500"
        )} 
      />
    </Button>
  );
};
