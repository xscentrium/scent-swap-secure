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
import { ListingImage, isListingDisplayable, verificationLabel, type DBVerification } from '@/components/ListingImage';
import { Switch } from '@/components/ui/switch';
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
  image_verification?: DBVerification | DBVerification[];
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
  const [hideUnverified, setHideUnverified] = useState(() => searchParams.get('verified') !== '0');

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
            avatar_url
          ),
          image_verification:listing_image_verifications(status, reason, source)
        `)
        .eq('is_active', true);

      if (debouncedSearch) {
        const safe = debouncedSearch.replace(/[%,]/g, ' ').trim();
        if (safe) query = query.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%`);
      }

      if (listingTypeFilter !== 'all') {
        query = query.eq('listing_type', listingTypeFilter as 'sale' | 'trade' | 'both');
      }

      if (conditionFilter.length > 0) {
        query = query.in('condition', conditionFilter as ('new' | 'excellent' | 'good' | 'fair')[]);
      }

      if (debouncedPriceRange[0] > PRICE_MIN) query = query.gte('price', debouncedPriceRange[0]);
      if (debouncedPriceRange[1] < PRICE_MAX) query = query.lte('price', debouncedPriceRange[1]);

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
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    setPriceInput([String(PRICE_MIN), String(PRICE_MAX)]);
  };

  // Keep the editable price inputs in sync when slider moves
  useEffect(() => {
    setPriceInput([String(priceRange[0]), String(priceRange[1])]);
  }, [priceRange]);

  const commitPriceInput = useCallback((idx: 0 | 1) => {
    const raw = Number(priceInput[idx]);
    const clamped = clampPrice(Number.isFinite(raw) ? raw : (idx === 0 ? PRICE_MIN : PRICE_MAX));
    const next: [number, number] = [...priceRange];
    next[idx] = clamped;
    if (next[0] > next[1]) {
      // swap if user inverted them
      next.reverse();
    }
    setPriceRange(next as [number, number]);
  }, [priceInput, priceRange]);

  const allListings = listings ?? [];
  const displayable = useMemo(() => allListings.filter((l) => isListingDisplayable(l as any)), [allListings]);
  const visibleListings = hideUnverified ? displayable : allListings;
  const hiddenCount = allListings.length - displayable.length;
  const resultCount = visibleListings.length;
  const resultLabel = isLoading
    ? 'Searching…'
    : `${resultCount.toLocaleString()} fragrance${resultCount === 1 ? '' : 's'} found${hideUnverified && hiddenCount ? ` · ${hiddenCount} hidden (unverified photo)` : ''}`;

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
            <p className="text-muted-foreground" role="status" aria-live="polite">
              {resultLabel}
            </p>
          </div>

          {/* Top toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search by name or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card/60 border-border/60 focus-visible:ring-primary/40"
                aria-label="Search fragrances"
                role="searchbox"
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
            <aside
              aria-label="Marketplace filters"
              className={cn(
                "space-y-6 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 h-fit lg:sticky lg:top-24",
                !mobileFiltersOpen && "hidden lg:block"
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Filters</h2>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <X className="w-3 h-3" aria-hidden="true" /> Clear all filters
                  </button>
                )}
              </div>

              {/* Listing Type chips (radiogroup) */}
              <div className="space-y-2.5">
                <p id="lbl-type" className="text-xs font-medium text-foreground/80">Listing type</p>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-labelledby="lbl-type">
                  {typeChips.map((c) => {
                    const checked = listingTypeFilter === c.value;
                    return (
                      <button
                        type="button"
                        key={c.value}
                        role="radio"
                        aria-checked={checked}
                        tabIndex={checked ? 0 : -1}
                        onClick={() => setListingTypeFilter(c.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                            e.preventDefault();
                            const i = typeChips.findIndex((x) => x.value === listingTypeFilter);
                            const next = e.key === 'ArrowRight'
                              ? typeChips[(i + 1) % typeChips.length]
                              : typeChips[(i - 1 + typeChips.length) % typeChips.length];
                            setListingTypeFilter(next.value);
                          }
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          checked
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
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

              {/* Condition chips (multi-select group) */}
              <div className="space-y-2.5">
                <p id="lbl-cond" className="text-xs font-medium text-foreground/80">Condition</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="lbl-cond">
                  {conditionChips.map((c) => {
                    const active = conditionFilter.includes(c.value);
                    return (
                      <button
                        type="button"
                        key={c.value}
                        aria-pressed={active}
                        aria-label={`Condition: ${c.label}${active ? ' (selected)' : ''}`}
                        onClick={() => toggleCondition(c.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
                  <p id="lbl-price" className="text-xs font-medium text-foreground/80">Price range</p>
                  <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
                    ${priceRange[0]} – ${priceRange[1]}{priceRange[1] === PRICE_MAX ? '+' : ''}
                  </span>
                </div>
                <Slider
                  value={priceRange}
                  onValueChange={(v) => setPriceRange([clampPrice(v[0]), clampPrice(v[1])] as [number, number])}
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={10}
                  className="py-1"
                  aria-label="Price range, in dollars"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    value={priceInput[0]}
                    onChange={(e) => setPriceInput([e.target.value, priceInput[1]])}
                    onBlur={() => commitPriceInput(0)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitPriceInput(0); } }}
                    aria-label="Minimum price"
                    className="h-8 text-xs"
                  />
                  <span className="text-muted-foreground text-xs" aria-hidden="true">to</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    value={priceInput[1]}
                    onChange={(e) => setPriceInput([priceInput[0], e.target.value])}
                    onBlur={() => commitPriceInput(1)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitPriceInput(1); } }}
                    aria-label="Maximum price"
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
            <TooltipProvider delayDuration={150}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {listings.map((listing) => {
                const verification = getImageVerification(listing.image_url);
                return (
                <Card
                  key={listing.id}
                  className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/80 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_hsl(35_38%_48%/0.35)] transition-all duration-500"
                >
                  <div className="aspect-[4/5] bg-gradient-to-b from-muted/40 to-muted/10 relative overflow-hidden">
                    {(verification.status === 'verified' || verification.status === 'uploaded') && listing.image_url ? (
                      <img
                        src={listing.image_url}
                        alt={`${listing.brand} ${listing.name}`}
                        loading="lazy"
                        className="w-full h-full object-contain p-6 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground p-6 text-center">
                        <span className="text-xs tracking-widest uppercase">
                          {verification.status === 'none' ? 'Photo pending' : 'Photo not verified'}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70">
                          Awaiting verified product image
                        </span>
                      </div>
                    )}

                    {/* Top-left: favorite + verified badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <FavoriteButton
                        name={listing.name}
                        brand={listing.brand}
                        imageUrl={listing.image_url || undefined}
                        className="bg-background/85 backdrop-blur-sm hover:bg-background"
                      />
                      {(verification.status === 'verified' || verification.status === 'uploaded') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-background/85 backdrop-blur-sm border border-primary/30 text-primary">
                              <BadgeCheck className="w-3 h-3" aria-hidden="true" />
                              {verification.status === 'verified' ? 'Verified' : 'Seller photo'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right">{verification.label}</TooltipContent>
                        </Tooltip>
                      )}
                      {(verification.status === 'unverified' || verification.status === 'banned') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-background/85 backdrop-blur-sm border border-warning/40 text-warning">
                              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                              Unverified
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right">{verification.label}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Top-right: type chip */}
                    <div className="absolute top-3 right-3">
                      {listing.listing_type === 'trade' && (
                        <span className="text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 rounded-full bg-background/85 backdrop-blur-sm border border-border/60 text-foreground/80">Trade</span>
                      )}
                      {listing.listing_type === 'sale' && (
                        <span className="text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 rounded-full bg-primary/95 text-primary-foreground">For Sale</span>
                      )}
                      {listing.listing_type === 'both' && (
                        <span className="text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 rounded-full bg-background/85 backdrop-blur-sm border border-primary/40 text-primary">Sale · Trade</span>
                      )}
                    </div>
                  </div>

                  <CardContent className="px-6 pt-6 pb-3 space-y-2.5">
                    <p className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
                      {listing.brand}
                    </p>
                    <h3 className="font-serif text-xl leading-snug text-foreground">
                      {listing.name}
                    </h3>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] tracking-wider uppercase text-muted-foreground">
                        {listing.condition}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-[11px] text-muted-foreground">{listing.size}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="px-6 pb-6 pt-2 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      {listing.price ? (
                        <span className="font-serif text-2xl text-primary leading-none">
                          ${listing.price}
                        </span>
                      ) : listing.estimated_value ? (
                        <span className="text-sm text-muted-foreground">
                          Est. ${listing.estimated_value}
                        </span>
                      ) : null}
                      {listing.profiles && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Shield className="w-3 h-3" aria-hidden="true" />
                          @{listing.profiles.username}
                        </span>
                      )}
                    </div>
                    {listing.listing_type !== 'sale' ? (
                      <Button size="sm" variant="outline" className="rounded-full border-border/60" asChild>
                        <Link to={`/trade/${listing.id}`}>
                          {listing.listing_type === 'trade' ? 'Propose Trade' : 'Trade'}
                        </Link>
                      </Button>
                    ) : (
                      <Button size="sm" className="rounded-full">
                        Buy Now
                      </Button>
                    )}
                  </CardFooter>
                </Card>
                );
              })}
            </div>
            </TooltipProvider>
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
