import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

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
}: FragranceSearchProps) => {
  const [suggestions, setSuggestions] = useState<FragranceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchFragrances = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Fast path: query the local catalog directly (no edge-function cold start)
      const safe = query.trim().replace(/[%,()]/g, '');
      const { data, error } = await supabase
        .from('fragrances')
        .select('name, brand, image_url')
        .eq('approved', true)
        .or(`name.ilike.%${safe}%,brand.ilike.%${safe}%`)
        .limit(12);

      if (error) throw error;
      setSuggestions(
        (data ?? []).map((d: any) => ({ name: d.name, brand: d.brand, imageUrl: d.image_url ?? undefined }))
      );
      setShowSuggestions(true);
      setActiveIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (value: string) => {
    onNameChange(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchFragrances(value);
    }, 200);
  };

  const handleSelect = (suggestion: FragranceSuggestion) => {
    onSelect(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-4">
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
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
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
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-72 overflow-auto">
              {suggestions.map((suggestion, index) => (
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
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
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
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={brandId}>Brand {required && '*'}</Label>
          <Input
            id={brandId}
            value={brandValue}
            onChange={(e) => onBrandChange(e.target.value)}
            placeholder="e.g., Chanel"
            required={required}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};
