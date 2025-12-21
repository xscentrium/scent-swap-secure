import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import { FragranceDetailsModal } from '@/components/FragranceDetailsModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, X, GitCompare, Sparkles } from 'lucide-react';

interface FavoritesManagerProps {
  showCompareButton?: boolean;
}

export const FavoritesManager = ({ showCompareButton = true }: FavoritesManagerProps) => {
  const { favorites, isLoading, removeFavorite } = useFavorites();
  const [selectedFragrance, setSelectedFragrance] = useState<{ name: string; brand: string; imageUrl?: string } | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Favorites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Favorites ({favorites.length})
          </CardTitle>
          {showCompareButton && favorites.length >= 2 && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/compare">
                <GitCompare className="w-4 h-4 mr-2" />
                Compare
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {favorites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No favorites yet</p>
              <p className="text-xs mt-1">Click the heart icon on any fragrance to save it here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="relative group cursor-pointer rounded-lg border bg-card p-3 hover:shadow-md transition-shadow"
                  onClick={() => setSelectedFragrance({
                    name: fav.fragrance_name,
                    brand: fav.fragrance_brand,
                    imageUrl: fav.image_url || undefined,
                  })}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(fav.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                      <img
                        src={fav.image_url || '/placeholder.svg'}
                        alt={fav.fragrance_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{fav.fragrance_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{fav.fragrance_brand}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedFragrance && (
        <FragranceDetailsModal
          open={!!selectedFragrance}
          onOpenChange={(open) => !open && setSelectedFragrance(null)}
          name={selectedFragrance.name}
          brand={selectedFragrance.brand}
          imageUrl={selectedFragrance.imageUrl}
        />
      )}
    </>
  );
};
