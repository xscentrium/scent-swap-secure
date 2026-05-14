import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SEO } from "@/components/SEO";
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Search, ArrowUpDown, X, SlidersHorizontal, BadgeCheck, AlertTriangle, Sparkles, Plus, TrendingUp, ShieldCheck, LayoutGrid, Rows3, Flame } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { FavoriteButton } from '@/components/FavoriteButton';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { getImageVerification } from '@/lib/imageVerification';
import { ListingImage, isListingDisplayable, verificationLabel, type DBVerification } from '@/components/ListingImage';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { ListingQuickView } from '@/components/ListingQuickView';

const PRICE_MIN = 0;
const PRICE_MAX = 1000;
const clampPrice = (n: number) => Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round(Number.isFinite(n) ? n : 0)));

type Listing = {
  id: string;
  name: string;
  brand: string;
  size: string;
  condition: string;
  description?: string | null;
  estimated_value: number | null;
  price: number | null;
  listing_type: string;
  image_url: string | null;
  owner_id: string;
  created_at?: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    id_verified?: boolean | null;
  } | null;
  image_verification?: DBVerification | DBVerification[];
};

// Strength inference: parses concentration from name/description
type Strength = 'light' | 'medium' | 'intense';
const inferStrength = (l: Listing): Strength => {
  const t = `${l.name} ${l.description ?? ''}`.toLowerCase();
  if (/\b(parfum|extrait|elixir|intense|absolu|oud|attar|extract)\b/.test(t)) return 'intense';
  if (/\b(edp|eau de parfum)\b/.test(t)) return 'intense';
  if (/\b(edt|eau de toilette)\b/.test(t)) return 'medium';
  if (/\b(edc|eau de cologne|cologne|fraiche|fraîche|splash|aqua)\b/.test(t)) return 'light';
  return 'medium';
};

const NOTE_OPTIONS = [
  { value: 'oud', label: 'Oud' },
  { value: 'vanilla', label: 'Vanilla' },
  { value: 'rose', label: 'Rose' },
  { value: 'jasmine', label: 'Jasmine' },
  { value: 'sandalwood', label: 'Sandalwood' },
  { value: 'amber', label: 'Amber' },
  { value: 'musk', label: 'Musk' },
  { value: 'leather', label: 'Leather' },
  { value: 'tobacco', label: 'Tobacco' },
  { value: 'bergamot', label: 'Bergamot' },
  { value: 'patchouli', label: 'Patchouli' },
  { value: 'cedar', label: 'Cedar' },
];

const VIBE_OPTIONS: { value: string; label: string; keywords: string[] }[] = [
  { value: 'fresh', label: '🌿 Fresh', keywords: ['fresh', 'aqua', 'marine', 'cologne', 'citrus', 'mint', 'green'] },
  { value: 'woody', label: '🌲 Woody', keywords: ['wood', 'cedar', 'sandalwood', 'oud', 'vetiver'] },
  { value: 'floral', label: '🌸 Floral', keywords: ['floral', 'rose', 'jasmine', 'iris', 'lily', 'tuberose', 'flower'] },
  { value: 'spicy', label: '🌶 Spicy', keywords: ['spice', 'pepper', 'cinnamon', 'cardamom', 'saffron', 'clove'] },
  { value: 'sweet', label: '🍯 Sweet', keywords: ['vanilla', 'sweet', 'sugar', 'honey', 'caramel', 'gourmand', 'praline', 'chocolate'] },
  { value: 'citrus', label: '🍋 Citrus', keywords: ['citrus', 'lemon', 'bergamot', 'orange', 'grapefruit', 'mandarin'] },
  { value: 'smoky', label: '🔥 Smoky', keywords: ['smoke', 'incense', 'tobacco', 'leather', 'tar', 'birch'] },
  { value: 'aquatic', label: '🌊 Aquatic', keywords: ['aquatic', 'marine', 'sea', 'ozone', 'water'] },
];

const MarketplacePage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Initialize state from URL ---
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
  const [verifiedSellerOnly, setVerifiedSellerOnly] = useState(() => searchParams.get('vseller') === '1');
  const [brandFilter, setBrandFilter] = useState<string[]>(() => {
    const b = searchParams.get('brand');
    return b ? b.split(',').filter(Boolean) : [];
  });
  const [sizeFilter, setSizeFilter] = useState<string>(() => searchParams.get('size') ?? 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (searchParams.get('view') === 'list' ? 'list' : 'grid'));
  const [strengthFilter, setStrengthFilter] = useState<Strength[]>(() => {
    const s = searchParams.get('strength');
    return s ? (s.split(',').filter(Boolean) as Strength[]) : [];
  });
  const [notesFilter, setNotesFilter] = useState<string[]>(() => {
    const n = searchParams.get('notes');
    return n ? n.split(',').filter(Boolean) : [];
  });
  const [vibesFilter, setVibesFilter] = useState<string[]>(() => {
    const v = searchParams.get('vibes');
    return v ? v.split(',').filter(Boolean) : [];
  });
  const [genderFilter, setGenderFilter] = useState<string>(() => searchParams.get('gender') ?? 'all');

  const debouncedSearch = useDebounce(search, 350);
  const debouncedPriceRange = useDebounce(priceRange, 300);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (listingTypeFilter !== 'all') params.set('type', listingTypeFilter);
    if (conditionFilter.length) params.set('cond', conditionFilter.join(','));
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (debouncedPriceRange[0] > PRICE_MIN) params.set('min', String(debouncedPriceRange[0]));
    if (debouncedPriceRange[1] < PRICE_MAX) params.set('max', String(debouncedPriceRange[1]));
    if (!hideUnverified) params.set('verified', '0');
    if (verifiedSellerOnly) params.set('vseller', '1');
    if (brandFilter.length) params.set('brand', brandFilter.join(','));
    if (sizeFilter !== 'all') params.set('size', sizeFilter);
    if (viewMode === 'list') params.set('view', 'list');
    if (strengthFilter.length) params.set('strength', strengthFilter.join(','));
    if (notesFilter.length) params.set('notes', notesFilter.join(','));
    if (vibesFilter.length) params.set('vibes', vibesFilter.join(','));
    if (genderFilter !== 'all') params.set('gender', genderFilter);
    // Preserve quick-view param across filter changes
    const currentListing = searchParams.get('listing');
    if (currentListing) params.set('listing', currentListing);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, listingTypeFilter, conditionFilter, sortBy, debouncedPriceRange, hideUnverified, verifiedSellerOnly, brandFilter, sizeFilter, viewMode, strengthFilter, notesFilter, vibesFilter, genderFilter, setSearchParams]);

  useEffect(() => {
    const ch = supabase
      .channel('marketplace-image-verifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listing_image_verifications' }, () => {
        queryClient.invalidateQueries({ queryKey: ['listings'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  const { data: listings, isLoading } = useQuery({
    queryKey: ['listings', debouncedSearch, listingTypeFilter, conditionFilter, sortBy, debouncedPriceRange, brandFilter],
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_owner_id_fkey (
            username,
            avatar_url,
            id_verified
          ),
          image_verification:listing_image_verifications(status, reason, source)
        `)
        .eq('is_active', true);

      if (debouncedSearch) {
        const safe = debouncedSearch.replace(/[%,]/g, ' ').trim();
        if (safe) query = query.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%`);
      }
      if (listingTypeFilter !== 'all') query = query.eq('listing_type', listingTypeFilter as 'sale' | 'trade' | 'both');
      if (conditionFilter.length > 0) query = query.in('condition', conditionFilter as ('new' | 'excellent' | 'good' | 'fair')[]);
      if (brandFilter.length > 0) query = query.in('brand', brandFilter);
      if (debouncedPriceRange[0] > PRICE_MIN) query = query.gte('price', debouncedPriceRange[0]);
      if (debouncedPriceRange[1] < PRICE_MAX) query = query.lte('price', debouncedPriceRange[1]);

      if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
      else if (sortBy === 'price_low') query = query.order('price', { ascending: true, nullsFirst: false });
      else if (sortBy === 'price_high') query = query.order('price', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as Listing[];
    },
  });

  const toggleCondition = (c: string) => setConditionFilter((prev) => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleBrand = (b: string) => setBrandFilter((prev) => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  const toggleStrength = (s: Strength) => setStrengthFilter((prev) => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleNote = (n: string) => setNotesFilter((prev) => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  const toggleVibe = (v: string) => setVibesFilter((prev) => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const parseSize = (s: string): number | null => {
    const m = (s || '').match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : null;
  };
  const matchesSize = (raw: string) => {
    if (sizeFilter === 'all') return true;
    const ml = parseSize(raw);
    if (ml == null) return false;
    if (sizeFilter === 'travel') return ml < 30;
    if (sizeFilter === 'small') return ml >= 30 && ml < 75;
    if (sizeFilter === 'large') return ml >= 75;
    return true;
  };

  const matchesNotes = (l: Listing) => {
    if (!notesFilter.length) return true;
    const t = `${l.name} ${l.description ?? ''}`.toLowerCase();
    return notesFilter.every((n) => t.includes(n));
  };
  const matchesVibes = (l: Listing) => {
    if (!vibesFilter.length) return true;
    const t = `${l.name} ${l.description ?? ''}`.toLowerCase();
    return vibesFilter.every((v) => {
      const opt = VIBE_OPTIONS.find((o) => o.value === v);
      return opt ? opt.keywords.some((k) => t.includes(k)) : true;
    });
  };
  const matchesStrength = (l: Listing) => {
    if (!strengthFilter.length) return true;
    return strengthFilter.includes(inferStrength(l));
  };
  const matchesGender = (l: Listing) => {
    if (genderFilter === 'all') return true;
    const t = `${l.name} ${l.description ?? ''}`.toLowerCase();
    if (genderFilter === 'men') return /\b(homme|men|man|pour homme|for him)\b/.test(t);
    if (genderFilter === 'women') return /\b(femme|women|woman|pour femme|for her)\b/.test(t);
    if (genderFilter === 'unisex') return /\b(unisex|shared)\b/.test(t) || (!/\b(homme|men|femme|women)\b/.test(t));
    return true;
  };

  const activeFilterCount =
    (listingTypeFilter !== 'all' ? 1 : 0) +
    conditionFilter.length +
    brandFilter.length +
    (sizeFilter !== 'all' ? 1 : 0) +
    (verifiedSellerOnly ? 1 : 0) +
    strengthFilter.length +
    notesFilter.length +
    vibesFilter.length +
    (genderFilter !== 'all' ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0);

  const clearAll = () => {
    setListingTypeFilter('all');
    setConditionFilter([]);
    setBrandFilter([]);
    setSizeFilter('all');
    setVerifiedSellerOnly(false);
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    setPriceInput([String(PRICE_MIN), String(PRICE_MAX)]);
    setStrengthFilter([]);
    setNotesFilter([]);
    setVibesFilter([]);
    setGenderFilter('all');
  };

  useEffect(() => {
    setPriceInput([String(priceRange[0]), String(priceRange[1])]);
  }, [priceRange]);

  const commitPriceInput = useCallback((idx: 0 | 1) => {
    const raw = Number(priceInput[idx]);
    const clamped = clampPrice(Number.isFinite(raw) ? raw : (idx === 0 ? PRICE_MIN : PRICE_MAX));
    const next: [number, number] = [...priceRange];
    next[idx] = clamped;
    if (next[0] > next[1]) next.reverse();
    setPriceRange(next as [number, number]);
  }, [priceInput, priceRange]);

  const allListings = listings ?? [];
  const displayable = useMemo(() => allListings.filter((l) => isListingDisplayable(l as any)), [allListings]);
  const baseVisible = hideUnverified ? displayable : allListings;

  // Quick view modal driven by ?listing=ID
  const quickViewId = searchParams.get('listing');
  const quickViewListing = useMemo(
    () => allListings.find((l: any) => l.id === quickViewId) ?? null,
    [allListings, quickViewId]
  );
  const closeQuickView = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('listing');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const visibleListings = useMemo(
    () => baseVisible.filter((l) =>
      matchesSize(l.size)
      && (!verifiedSellerOnly || l.profiles?.id_verified)
      && matchesStrength(l)
      && matchesNotes(l)
      && matchesVibes(l)
      && matchesGender(l)
    ),
    [baseVisible, sizeFilter, verifiedSellerOnly, strengthFilter, notesFilter, vibesFilter, genderFilter]
  );

  const featuredListings = useMemo(
    () => displayable.filter((l) => l.profiles?.id_verified).slice(0, 6),
    [displayable]
  );

  const topBrands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of allListings) counts.set(l.brand, (counts.get(l.brand) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [allListings]);

  // Brand list for sidebar (more comprehensive - all brands seen)
  const allBrands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of allListings) counts.set(l.brand, (counts.get(l.brand) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allListings]);

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
  const sizeChips = [
    { value: 'all', label: 'Any' },
    { value: 'travel', label: 'Travel <30ml' },
    { value: 'small', label: '30–75ml' },
    { value: 'large', label: '75ml+' },
  ];
  const strengthChips: { value: Strength; label: string; hint: string }[] = [
    { value: 'light', label: 'Light', hint: 'EDC, splash' },
    { value: 'medium', label: 'Medium', hint: 'EDT' },
    { value: 'intense', label: 'Intense', hint: 'EDP, parfum' },
  ];
  const genderChips = [
    { value: 'all', label: 'All' },
    { value: 'men', label: 'Men' },
    { value: 'women', label: 'Women' },
    { value: 'unisex', label: 'Unisex' },
  ];

  // Reusable filter panel content
  const FiltersPanel = (
    <div className="space-y-6">
      {/* Listing Type */}
      <div className="space-y-2.5">
        <p id="lbl-type" className="text-xs font-medium text-foreground/80">Listing type</p>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-labelledby="lbl-type">
          {typeChips.map((c) => {
            const checked = listingTypeFilter === c.value;
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setListingTypeFilter(c.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-all",
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

      {/* Scent strength */}
      <div className="space-y-2.5">
        <p className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-[hsl(var(--gold))]" /> Scent strength
        </p>
        <div className="flex flex-wrap gap-1.5">
          {strengthChips.map((s) => {
            const active = strengthFilter.includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleStrength(s.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-all",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
                title={s.hint}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-border/40" />

      {/* Vibes */}
      <div className="space-y-2.5">
        <p className="text-xs font-medium text-foreground/80">Vibe</p>
        <div className="flex flex-wrap gap-1.5">
          {VIBE_OPTIONS.map((v) => {
            const active = vibesFilter.includes(v.value);
            return (
              <button
                key={v.value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleVibe(v.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-all",
                  active
                    ? "bg-primary/10 text-primary border-primary/40"
                    : "bg-transparent border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-border/40" />

      {/* Notes */}
      <div className="space-y-2.5">
        <p className="text-xs font-medium text-foreground/80">Fragrance notes</p>
        <div className="flex flex-wrap gap-1.5">
          {NOTE_OPTIONS.map((n) => {
            const active = notesFilter.includes(n.value);
            return (
              <button
                key={n.value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleNote(n.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-all",
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {n.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-border/40" />

      {/* Gender */}
      <div className="space-y-2.5">
        <p className="text-xs font-medium text-foreground/80">Gender</p>
        <div className="flex flex-wrap gap-1.5">
          {genderChips.map((g) => {
            const checked = genderFilter === g.value;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => setGenderFilter(g.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-all",
                  checked
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-border/40" />

      {/* Brand */}
      {allBrands.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-foreground/80">Brand</p>
          <div className="max-h-44 overflow-y-auto pr-1 flex flex-wrap gap-1.5">
            {allBrands.map(([brand, count]) => {
              const active = brandFilter.includes(brand);
              return (
                <button
                  key={brand}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleBrand(brand)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs border transition-all inline-flex items-center gap-1.5",
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <span>{brand}</span>
                  <span className={cn("text-[10px] tabular-nums", active ? "opacity-70" : "text-muted-foreground/70")}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Separator className="bg-border/40" />

      {/* Condition */}
      <div className="space-y-2.5">
        <p className="text-xs font-medium text-foreground/80">Condition</p>
        <div className="flex flex-wrap gap-1.5">
          {conditionChips.map((c) => {
            const active = conditionFilter.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={active}
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

      {/* Size */}
      <div className="space-y-2.5">
        <p className="text-xs font-medium text-foreground/80">Bottle size</p>
        <div className="flex flex-wrap gap-1.5">
          {sizeChips.map((s) => {
            const checked = sizeFilter === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setSizeFilter(s.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-all",
                  checked
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-border/40" />

      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground/80">Verified photo only</p>
          <p className="text-[10px] text-muted-foreground">
            {hideUnverified ? `${hiddenCount} hidden` : 'Showing all photos'}
          </p>
        </div>
        <Switch checked={hideUnverified} onCheckedChange={setHideUnverified} aria-label="Hide listings with unverified photos" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[hsl(var(--gold))]" /> Verified sellers only
          </p>
          <p className="text-[10px] text-muted-foreground">ID-confirmed traders</p>
        </div>
        <Switch checked={verifiedSellerOnly} onCheckedChange={setVerifiedSellerOnly} aria-label="Show only verified sellers" />
      </div>

      <Separator className="bg-border/40" />

      {/* Price */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-foreground/80">Price range</p>
          <span className="text-xs tabular-nums text-muted-foreground">
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
          <span className="text-muted-foreground text-xs">to</span>
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
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SEO
        title="Marketplace — Buy & Trade Niche Fragrances | Xscentrium"
        description="Browse verified listings of rare colognes, perfumes and oils. Filter by brand, price, accord and trade-only options."
        path="/marketplace"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Xscentrium Marketplace",
            url: "https://xscentrium.com/marketplace",
            description: "Verified listings of rare colognes, perfumes and oils with escrow protection.",
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://xscentrium.com/" },
              { "@type": "ListItem", position: 2, name: "Marketplace", item: "https://xscentrium.com/marketplace" },
            ],
          },
        ]}
      />
      {/* Editorial backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-32 w-[560px] h-[560px] rounded-full bg-[hsl(var(--gold)/0.08)] blur-3xl" />
        <div className="absolute top-[40%] -left-40 w-[520px] h-[520px] rounded-full bg-accent/30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <main className="relative pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* HERO */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 grid lg:grid-cols-12 gap-8 items-end"
          >
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-10 bg-foreground/40" />
                <span className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                  Vol. 02 — Marketplace
                </span>
              </div>
              <h1 className="font-serif font-bold leading-[0.95] tracking-tight text-[clamp(2.5rem,6vw,5rem)]">
                Bottles with{' '}
                <span className="italic font-light text-muted-foreground">stories</span>
                <span className="block">to be continued.</span>
              </h1>
              <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Hand-curated decants and full bottles from verified collectors. Every trade is escrow-protected.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-5 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[hsl(var(--gold))]" /> Escrow secured
                </span>
                <span className="inline-flex items-center gap-2">
                  <BadgeCheck className="w-3.5 h-3.5 text-[hsl(var(--gold))]" /> ID-verified sellers
                </span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--gold))]" /> Photo-authenticated
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <Button asChild size="lg" className="rounded-none h-12 tracking-wide justify-between">
                <Link to="/create-listing">
                  List a Fragrance
                  <Plus className="w-4 h-4" />
                </Link>
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-border bg-card/60 backdrop-blur-sm p-4 rounded-sm">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Live</p>
                  <p className="font-serif text-3xl mt-1">{allListings.length}</p>
                  <p className="text-[10px] text-muted-foreground">listings</p>
                </div>
                <div className="border border-border bg-card/60 backdrop-blur-sm p-4 rounded-sm">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Held</p>
                  <p className="font-serif text-3xl mt-1">50%</p>
                  <p className="text-[10px] text-muted-foreground">in escrow</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* FEATURED STRIP */}
          {featuredListings.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-12"
            >
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-1">
                    Editor's edit
                  </p>
                  <h2 className="font-serif text-2xl md:text-3xl flex items-center gap-3">
                    <Flame className="w-5 h-5 text-[hsl(var(--gold))]" />
                    Verified-seller picks
                  </h2>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x">
                {featuredListings.map((l) => (
                  <Link
                    key={l.id}
                    to={`/marketplace?listing=${l.id}`}
                    className="group relative shrink-0 w-[240px] snap-start border border-border bg-card/70 backdrop-blur-sm hover:border-foreground/40 transition-all"
                  >
                    <div className="aspect-[4/5] bg-gradient-to-b from-muted/40 to-muted/10 overflow-hidden">
                      <ListingImage
                        url={l.image_url}
                        alt={`${l.brand} ${l.name}`}
                        verification={Array.isArray(l.image_verification) ? l.image_verification[0] : l.image_verification}
                        className="object-contain p-5 transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground truncate">{l.brand}</p>
                      <p className="font-serif text-base truncate mt-1">{l.name}</p>
                      <p className="font-serif text-lg mt-1">{l.price ? `$${l.price}` : `Est. $${l.estimated_value ?? '—'}`}</p>
                    </div>
                    <span className="absolute top-3 left-3 text-[9px] uppercase tracking-[0.22em] px-2 py-0.5 bg-background/80 backdrop-blur border border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold))] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          {/* BRAND RAIL */}
          {topBrands.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Shop by house
                </p>
                {brandFilter.length > 0 && (
                  <button onClick={() => setBrandFilter([])} className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {topBrands.map(([brand, count]) => {
                  const active = brandFilter.includes(brand);
                  return (
                    <button
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 border transition-all",
                        active
                          ? "bg-foreground text-background border-foreground"
                          : "bg-card/50 border-border hover:border-foreground/40"
                      )}
                    >
                      <span className="font-serif text-sm">{brand}</span>
                      <span className={cn("text-[10px] tabular-nums", active ? "opacity-70" : "text-muted-foreground")}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search by name or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 rounded-none bg-card/60 border-border/60 focus-visible:ring-foreground/30"
                aria-label="Search fragrances"
                role="searchbox"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="lg:hidden h-12 rounded-none"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">{activeFilterCount}</Badge>
                )}
              </Button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-12 rounded-none bg-card/60 border-border/60">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
              <div className="hidden sm:inline-flex border border-border bg-card/60 h-12">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={cn("px-3 transition-colors", viewMode === 'grid' ? "bg-foreground text-background" : "hover:bg-muted/50")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={cn("px-3 transition-colors border-l border-border", viewMode === 'list' ? "bg-foreground text-background" : "hover:bg-muted/50")}
                >
                  <Rows3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-6 flex items-center gap-2" role="status" aria-live="polite">
            <TrendingUp className="w-3 h-3" />
            {resultLabel}
          </p>

          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            {/* Sidebar Filters - desktop only */}
            <aside
              aria-label="Marketplace filters"
              className="hidden lg:block space-y-6 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 h-fit lg:sticky lg:top-24 max-h-[calc(100vh-7rem)] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Filters</h2>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>
              {FiltersPanel}
            </aside>

            {/* Mobile filters drawer */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/40">
                  <SheetTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">{activeFilterCount}</Badge>
                    )}
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    Refine listings by scent, brand, price, and more.
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-1">
                  <div className="px-5 py-5">
                    {FiltersPanel}
                  </div>
                </ScrollArea>
                <SheetFooter className="px-5 py-4 border-t border-border/40 flex-row gap-2 sm:gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={clearAll}
                    disabled={activeFilterCount === 0}
                  >
                    <X className="w-4 h-4 mr-1.5" /> Clear all
                  </Button>
                  <Button className="flex-1" onClick={() => setMobileFiltersOpen(false)}>
                    Show {resultCount} result{resultCount === 1 ? '' : 's'}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Results column */}
            <div>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border border-border/40 bg-card/40 rounded-sm animate-pulse">
                      <div className="aspect-[4/5] bg-muted/40" />
                      <div className="p-6 space-y-3">
                        <div className="h-2 w-1/3 bg-muted/60" />
                        <div className="h-5 w-2/3 bg-muted/60" />
                        <div className="h-2 w-1/2 bg-muted/40" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : visibleListings && visibleListings.length > 0 ? (
                <TooltipProvider delayDuration={150}>
                  <div className={cn(viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "grid grid-cols-1 gap-3")}>
                    {visibleListings.map((listing, idx) => {
                      const dbVerification = Array.isArray(listing.image_verification)
                        ? listing.image_verification[0]
                        : listing.image_verification;
                      const verification = getImageVerification(listing.image_url);
                      const vlabel = verificationLabel(listing.image_url, dbVerification);
                      const strength = inferStrength(listing);
                      return (
                        <motion.div
                          key={listing.id}
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: Math.min(idx * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
                        >
                          <Card
                            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/80 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_hsl(35_38%_48%/0.35)] transition-all duration-500 cursor-pointer"
                            onClick={() => {
                              const next = new URLSearchParams(searchParams);
                              next.set('listing', listing.id);
                              setSearchParams(next, { replace: false });
                            }}
                          >
                            <div className="aspect-[4/5] bg-gradient-to-b from-muted/40 to-muted/10 relative overflow-hidden">
                              <ListingImage
                                url={listing.image_url}
                                alt={`${listing.brand} ${listing.name}`}
                                verification={dbVerification}
                                className="object-contain p-6 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                              />

                              <div className="absolute top-3 left-3 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                                <FavoriteButton
                                  name={listing.name}
                                  brand={listing.brand}
                                  imageUrl={listing.image_url || undefined}
                                  className="bg-background/85 backdrop-blur-sm hover:bg-background"
                                />
                                {vlabel.tone === 'ok' ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-background/85 backdrop-blur-sm border border-primary/30 text-primary">
                                        <BadgeCheck className="w-3 h-3" />
                                        {vlabel.label}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">{dbVerification?.reason || verification.label}</TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-background/85 backdrop-blur-sm border border-warning/40 text-warning">
                                        <AlertTriangle className="w-3 h-3" />
                                        {vlabel.label}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">{dbVerification?.reason || verification.label}</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>

                              <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                                {listing.listing_type === 'trade' && (
                                  <span className="text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 rounded-full bg-background/85 backdrop-blur-sm border border-border/60 text-foreground/80">Trade</span>
                                )}
                                {listing.listing_type === 'sale' && (
                                  <span className="text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 rounded-full bg-primary/95 text-primary-foreground">For Sale</span>
                                )}
                                {listing.listing_type === 'both' && (
                                  <span className="text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 rounded-full bg-background/85 backdrop-blur-sm border border-primary/40 text-primary">Sale · Trade</span>
                                )}
                                <span
                                  className="text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 rounded-full bg-background/85 backdrop-blur-sm border border-border/60 text-muted-foreground inline-flex items-center gap-1"
                                  title={`Scent strength: ${strength}`}
                                >
                                  <Flame className="w-2.5 h-2.5" />
                                  {strength}
                                </span>
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
                                    <Shield className="w-3 h-3" />
                                    @{listing.profiles.username}
                                  </span>
                                )}
                              </div>
                              {listing.listing_type !== 'sale' ? (
                                <Button size="sm" variant="outline" className="rounded-full border-border/60" asChild onClick={(e) => e.stopPropagation()}>
                                  <Link to={`/trade/${listing.id}`}>
                                    {listing.listing_type === 'trade' ? 'Propose Trade' : 'Trade'}
                                  </Link>
                                </Button>
                              ) : (
                                <Button size="sm" className="rounded-full" onClick={(e) => e.stopPropagation()}>
                                  Buy Now
                                </Button>
                              )}
                            </CardFooter>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </TooltipProvider>
              ) : (
                <div className="text-center py-16 border border-dashed border-border/60 rounded-xl bg-card/30">
                  <p className="text-muted-foreground mb-4">No listings match your filters</p>
                  <div className="flex items-center justify-center gap-2">
                    {activeFilterCount > 0 && (
                      <Button variant="outline" onClick={clearAll}>
                        <X className="w-4 h-4 mr-1.5" /> Clear filters
                      </Button>
                    )}
                    <Button asChild>
                      <Link to="/create-listing">Create a listing</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <ListingQuickView
        open={!!quickViewListing}
        onOpenChange={(o) => { if (!o) closeQuickView(); }}
        listing={quickViewListing as any}
      />
    </div>
  );
};

export default MarketplacePage;
