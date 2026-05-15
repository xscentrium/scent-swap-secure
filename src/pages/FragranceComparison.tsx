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
  error?: boolean;
};

const STORAGE_KEY = 'xscentrium:compare:items:v1';

const FragranceComparison = () => {
  const [items, setItems] = useState<ComparisonItem[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchBrand, setSearchBrand] = useState('');
  const [liveMessage, setLiveMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const hasHydrated = useRef(false);
  const prevLoadingCountRef = useRef(0);
  const prevItemCountRef = useRef(0);

  // Announce loading/skeleton/ready state changes to screen readers
  useEffect(() => {
    const loadingCount = items.filter((i) => i.isLoading).length;
    const total = items.length;

    if (loadingCount > 0) {
      setLiveMessage(
        `Loading details for ${loadingCount} of ${total} ${total === 1 ? 'fragrance' : 'fragrances'}. Placeholder cards shown.`,
      );
    } else if (total > 0 && prevLoadingCountRef.current > 0) {
      // Transitioned from loading -> all loaded
      setLiveMessage(
        `Comparison ready. All ${total} ${total === 1 ? 'fragrance is' : 'fragrances are'} loaded.`,
      );
    } else if (total === 0 && prevItemCountRef.current > 0) {
      setLiveMessage('Comparison is empty.');
    }

    prevLoadingCountRef.current = loadingCount;
    prevItemCountRef.current = total;
  }, [items]);

  // Polite, throttled announcer for actions (add/remove/undo/clear)
  const announce = (msg: string) => {
    setLiveMessage('');
    requestAnimationFrame(() => setLiveMessage(msg));
  };

  const announceError = (msg: string) => {
    setAssertiveMessage('');
    // force re-announce even for repeated messages
    requestAnimationFrame(() => setAssertiveMessage(msg));
  };

  // Reusable details fetcher used by initial load, add, and Retry
  const fetchDetailsFor = async (name: string, brand: string, opts?: { announceErrors?: boolean }) => {
    setItems((prev) =>
      prev.map((p) => (p.name === name && p.brand === brand ? { ...p, isLoading: true, error: false } : p)),
    );
    try {
      const { data, error } = await supabase.functions.invoke('fragrance-details', {
        body: { name, brand },
      });
      if (error) throw error;
      setItems((prev) =>
        prev.map((p) =>
          p.name === name && p.brand === brand
            ? { ...p, details: data?.details, isLoading: false, error: false }
            : p,
        ),
      );
    } catch (err) {
      console.warn('Failed to load fragrance details', err);
      setItems((prev) =>
        prev.map((p) =>
          p.name === name && p.brand === brand ? { ...p, isLoading: false, error: true } : p,
        ),
      );
      if (opts?.announceErrors !== false) {
        announceError(`Failed to load details for ${brand} — ${name}.`);
        toast.error('Failed to load fragrance details', {
          description: `Could not load ${brand} — ${name}.`,
          duration: 8000,
          action: {
            label: 'Retry',
            onClick: () => fetchDetailsFor(name, brand),
          },
        });
      }
    }
  };

  // Load persisted selection and refetch details
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: { name: string; brand: string }[] = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length > 0) {
          const initial = saved
            .slice(0, 4)
            .map((s) => ({ name: s.name, brand: s.brand, isLoading: true, error: false }));
          setItems(initial);
          initial.forEach((it) => {
            void fetchDetailsFor(it.name, it.brand);
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
      announceError('Comparison is full. Maximum of 4 fragrances.');
      toast.error('Comparison is full', {
        description: 'You can compare up to 4 fragrances at a time. Remove one to add another.',
      });
      return;
    }

    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    if (items.some((item) => norm(item.name) === norm(name) && norm(item.brand) === norm(brand))) {
      announceError(`${brand} ${name} is already in the comparison.`);
      toast.warning('Already in comparison', {
        description: `${brand} — ${name} is already on your compare list.`,
      });
      return;
    }

    setItems((prev) => [...prev, { name, brand, isLoading: true, error: false }]);
    setSearchName('');
    setSearchBrand('');
    announce(`Added ${brand} ${name} to comparison. Loading details.`);

    await fetchDetailsFor(name, brand);
  };

  const removeFragrance = (index: number) => {
    const removed = items[index];
    if (!removed) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    announce(`Removed ${removed.brand} ${removed.name} from comparison. Undo available.`);
    toast('Fragrance removed', {
      description: `${removed.brand} — ${removed.name}`,
      duration: 12000,
      action: {
        label: 'Undo',
        onClick: () => {
          setItems((prev) => {
            if (prev.length >= 4) return prev;
            const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
            if (
              prev.some(
                (p) => norm(p.name) === norm(removed.name) && norm(p.brand) === norm(removed.brand),
              )
            ) {
              return prev;
            }
            const next = [...prev];
            const insertAt = Math.min(index, next.length);
            next.splice(insertAt, 0, removed);
            announce(`Restored ${removed.brand} ${removed.name} to comparison.`);
            return next;
          });
        },
      },
    });
  };

  const clearAll = () => {
    if (items.length === 0) return;
    const cleared = items;
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    announce(`Cleared all ${cleared.length} ${cleared.length === 1 ? 'fragrance' : 'fragrances'} from comparison. Undo available.`);
    toast.success('Comparison cleared', {
      duration: 12000,
      action: {
        label: 'Undo',
        onClick: () => {
          setItems(cleared);
          announce(`Restored ${cleared.length} ${cleared.length === 1 ? 'fragrance' : 'fragrances'}.`);
        },
      },
    });
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
        {/* Screen-reader-only live regions for state changes */}
        <div className="sr-only" aria-live="polite" aria-atomic="true" role="status">
          {liveMessage}
        </div>
        <div className="sr-only" aria-live="assertive" aria-atomic="true" role="alert">
          {assertiveMessage}
        </div>
        <div className="container mx-auto px-4 max-w-7xl">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/marketplace">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
          </Button>

          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-2">Compare Fragrances</h1>
              <p className="text-muted-foreground">
                Compare up to 4 fragrances side by side to find your perfect scent
              </p>
            </div>
            {items.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll} className="gap-1 shrink-0">
                <X className="w-4 h-4" />
                Clear all
              </Button>
            )}
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
                <Card
                  key={`${item.name}-${item.brand}`}
                  className="relative"
                  aria-busy={item.isLoading}
                  aria-label={
                    item.isLoading
                      ? `Loading details for ${item.brand} ${item.name}`
                      : `${item.brand} ${item.name} comparison card`
                  }
                >
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 z-10 h-7 px-2 gap-1"
                    onClick={() => removeFragrance(index)}
                    aria-label={`Remove ${item.brand} ${item.name} from comparison`}
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove
                  </Button>

                  <CardContent className="p-4 pt-8">
                    {item.isLoading ? (
                      <div className="space-y-4" role="status" aria-live="polite">
                        <span className="sr-only">Loading {item.brand} {item.name} details…</span>
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
                        <p className="text-xs text-muted-foreground mt-2">
                          {item.error ? 'Failed to load details.' : 'Details unavailable'}
                        </p>
                        {item.error && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => {
                              announce(`Retrying details for ${item.brand} ${item.name}.`);
                              void fetchDetailsFor(item.name, item.brand);
                            }}
                            aria-label={`Retry loading details for ${item.brand} ${item.name}`}
                          >
                            Retry
                          </Button>
                        )}
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
