import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mergeFragranceResults, searchLiveFragrances, searchLiveFragrancesPaged } from '@/lib/fragranceLiveSearch';

interface FragranceSuggestion {
  name: string;
  brand: string;
  imageUrl?: string;
}

interface FragranceSearchProps {
  onSelect: (fragrance: FragranceSuggestion) => void;
  nameValue: string;
  brandValue: string;
  onNameChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  nameId?: string;
  brandId?: string;
  required?: boolean;
  disabled?: boolean;
  excludeItems?: { name: string; brand: string }[];
}

const normKey = (brand: string, name: string) =>
  `${brand.trim().toLowerCase().replace(/\s+/g, ' ')}|${name.trim().toLowerCase().replace(/\s+/g, ' ')}`;

export const FragranceSearch = ({
  onSelect,
  nameValue,
  brandValue,
  onNameChange,
  onBrandChange,
  nameId = 'name',
  brandId = 'brand',
  required = false,
  disabled = false,
  excludeItems = [],
}: FragranceSearchProps) => {
  const excludeSet = new Set(excludeItems.map((i) => normKey(i.brand, i.name)));
  const dedupe = (arr: FragranceSuggestion[]) => {
    const seen = new Set<string>();
    return arr.filter((s) => {
      const k = normKey(s.brand, s.name);
      if (seen.has(k) || excludeSet.has(k)) return false;
      seen.add(k);
      return true;
    });
  };
  const [nameSuggestions, setNameSuggestions] = useState<FragranceSuggestion[]>([]);
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isBrandLoading, setIsBrandLoading] = useState(false);
  const [showName, setShowName] = useState(false);
  const [showBrand, setShowBrand] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeBrand, setActiveBrand] = useState<string>('');
  const [nextPage, setNextPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 50;
  const INITIAL_PAGES = 4;
  const nameDebounce = useRef<ReturnType<typeof setTimeout>>();
  const brandDebounce = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowName(false);
        setShowBrand(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchByName = async (query: string) => {
    if (query.length < 2 && brandValue.trim().length < 2) { setNameSuggestions([]); return; }
    setIsLoading(true);
    try {
      const safe = query.trim().replace(/[%,()]/g, '');
      let q = supabase
        .from('fragrances')
        .select('name, brand, image_url')
        .eq('approved', true)
        .ilike('name', `%${safe}%`);
      if (brandValue.trim()) q = q.ilike('brand', `%${brandValue.trim().replace(/[%,()]/g, '')}%`);
      const [{ data, error }, live] = await Promise.all([
        q.limit(50),
        searchLiveFragrances(`${brandValue.trim()} ${safe}`.trim(), 50).catch(() => []),
      ]);
      if (error) throw error;
      const local = (data ?? []).map((d: any) => ({ name: d.name, brand: d.brand, imageUrl: d.image_url ?? undefined }));
      const remote = live
        .filter((d) => !brandValue.trim() || d.brand.toLowerCase().includes(brandValue.trim().toLowerCase()))
        .map((d) => ({ name: d.name, brand: d.brand, imageUrl: d.image_url ?? undefined }));
      setNameSuggestions(dedupe(mergeFragranceResults(local, remote)).slice(0, 30));
      setShowName(true);
      setActiveIndex(-1);
    } catch (e) {
      console.error('Name search error:', e);
      setNameSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBrandFragrances = async (brand: string) => {
    if (brand.trim().length < 2) return;
    setIsLoading(true);
    setActiveBrand(brand.trim());
    try {
      const safeBrand = brand.trim().replace(/[%,()]/g, '');
      const [{ data, error }, live] = await Promise.all([
        supabase
          .from('fragrances')
          .select('name, brand, image_url')
          .eq('approved', true)
          .ilike('brand', `%${safeBrand}%`)
          .limit(500),
        searchLiveFragrancesPaged(safeBrand, INITIAL_PAGES, PAGE_SIZE).catch(() => []),
      ]);
      if (error) throw error;
      const local = (data ?? []).map((d: any) => ({ name: d.name, brand: d.brand, imageUrl: d.image_url ?? undefined }));
      const remote = live
        .filter((d) => d.brand.toLowerCase().includes(safeBrand.toLowerCase()))
        .map((d) => ({ name: d.name, brand: d.brand, imageUrl: d.image_url ?? undefined }));
      setNameSuggestions(dedupe(mergeFragranceResults(local, remote)));
      setNextPage(INITIAL_PAGES);
      setHasMore(live.length >= INITIAL_PAGES * PAGE_SIZE);
      setShowName(true);
      setActiveIndex(-1);
    } catch (e) {
      console.error('Brand fragrance search error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreBrandFragrances = async () => {
    if (!activeBrand || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const safeBrand = activeBrand.replace(/[%,()]/g, '');
      const more = await searchLiveFragrances(safeBrand, PAGE_SIZE, nextPage * PAGE_SIZE).catch(() => []);
      const filtered = more
        .filter((d) => d.brand.toLowerCase().includes(safeBrand.toLowerCase()))
        .map((d) => ({ name: d.name, brand: d.brand, imageUrl: d.image_url ?? undefined }));
      setNameSuggestions((prev) => mergeFragranceResults(prev, filtered));
      setNextPage((p) => p + 1);
      setHasMore(more.length >= PAGE_SIZE);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const searchByBrand = async (query: string) => {
    if (query.length < 1) { setBrandSuggestions([]); return; }
    setIsBrandLoading(true);
    try {
      const safe = query.trim().replace(/[%,()]/g, '');
      const { data, error } = await supabase
        .from('fragrances')
        .select('brand')
        .eq('approved', true)
        .ilike('brand', `${safe}%`)
        .limit(50);
      if (error) throw error;
      const live = await searchLiveFragrances(safe, 50).catch(() => []);
      const unique = Array.from(new Set([
        ...(data ?? []).map((d: any) => d.brand),
        ...live.map((d) => d.brand),
      ].filter((b) => b.toLowerCase().includes(safe.toLowerCase())))).slice(0, 20);
      setBrandSuggestions(unique);
      setShowBrand(true);
    } catch (e) {
      console.error('Brand search error:', e);
      setBrandSuggestions([]);
    } finally {
      setIsBrandLoading(false);
    }
  };

  const handleNameChange = (value: string) => {
    onNameChange(value);
    if (nameDebounce.current) clearTimeout(nameDebounce.current);
    nameDebounce.current = setTimeout(() => searchByName(value), 200);
  };

  const handleBrandChange = (value: string) => {
    onBrandChange(value);
    if (brandDebounce.current) clearTimeout(brandDebounce.current);
    brandDebounce.current = setTimeout(() => searchByBrand(value), 200);
  };

  const handleSelect = (suggestion: FragranceSuggestion) => {
    onSelect(suggestion);
    setShowName(false);
    setNameSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showName || nameSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(p => (p < nameSuggestions.length - 1 ? p + 1 : p)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(p => (p > 0 ? p - 1 : p)); }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); handleSelect(nameSuggestions[activeIndex]); }
    else if (e.key === 'Escape') setShowName(false);
  };

  return (
    <div ref={containerRef} className="space-y-4 relative" style={{ zIndex: 60 }}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 relative">
          <Label htmlFor={nameId}>Name {required && '*'}</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id={nameId}
              value={nameValue}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (nameSuggestions.length > 0) setShowName(true); else if (brandValue.trim().length >= 2) loadBrandFragrances(brandValue); }}
              placeholder="Start typing to search..."
              className="pl-9"
              required={required}
              disabled={disabled}
              autoComplete="off"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {showName && nameSuggestions.length > 0 && (
            <div className="absolute z-[200] w-full mt-1 bg-popover border rounded-md shadow-lg max-h-72 overflow-auto">
              {nameSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.name}-${suggestion.brand}`}
                  type="button"
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-3",
                    activeIndex === index && "bg-accent"
                  )}
                  onClick={() => handleSelect(suggestion)}
                >
                  {suggestion.imageUrl ? (
                    <img
                      src={suggestion.imageUrl}
                      alt={suggestion.name}
                      className="w-10 h-10 rounded object-cover bg-muted flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{suggestion.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{suggestion.brand}</div>
                  </div>
                </button>
              ))}
              {activeBrand && hasMore && (
                <button
                  type="button"
                  onClick={loadMoreBrandFragrances}
                  disabled={isLoadingMore}
                  className="w-full px-3 py-2 text-center text-sm font-medium border-t hover:bg-accent transition-colors flex items-center justify-center gap-2"
                >
                  {isLoadingMore && <Loader2 className="w-3 h-3 animate-spin" />}
                  {isLoadingMore ? 'Loading…' : `Load more (${nameSuggestions.length} loaded)`}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor={brandId}>Brand {required && '*'}</Label>
          <div className="relative">
            <Input
              id={brandId}
              value={brandValue}
              onChange={(e) => handleBrandChange(e.target.value)}
              onFocus={() => brandSuggestions.length > 0 && setShowBrand(true)}
              placeholder="e.g., Chanel"
              required={required}
              disabled={disabled}
              autoComplete="off"
            />
            {isBrandLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {showBrand && brandSuggestions.length > 0 && (
            <div className="absolute z-[200] w-full mt-1 bg-popover border rounded-md shadow-lg max-h-72 overflow-auto">
              {brandSuggestions.map((b) => (
                <button
                  key={b}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                  onClick={() => { onBrandChange(b); setShowBrand(false); loadBrandFragrances(b); }}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
