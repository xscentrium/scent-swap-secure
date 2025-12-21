import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FragranceReviews } from '@/components/FragranceReviews';
import { PriceTracker } from '@/components/PriceTracker';
import { Star, Sun, Moon, Snowflake, Leaf, Flower2, CloudSun, Clock, Wind } from 'lucide-react';

type FragranceDetails = {
  name: string;
  brand: string;
  concentration?: string;
  releaseYear?: number;
  perfumer?: string;
  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];
  mainAccords?: string[];
  longevity?: string;
  sillage?: string;
  seasonRating?: { spring: number; summer: number; fall: number; winter: number };
  dayNightRating?: { day: number; night: number };
  averageRating?: number;
  description?: string;
  similarFragrances?: { name: string; brand: string }[];
  imageUrl?: string;
};

interface FragranceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  brand: string;
  imageUrl?: string | null;
  onSelectSimilar?: (name: string, brand: string) => void;
}

export const FragranceDetailsModal = ({
  open,
  onOpenChange,
  name,
  brand,
  imageUrl,
  onSelectSimilar,
}: FragranceDetailsModalProps) => {
  const { data: details, isLoading, error } = useQuery({
    queryKey: ['fragrance-details', name, brand],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fragrance-details', {
        body: { name, brand },
      });
      
      if (error) throw error;
      return data?.details as FragranceDetails | null;
    },
    enabled: open && !!name && !!brand,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  const renderRatingBar = (value: number, max: number = 5) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-4 rounded-sm ${i < value ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>
    );
  };

  const SeasonIcon = ({ season }: { season: string }) => {
    switch (season) {
      case 'spring':
        return <Flower2 className="w-4 h-4" />;
      case 'summer':
        return <Sun className="w-4 h-4" />;
      case 'fall':
        return <Leaf className="w-4 h-4" />;
      case 'winter':
        return <Snowflake className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{name}</DialogTitle>
          <p className="text-muted-foreground">{brand}</p>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="w-32 h-32 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Failed to load fragrance details</p>
          </div>
        ) : details ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-4">
              {/* Header with image and basic info */}
              <div className="flex gap-4">
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted shrink-0">
                  <img
                    src={imageUrl || details.imageUrl || '/placeholder.svg'}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  {details.averageRating && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span className="font-medium">{details.averageRating.toFixed(1)}</span>
                      <span className="text-muted-foreground text-sm">/ 5</span>
                    </div>
                  )}
                  {details.concentration && (
                    <Badge variant="secondary">{details.concentration}</Badge>
                  )}
                  {details.releaseYear && (
                    <p className="text-sm text-muted-foreground">Released: {details.releaseYear}</p>
                  )}
                  {details.perfumer && (
                    <p className="text-sm text-muted-foreground">Perfumer: {details.perfumer}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              {details.description && (
                <p className="text-sm text-foreground/80">{details.description}</p>
              )}

              <Separator />

              {/* Main Accords */}
              {details.mainAccords && details.mainAccords.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Main Accords</h4>
                  <div className="flex flex-wrap gap-2">
                    {details.mainAccords.map((accord) => (
                      <Badge key={accord} variant="outline" className="capitalize">
                        {accord}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Pyramid */}
              <div className="grid grid-cols-3 gap-4">
                {details.topNotes && details.topNotes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Top Notes</h4>
                    <div className="flex flex-wrap gap-1">
                      {details.topNotes.map((note) => (
                        <Badge key={note} variant="secondary" className="text-xs capitalize">
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {details.heartNotes && details.heartNotes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Heart Notes</h4>
                    <div className="flex flex-wrap gap-1">
                      {details.heartNotes.map((note) => (
                        <Badge key={note} variant="secondary" className="text-xs capitalize">
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {details.baseNotes && details.baseNotes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Base Notes</h4>
                    <div className="flex flex-wrap gap-1">
                      {details.baseNotes.map((note) => (
                        <Badge key={note} variant="secondary" className="text-xs capitalize">
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Performance */}
              <div className="grid grid-cols-2 gap-6">
                {details.longevity && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Longevity</p>
                      <p className="text-sm text-muted-foreground">{details.longevity}</p>
                    </div>
                  </div>
                )}
                {details.sillage && (
                  <div className="flex items-center gap-3">
                    <Wind className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Sillage</p>
                      <p className="text-sm text-muted-foreground">{details.sillage}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Season Ratings */}
              {details.seasonRating && (
                <div>
                  <h4 className="font-medium mb-3">Best Seasons</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {Object.entries(details.seasonRating).map(([season, rating]) => (
                      <div key={season} className="flex flex-col items-center gap-1">
                        <SeasonIcon season={season} />
                        <span className="text-xs capitalize">{season}</span>
                        {renderRatingBar(rating)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Day/Night Rating */}
              {details.dayNightRating && (
                <div>
                  <h4 className="font-medium mb-3">Best Time</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <Sun className="w-5 h-5 text-amber-500" />
                      <div className="flex-1">
                        <span className="text-sm">Day</span>
                        {renderRatingBar(details.dayNightRating.day)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-indigo-400" />
                      <div className="flex-1">
                        <span className="text-sm">Night</span>
                        {renderRatingBar(details.dayNightRating.night)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Similar Fragrances */}
              {details.similarFragrances && details.similarFragrances.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Similar Fragrances</h4>
                    <div className="flex flex-wrap gap-2">
                      {details.similarFragrances.map((frag) => (
                        <Badge
                          key={`${frag.name}-${frag.brand}`}
                          variant="outline"
                          className={onSelectSimilar ? 'cursor-pointer hover:bg-accent' : ''}
                          onClick={() => onSelectSimilar?.(frag.name, frag.brand)}
                        >
                          {frag.name} - {frag.brand}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-4">
              <FragranceReviews fragranceName={name} fragranceBrand={brand} />
            </TabsContent>

            <TabsContent value="pricing" className="mt-4">
              <PriceTracker fragranceName={name} fragranceBrand={brand} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No details available for this fragrance</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
