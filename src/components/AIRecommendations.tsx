import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Calendar, Sun, Snowflake, Leaf, Flower2, DollarSign, ImageIcon, ShoppingCart, ArrowLeftRight } from 'lucide-react';
import { FavoriteButton } from '@/components/FavoriteButton';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

type Recommendation = {
  name: string;
  brand: string;
  reason: string;
  keyNotes?: string[];
  priceRange?: string;
  longevity?: string;
  sillage?: string;
  similarity?: string;
  fillsGap?: string;
  versatility?: string;
  imageUrl?: string | null;
};

interface AIRecommendationsProps {
  collection?: { name: string; brand: string }[];
  wishlist?: { name: string; brand: string }[];
  initialType?: 'occasion' | 'collection' | 'wishlist' | 'general';
  initialFilters?: Partial<{ occasion: string; season: string; notes: string; style: string; budget: string }>;
  autoFetch?: boolean;
}

const FragranceImage = ({ imageUrl, name, brand }: { imageUrl?: string | null; name: string; brand: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
        <ImageIcon className="w-6 h-6 text-primary/50" />
      </div>
    );
  }

  return (
    <div className="w-20 h-20 rounded-lg bg-muted shrink-0 overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
          <Skeleton className="w-full h-full absolute inset-0" />
          <Sparkles className="w-5 h-5 text-primary animate-pulse z-10" />
        </div>
      )}
      <img
        src={imageUrl}
        alt={`${name} by ${brand}`}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};

export const AIRecommendations = ({ collection, wishlist, initialType = 'general', initialFilters, autoFetch = false }: AIRecommendationsProps) => {
  const [filters, setFilters] = useState({
    occasion: initialFilters?.occasion ?? '',
    season: initialFilters?.season ?? '',
    notes: initialFilters?.notes ?? '',
    style: initialFilters?.style ?? '',
    budget: initialFilters?.budget ?? '',
  });
  const [activeType, setActiveType] = useState<'occasion' | 'collection' | 'wishlist' | 'general'>(initialType);
  const [shouldFetch, setShouldFetch] = useState(autoFetch);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-recommendations', activeType, filters, collection, wishlist],
    queryFn: async () => {
      const body: Record<string, unknown> = { type: activeType };
      
      if (activeType === 'occasion') {
        body.occasion = filters.occasion;
        body.season = filters.season;
        body.notes = filters.notes ? filters.notes.split(',').map(n => n.trim()) : undefined;
        body.style = filters.style;
        body.budget = filters.budget;
      } else if (activeType === 'collection' && collection) {
        body.collection = collection;
      } else if (activeType === 'wishlist' && wishlist) {
        body.wishlist = wishlist;
      }

      const { data, error } = await supabase.functions.invoke('ai-recommendations', { body });
      if (error) throw error;
      return data as { recommendations: Recommendation[] };
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  const handleGetRecommendations = () => {
    setShouldFetch(true);
    refetch();
  };

  const seasonIcons = {
    spring: <Flower2 className="w-4 h-4" />,
    summer: <Sun className="w-4 h-4" />,
    fall: <Leaf className="w-4 h-4" />,
    winter: <Snowflake className="w-4 h-4" />,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Type Selection */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeType === 'general' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setActiveType('general'); setShouldFetch(false); }}
          >
            Popular Picks
          </Button>
          <Button
            variant={activeType === 'occasion' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setActiveType('occasion'); setShouldFetch(false); }}
          >
            <Calendar className="w-4 h-4 mr-1" />
            By Occasion
          </Button>
          {collection && collection.length > 0 && (
            <Button
              variant={activeType === 'collection' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setActiveType('collection'); setShouldFetch(false); }}
            >
              Based on Collection
            </Button>
          )}
          {wishlist && wishlist.length > 0 && (
            <Button
              variant={activeType === 'wishlist' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setActiveType('wishlist'); setShouldFetch(false); }}
            >
              Wishlist Alternatives
            </Button>
          )}
        </div>

        {/* Filters for occasion-based */}
        {activeType === 'occasion' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Occasion</Label>
              <Select value={filters.occasion} onValueChange={(v) => setFilters(f => ({ ...f, occasion: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select occasion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-night">Date Night</SelectItem>
                  <SelectItem value="office">Office/Work</SelectItem>
                  <SelectItem value="casual">Casual/Daily</SelectItem>
                  <SelectItem value="formal-event">Formal Event</SelectItem>
                  <SelectItem value="outdoor">Outdoor/Sport</SelectItem>
                  <SelectItem value="clubbing">Night Out/Club</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Season</Label>
              <Select value={filters.season} onValueChange={(v) => setFilters(f => ({ ...f, season: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spring">🌸 Spring</SelectItem>
                  <SelectItem value="summer">☀️ Summer</SelectItem>
                  <SelectItem value="fall">🍂 Fall</SelectItem>
                  <SelectItem value="winter">❄️ Winter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={filters.style} onValueChange={(v) => setFilters(f => ({ ...f, style: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fresh">Fresh & Clean</SelectItem>
                  <SelectItem value="warm">Warm & Cozy</SelectItem>
                  <SelectItem value="sweet">Sweet & Gourmand</SelectItem>
                  <SelectItem value="spicy">Spicy & Oriental</SelectItem>
                  <SelectItem value="woody">Woody & Earthy</SelectItem>
                  <SelectItem value="floral">Floral & Romantic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Budget</Label>
              <Select value={filters.budget} onValueChange={(v) => setFilters(f => ({ ...f, budget: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Under $50</SelectItem>
                  <SelectItem value="mid">$50 - $150</SelectItem>
                  <SelectItem value="high">$150 - $300</SelectItem>
                  <SelectItem value="luxury">$300+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Preferred Notes (comma separated)</Label>
              <Input
                placeholder="e.g., vanilla, amber, oud"
                value={filters.notes}
                onChange={(e) => setFilters(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
        )}

        <Button onClick={handleGetRecommendations} disabled={isLoading}>
          <Sparkles className="w-4 h-4 mr-2" />
          {isLoading ? 'Finding perfect scents...' : 'Get Recommendations'}
        </Button>

        {/* Results */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-4 text-destructive">
            <p>Failed to get recommendations. Please try again.</p>
          </div>
        )}

        {data?.recommendations && (
          <div className="space-y-4">
            {data.recommendations.map((rec, idx) => (
              <div
                key={`${rec.name}-${rec.brand}-${idx}`}
                className="flex gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <FragranceImage 
                  imageUrl={rec.imageUrl} 
                  name={rec.name} 
                  brand={rec.brand} 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold">{rec.name}</h4>
                      <p className="text-sm text-muted-foreground">{rec.brand}</p>
                    </div>
                    <FavoriteButton name={rec.name} brand={rec.brand} />
                  </div>
                  <p className="text-sm mt-2">{rec.reason}</p>
                  {rec.keyNotes && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rec.keyNotes.slice(0, 4).map((note) => (
                        <Badge key={note} variant="secondary" className="text-xs">
                          {note}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    {rec.priceRange && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {rec.priceRange}
                      </span>
                    )}
                    {rec.longevity && <span>Longevity: {rec.longevity}</span>}
                    {rec.sillage && <span>Sillage: {rec.sillage}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="default">
                      <Link to={`/marketplace?q=${encodeURIComponent(`${rec.brand} ${rec.name}`)}&type=sale`}>
                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                        Buy listings
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/marketplace?q=${encodeURIComponent(`${rec.brand} ${rec.name}`)}&type=trade`}>
                        <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5" />
                        Trade offers
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
