import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Shield, Search, ArrowUpDown, Loader2, X, SlidersHorizontal, BadgeCheck, AlertTriangle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { FavoriteButton } from '@/components/FavoriteButton';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { getImageVerification } from '@/lib/imageVerification';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const PRICE_MIN = 0;
const PRICE_MAX = 1000;
const clampPrice = (n: number) => Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round(Number.isFinite(n) ? n : 0)));

type Listing = {
  id: string;
  name: string;
  brand: string;
  size: string;
  condition: string;
  estimated_value: number | null;
  price: number | null;
  listing_type: string;
  image_url: string | null;
  owner_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
};

const MarketplacePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Initialize state from URL (?q=&type=&cond=&min=&max=&sort=) ---
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [listingTypeFilter, setListingTypeFilter] = useState(() => searchParams.get('type') ?? 'all');
  const [conditionFilter, setConditionFilter] = useState<string[]>(() => {
    const c = searchParams.get('cond');
    return c ? c.split(',').filter(Boolean) : [];
  });
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') ?? 'newest');
  const [priceRange, setPriceRange] = useState<[number, number]>(() => [
    clampPrice(Number(searchParams.get('min') ?? PRICE_MIN)),
    clampPrice(Number(searchParams.get('max') ?? PRICE_MAX)),
  ]);
  const [priceInput, setPriceInput] = useState<[string, string]>(() => [
    String(clampPrice(Number(searchParams.get('min') ?? PRICE_MIN))),
    String(clampPrice(Number(searchParams.get('max') ?? PRICE_MAX))),
  ]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Debounce expensive filter inputs so the query doesn't fire per keystroke
  const debouncedSearch = useDebounce(search, 350);
  const debouncedPriceRange = useDebounce(priceRange, 300);

  // Sync state -> URL (replace, no history spam)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (listingTypeFilter !== 'all') params.set('type', listingTypeFilter);
    if (conditionFilter.length) params.set('cond', conditionFilter.join(','));
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (debouncedPriceRange[0] > PRICE_MIN) params.set('min', String(debouncedPriceRange[0]));
    if (debouncedPriceRange[1] < PRICE_MAX) params.set('max', String(debouncedPriceRange[1]));
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, listingTypeFilter, conditionFilter, sortBy, debouncedPriceRange, setSearchParams]);

  const { data: listings, isLoading } = useQuery({
    queryKey: ['listings', debouncedSearch, listingTypeFilter, conditionFilter, sortBy, debouncedPriceRange],
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_owner_id_fkey (
            username,
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_owner_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('is_active', true);

      if (search) {
        query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`);
      }

      if (listingTypeFilter !== 'all') {
        query = query.eq('listing_type', listingTypeFilter as 'sale' | 'trade' | 'both');
      }

      if (conditionFilter.length > 0) {
        query = query.in('condition', conditionFilter as ('new' | 'excellent' | 'good' | 'fair')[]);
      }

      if (priceRange[0] > 0) query = query.gte('price', priceRange[0]);
      if (priceRange[1] < 1000) query = query.lte('price', priceRange[1]);

      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'price_low') {
        query = query.order('price', { ascending: true, nullsFirst: false });
      } else if (sortBy === 'price_high') {
        query = query.order('price', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Listing[];
    },
  });

  const toggleCondition = (c: string) => {
    setConditionFilter((prev) => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const activeFilterCount = (listingTypeFilter !== 'all' ? 1 : 0) + conditionFilter.length +
    (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0);

  const clearAll = () => {
    setListingTypeFilter('all');
    setConditionFilter([]);
    setPriceRange([0, 1000]);
  };

  const typeChips = [
    { value: 'all', label: 'All' },
    { value: 'sale', label: 'For Sale' },
    { value: 'trade', label: 'For Trade' },
    { value: 'both', label: 'Sale & Trade' },
  ];
  const conditionChips = [
    { value: 'new', label: 'New' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
  ];

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'excellent': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'good': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'fair': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold mb-2">Marketplace</h1>
            <p className="text-muted-foreground">Browse fragrances available for trade or purchase</p>
          </div>

          {/* Top toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card/60 border-border/60"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="default"
                className="lg:hidden"
                onClick={() => setMobileFiltersOpen(v => !v)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">{activeFilterCount}</Badge>
                )}
              </Button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[170px] bg-card/60 border-border/60">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid lg:grid-cols-[260px_1fr] gap-8">
            {/* Sidebar Filters */}
            <aside className={cn(
              "space-y-6 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 h-fit lg:sticky lg:top-24",
              !mobileFiltersOpen && "hidden lg:block"
            )}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Filters</h2>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {/* Listing Type chips */}
              <div className="space-y-2.5">
                <p className="text-xs font-medium text-foreground/80">Listing type</p>
                <div className="flex flex-wrap gap-1.5">
                  {typeChips.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setListingTypeFilter(c.value)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs border transition-all",
                        listingTypeFilter === c.value
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-transparent border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/40" />

              {/* Condition chips (multi) */}
              <div className="space-y-2.5">
                <p className="text-xs font-medium text-foreground/80">Condition</p>
                <div className="flex flex-wrap gap-1.5">
                  {conditionChips.map((c) => {
                    const active = conditionFilter.includes(c.value);
                    return (
                      <button
                        key={c.value}
                        onClick={() => toggleCondition(c.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs border transition-all",
                          active
                            ? "bg-primary/10 text-primary border-primary/40"
                            : "bg-transparent border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-border/40" />

              {/* Price slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground/80">Price range</p>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    ${priceRange[0]} – ${priceRange[1]}{priceRange[1] === 1000 ? '+' : ''}
                  </span>
                </div>
                <Slider
                  value={priceRange}
                  onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
                  min={0}
                  max={1000}
                  step={10}
                  className="py-1"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Math.max(0, Number(e.target.value) || 0), priceRange[1]])}
                    className="h-8 text-xs"
                  />
                  <span className="text-muted-foreground text-xs">to</span>
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Math.min(1000, Number(e.target.value) || 0)])}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </aside>

            {/* Results column */}
            <div>
              {/* Listings Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {listings.map((listing) => (
                <Card key={listing.id} className="group overflow-hidden hover:shadow-luxury transition-all duration-300 border-border/50">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {listing.image_url ? (
                      <img
                        src={listing.image_url}
                        alt={listing.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <FavoriteButton
                        name={listing.name}
                        brand={listing.brand}
                        imageUrl={listing.image_url || undefined}
                        className="bg-background/80 hover:bg-background"
                      />
                    </div>
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      {listing.listing_type === 'trade' && (
                        <Badge className="bg-accent text-accent-foreground">Trade Only</Badge>
                      )}
                      {listing.listing_type === 'sale' && (
                        <Badge className="bg-primary text-primary-foreground">For Sale</Badge>
                      )}
                      {listing.listing_type === 'both' && (
                        <Badge className="gradient-primary text-primary-foreground border-0">Sale/Trade</Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">{listing.name}</h3>
                        <p className="text-sm text-muted-foreground">{listing.brand}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className={getConditionColor(listing.condition)}>
                        {listing.condition}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{listing.size}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      {listing.price && (
                        <span className="text-xl font-bold text-primary">${listing.price}</span>
                      )}
                      {listing.estimated_value && !listing.price && (
                        <span className="text-sm text-muted-foreground">
                          Est. ${listing.estimated_value}
                        </span>
                      )}
                      {listing.profiles && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Shield className="w-3 h-3" />
                          <span>@{listing.profiles.username}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 gap-2">
                    {listing.listing_type !== 'trade' && (
                      <Button size="sm" className="flex-1">
                        Buy Now
                      </Button>
                    )}
                    {listing.listing_type !== 'sale' && (
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link to={`/trade/${listing.id}`}>Propose Trade</Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No listings found</p>
              <Button asChild>
                <Link to="/create-listing">Create the first listing</Link>
              </Button>
            </div>
          )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketplacePage;
