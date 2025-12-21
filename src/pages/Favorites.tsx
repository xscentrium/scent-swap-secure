import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { useFavorites, FavoriteFragrance } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { FragranceDetailsModal } from '@/components/FragranceDetailsModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Heart, GitCompare, Trash2 } from 'lucide-react';

const Favorites = () => {
  const { user } = useAuth();
  const { favorites, isLoading, removeFavorite } = useFavorites();
  const [selectedFragrance, setSelectedFragrance] = useState<{ name: string; brand: string; imageUrl?: string } | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());

  const toggleCompareSelection = (id: string) => {
    setSelectedForCompare(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  const getCompareUrl = () => {
    const selected = favorites.filter(f => selectedForCompare.has(f.id));
    const params = selected.map(f => `frag=${encodeURIComponent(`${f.fragrance_name}|${f.fragrance_brand}`)}`).join('&');
    return `/compare?${params}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4 text-center py-16">
            <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-serif font-bold mb-2">Sign in to view favorites</h1>
            <p className="text-muted-foreground mb-4">Save your favorite fragrances for quick access</p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
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
        <div className="container mx-auto px-4 max-w-6xl">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-2">My Favorites</h1>
              <p className="text-muted-foreground">
                {favorites.length} fragrance{favorites.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            {selectedForCompare.size > 1 && (
              <Button asChild>
                <Link to={getCompareUrl()}>
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare ({selectedForCompare.size})
                </Link>
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No favorites yet</p>
              <p className="text-sm">Click the heart icon on any fragrance to add it here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favorites.map((fav) => (
                <Card 
                  key={fav.id} 
                  className={`cursor-pointer hover:shadow-lg transition-all ${
                    selectedForCompare.has(fav.id) ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div 
                      className="flex gap-3"
                      onClick={() => setSelectedFragrance({ 
                        name: fav.fragrance_name, 
                        brand: fav.fragrance_brand,
                        imageUrl: fav.image_url || undefined
                      })}
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={fav.image_url || '/placeholder.svg'}
                          alt={fav.fragrance_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{fav.fragrance_name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{fav.fragrance_brand}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant={selectedForCompare.has(fav.id) ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompareSelection(fav.id);
                        }}
                        disabled={!selectedForCompare.has(fav.id) && selectedForCompare.size >= 4}
                      >
                        <GitCompare className="w-3 h-3 mr-1" />
                        {selectedForCompare.has(fav.id) ? 'Selected' : 'Compare'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite({ name: fav.fragrance_name, brand: fav.fragrance_brand });
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedFragrance && (
        <FragranceDetailsModal
          open={!!selectedFragrance}
          onOpenChange={(open) => !open && setSelectedFragrance(null)}
          name={selectedFragrance.name}
          brand={selectedFragrance.brand}
          imageUrl={selectedFragrance.imageUrl}
        />
      )}
    </div>
  );
};

export default Favorites;
