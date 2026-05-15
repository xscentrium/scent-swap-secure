import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SEO } from "@/components/SEO";
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { FragranceSearch } from '@/components/FragranceSearch';
import { FragranceReviews } from '@/components/FragranceReviews';
import { PriceTracker } from '@/components/PriceTracker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, X, Plus, Star, Clock, Wind, Sun, Moon, Snowflake, Leaf, Flower2 } from 'lucide-react';
import { toast } from 'sonner';

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
  imageUrl?: string;
};

type ComparisonItem = {
  name: string;
  brand: string;
  details?: FragranceDetails | null;
  isLoading: boolean;
};

const STORAGE_KEY = 'xscentrium:compare:items:v1';

const FragranceComparison = () => {
  const [items, setItems] = useState<ComparisonItem[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchBrand, setSearchBrand] = useState('');
  const hasHydrated = useRef(false);

  // Load persisted selection and refetch details
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: { name: string; brand: string }[] = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length > 0) {
          const initial = saved.slice(0, 4).map((s) => ({ name: s.name, brand: s.brand, isLoading: true }));
          setItems(initial);
          initial.forEach(async (it) => {
            try {
              const { data, error } = await supabase.functions.invoke('fragrance-details', {
                body: { name: it.name, brand: it.brand },
              });
              if (error) throw error;
              setItems((prev) =>
                prev.map((p) =>
                  p.name === it.name && p.brand === it.brand
                    ? { ...p, details: data?.details, isLoading: false }
                    : p,
                ),
              );
            } catch {
              setItems((prev) =>
                prev.map((p) =>
                  p.name === it.name && p.brand === it.brand ? { ...p, isLoading: false } : p,
                ),
              );
            }
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load saved comparison', e);
    } finally {
      hasHydrated.current = true;
    }
  }, []);

  // Persist selection (name + brand only)
  useEffect(() => {
    if (!hasHydrated.current) return;
    try {
      const minimal = items.map((i) => ({ name: i.name, brand: i.brand }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
    } catch {
      // ignore quota errors
    }
  }, [items]);

  const addFragrance = async (name: string, brand: string) => {
    if (items.length >= 4) {
      toast.error('Comparison is full', {
        description: 'You can compare up to 4 fragrances at a time. Remove one to add another.',
      });
      return;
    }

    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    if (items.some(item => norm(item.name) === norm(name) && norm(item.brand) === norm(brand))) {
      toast.warning('Already in comparison', {
        description: `${brand} — ${name} is already on your compare list.`,
      });
      return;
    }

    setItems(prev => [...prev, { name, brand, isLoading: true }]);
    setSearchName('');
    setSearchBrand('');

    try {
      const { data, error } = await supabase.functions.invoke('fragrance-details', {
        body: { name, brand },
      });

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.name === name && item.brand === brand 
          ? { ...item, details: data?.details, isLoading: false }
          : item
      ));
    } catch (e) {
      setItems(prev => prev.map(item => 
        item.name === name && item.brand === brand 
          ? { ...item, isLoading: false }
          : item
      ));
    }
  };

  const removeFragrance = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const renderRatingBar = (value: number, max: number = 5) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-3 rounded-sm ${i < value ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>
    );
  };

  const SeasonIcon = ({ season }: { season: string }) => {
    switch (season) {
      case 'spring': return <Flower2 className="w-4 h-4" />;
      case 'summer': return <Sun className="w-4 h-4" />;
      case 'fall': return <Leaf className="w-4 h-4" />;
      case 'winter': return <Snowflake className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Compare Fragrances Side-by-Side | Xscentrium" description="Compare up to four fragrances side-by-side: notes, accords, longevity, sillage and price." path="/compare" />
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/marketplace">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2">Compare Fragrances</h1>
            <p className="text-muted-foreground">
              Compare up to 4 fragrances side by side to find your perfect scent
            </p>
          </div>

          {/* Add Fragrance */}
          {items.length < 4 && (
            <Card className="mb-8 relative z-[100]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Fragrance to Compare ({items.length}/4)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FragranceSearch
                  nameValue={searchName}
                  brandValue={searchBrand}
                  onNameChange={setSearchName}
                  onBrandChange={setSearchBrand}
                  onSelect={(f) => addFragrance(f.name, f.brand)}
                  excludeItems={items.map((i) => ({ name: i.name, brand: i.brand }))}
                  nameId="compare-name"
                  brandId="compare-brand"
                />
              </CardContent>
            </Card>
          )}

          {/* Comparison Grid */}
          {items.length > 0 ? (
            <div className={`grid gap-4 ${
              items.length === 1 ? 'grid-cols-1 max-w-md' :
              items.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              items.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            }`}>
              {items.map((item, index) => (
                <Card key={`${item.name}-${item.brand}`} className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 z-10"
                    onClick={() => removeFragrance(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>

                  <CardContent className="p-4 pt-8">
                    {item.isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-24 mx-auto rounded-lg" />
                        <Skeleton className="h-5 w-3/4 mx-auto" />
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    ) : item.details ? (
                      <div className="space-y-4">
                        {/* Image & Name */}
                        <div className="text-center">
                          <div className="w-24 h-24 mx-auto rounded-lg overflow-hidden bg-muted mb-3">
                            <img
                              src={item.details.imageUrl || '/placeholder.svg'}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.brand}</p>
                          {item.details.concentration && (
                            <Badge variant="secondary" className="mt-1">{item.details.concentration}</Badge>
                          )}
                        </div>

                        {/* Rating */}
                        {item.details.averageRating && (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            <span className="font-medium">{item.details.averageRating.toFixed(1)}</span>
                          </div>
                        )}

                        <Separator />

                        {/* Main Accords */}
                        {item.details.mainAccords && (
                          <div>
                            <p className="text-xs font-medium mb-2">Main Accords</p>
                            <div className="flex flex-wrap gap-1">
                              {item.details.mainAccords.slice(0, 4).map(accord => (
                                <Badge key={accord} variant="outline" className="text-xs capitalize">
                                  {accord}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                          {item.details.topNotes && (
                            <div>
                              <p className="text-xs text-muted-foreground">Top</p>
                              <p className="text-xs">{item.details.topNotes.slice(0, 3).join(', ')}</p>
                            </div>
                          )}
                          {item.details.heartNotes && (
                            <div>
                              <p className="text-xs text-muted-foreground">Heart</p>
                              <p className="text-xs">{item.details.heartNotes.slice(0, 3).join(', ')}</p>
                            </div>
                          )}
                          {item.details.baseNotes && (
                            <div>
                              <p className="text-xs text-muted-foreground">Base</p>
                              <p className="text-xs">{item.details.baseNotes.slice(0, 3).join(', ')}</p>
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Performance */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Longevity
                            </span>
                            <span className="text-xs">{item.details.longevity || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs flex items-center gap-1">
                              <Wind className="w-3 h-3" /> Sillage
                            </span>
                            <span className="text-xs">{item.details.sillage || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Season Ratings */}
                        {item.details.seasonRating && (
                          <div>
                            <p className="text-xs font-medium mb-2">Best Seasons</p>
                            <div className="grid grid-cols-4 gap-1">
                              {Object.entries(item.details.seasonRating).map(([season, rating]) => (
                                <div key={season} className="flex flex-col items-center">
                                  <SeasonIcon season={season} />
                                  {renderRatingBar(rating)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Day/Night */}
                        {item.details.dayNightRating && (
                          <div className="flex justify-around">
                            <div className="flex items-center gap-2">
                              <Sun className="w-4 h-4 text-amber-500" />
                              {renderRatingBar(item.details.dayNightRating.day)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Moon className="w-4 h-4 text-indigo-400" />
                              {renderRatingBar(item.details.dayNightRating.night)}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.brand}</p>
                        <p className="text-xs text-muted-foreground mt-2">Details unavailable</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p>Add fragrances above to start comparing</p>
            </div>
          )}

          {/* Reviews & Price for first fragrance */}
          {items.length > 0 && items[0].details && (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <FragranceReviews 
                  fragranceName={items[0].name} 
                  fragranceBrand={items[0].brand} 
                />
              </div>
              <div>
                <PriceTracker 
                  fragranceName={items[0].name} 
                  fragranceBrand={items[0].brand} 
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FragranceComparison;
