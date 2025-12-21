import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  name: string;
  brand: string;
  imageUrl?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'default';
  className?: string;
}

export const FavoriteButton = ({
  name,
  brand,
  imageUrl,
  size = 'icon',
  variant = 'ghost',
  className,
}: FavoriteButtonProps) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const isFav = isFavorite(name, brand);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    await toggleFavorite(name, brand, imageUrl);
  };

  if (!user) return null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(className)}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={cn(
          'w-4 h-4 transition-colors',
          isFav && 'fill-red-500 text-red-500'
        )}
      />
    </Button>
  );
};
