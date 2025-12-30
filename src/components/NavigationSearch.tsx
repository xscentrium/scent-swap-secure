import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Package, Sparkles, Clock, TrendingUp, X, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  type: "user" | "listing" | "fragrance";
  title: string;
  subtitle?: string;
  url: string;
}

interface AutocompleteSuggestion {
  query: string;
  count: number;
}

type FilterType = "all" | "users" | "listings" | "fragrances";

const STORAGE_KEY = "scentswap_recent_searches";
const MAX_RECENT_SEARCHES = 5;

const POPULAR_SUGGESTIONS = [
  { title: "Dior Sauvage", type: "fragrance" as const, url: "/discover?search=Dior%20Sauvage" },
  { title: "Bleu de Chanel", type: "fragrance" as const, url: "/discover?search=Bleu%20de%20Chanel" },
  { title: "Aventus", type: "fragrance" as const, url: "/discover?search=Aventus" },
  { title: "Tom Ford", type: "fragrance" as const, url: "/discover?search=Tom%20Ford" },
  { title: "Le Labo", type: "fragrance" as const, url: "/discover?search=Le%20Labo" },
];

// Check if browser supports speech recognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const NavigationSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const debouncedQuery = useDebounce(query, 300);
  const autocompleteDebounce = useDebounce(query, 150);
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Fetch autocomplete suggestions based on popular searches
  useEffect(() => {
    const fetchAutocompleteSuggestions = async () => {
      if (autocompleteDebounce.trim().length < 2) {
        setAutocompleteSuggestions([]);
        return;
      }

      try {
        // Use RPC or direct query with aggregation
        const { data, error } = await supabase
          .from("search_analytics")
          .select("query")
          .ilike("query", `${autocompleteDebounce.toLowerCase()}%`)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        // Aggregate queries client-side
        const queryCount = new Map<string, number>();
        data?.forEach((item) => {
          const q = item.query.toLowerCase();
          queryCount.set(q, (queryCount.get(q) || 0) + 1);
        });

        const suggestions = Array.from(queryCount.entries())
          .map(([query, count]) => ({ query, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setAutocompleteSuggestions(suggestions);
      } catch (error) {
        console.error("Failed to fetch autocomplete:", error);
      }
    };

    fetchAutocompleteSuggestions();
  }, [autocompleteDebounce]);

  // Initialize speech recognition
  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setQuery(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast.error("Microphone access denied. Please enable it in your browser settings.");
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const toggleVoiceSearch = () => {
    if (!SpeechRecognition) {
      toast.error("Voice search is not supported in your browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (error) {
        console.error("Failed to start voice recognition:", error);
        toast.error("Failed to start voice recognition.");
      }
    }
  };

  const saveRecentSearch = (result: SearchResult) => {
    const updated = [
      result,
      ...recentSearches.filter((r) => r.id !== result.id),
    ].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const removeRecentSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((r) => r.id !== id);
    setRecentSearches(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Track search analytics
  const trackSearch = async (searchQuery: string, filterType: FilterType, resultsCount: number) => {
    try {
      await supabase.from("search_analytics").insert({
        query: searchQuery.toLowerCase().trim(),
        filter_type: filterType,
        results_count: resultsCount,
        profile_id: profile?.id || null,
      });
    } catch (error) {
      console.error("Failed to track search:", error);
    }
  };

  const searchAll = useCallback(async (searchQuery: string, activeFilter: FilterType) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Search users
      if (activeFilter === "all" || activeFilter === "users") {
        const { data: users } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .limit(activeFilter === "users" ? 10 : 5);

        if (users) {
          searchResults.push(
            ...users.map((user) => ({
              id: user.id,
              type: "user" as const,
              title: user.display_name || user.username,
              subtitle: `@${user.username}`,
              url: `/profile/${user.username}`,
            }))
          );
        }
      }

      // Search listings
      if (activeFilter === "all" || activeFilter === "listings") {
        const { data: listings } = await supabase
          .from("listings")
          .select("id, name, brand")
          .or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
          .eq("is_active", true)
          .limit(activeFilter === "listings" ? 10 : 5);

        if (listings) {
          searchResults.push(
            ...listings.map((listing) => ({
              id: listing.id,
              type: "listing" as const,
              title: listing.name,
              subtitle: listing.brand,
              url: `/trade/${listing.id}`,
            }))
          );
        }
      }

      // Search collection items (fragrances)
      if (activeFilter === "all" || activeFilter === "fragrances") {
        const { data: fragrances } = await supabase
          .from("collection_items")
          .select("id, name, brand")
          .or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
          .limit(activeFilter === "fragrances" ? 15 : 5);

        if (fragrances) {
          const uniqueFragrances = fragrances.reduce((acc, item) => {
            const key = `${item.name}-${item.brand}`;
            if (!acc.has(key)) {
              acc.set(key, item);
            }
            return acc;
          }, new Map());

          searchResults.push(
            ...Array.from(uniqueFragrances.values()).slice(0, activeFilter === "fragrances" ? 10 : 5).map((item: any) => ({
              id: item.id,
              type: "fragrance" as const,
              title: item.name,
              subtitle: item.brand,
              url: `/discover?search=${encodeURIComponent(item.name)}`,
            }))
          );
        }
      }

      setResults(searchResults);
      
      // Track this search
      if (searchQuery.trim().length >= 2) {
        trackSearch(searchQuery, activeFilter, searchResults.length);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    searchAll(debouncedQuery, filter);
  }, [debouncedQuery, filter, searchAll]);

  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(result);
    setOpen(false);
    setQuery("");
    setFilter("all");
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    navigate(result.url);
  };

  const handlePopularSelect = (suggestion: typeof POPULAR_SUGGESTIONS[0]) => {
    setOpen(false);
    setQuery("");
    setFilter("all");
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    navigate(suggestion.url);
  };

  const handleAutocompleteSelect = (suggestion: string) => {
    setQuery(suggestion);
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "user":
        return <User className="w-4 h-4 text-muted-foreground" />;
      case "listing":
        return <Package className="w-4 h-4 text-muted-foreground" />;
      case "fragrance":
        return <Sparkles className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const groupedResults = {
    users: results.filter((r) => r.type === "user"),
    listings: results.filter((r) => r.type === "listing"),
    fragrances: results.filter((r) => r.type === "fragrance"),
  };

  const hasResults = results.length > 0;
  const hasQuery = query.trim().length > 0;
  const showSuggestions = !hasQuery && !isLoading;
  const showAutocomplete = hasQuery && autocompleteSuggestions.length > 0 && !hasResults && !isLoading;

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 lg:w-64 lg:justify-start lg:px-3 lg:py-2 rounded-lg"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 lg:mr-2" />
        <span className="hidden lg:inline-flex text-muted-foreground text-sm">
          Search...
        </span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            placeholder="Search fragrances, users, listings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          {SpeechRecognition && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 shrink-0 ${isListening ? "text-destructive animate-pulse" : "text-muted-foreground"}`}
              onClick={toggleVoiceSearch}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
        </div>
        
        {/* Voice listening indicator */}
        {isListening && (
          <div className="px-3 py-2 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            Listening... Speak now
          </div>
        )}
        
        {/* Filter Tabs */}
        <div className="px-3 py-2 border-b">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList className="h-8 w-full grid grid-cols-4 bg-muted/50">
              <TabsTrigger value="all" className="text-xs h-7 data-[state=active]:bg-background">
                All
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs h-7 data-[state=active]:bg-background">
                <User className="w-3 h-3 mr-1" />
                Users
              </TabsTrigger>
              <TabsTrigger value="listings" className="text-xs h-7 data-[state=active]:bg-background">
                <Package className="w-3 h-3 mr-1" />
                Listings
              </TabsTrigger>
              <TabsTrigger value="fragrances" className="text-xs h-7 data-[state=active]:bg-background">
                <Sparkles className="w-3 h-3 mr-1" />
                Fragrances
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <CommandList className="max-h-[400px]">
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : (
            <>
              {/* Autocomplete suggestions while typing */}
              {showAutocomplete && (
                <CommandGroup heading={
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" />
                    Popular Searches
                  </span>
                }>
                  {autocompleteSuggestions.map((suggestion, index) => (
                    <CommandItem
                      key={`autocomplete-${index}`}
                      value={`autocomplete-${suggestion.query}`}
                      onSelect={() => handleAutocompleteSelect(suggestion.query)}
                      className="cursor-pointer"
                    >
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <span className="ml-2 text-sm">{suggestion.query}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {suggestion.count} searches
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {hasQuery && !hasResults && !showAutocomplete && (
                <CommandEmpty>No results found for "{query}"</CommandEmpty>
              )}

              {/* Suggestions when no query */}
              {showSuggestions && (
                <>
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <CommandGroup heading={
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          Recent Searches
                        </span>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                    }>
                      {recentSearches.map((result) => (
                        <CommandItem
                          key={`recent-${result.id}`}
                          value={`recent-${result.title}`}
                          onSelect={() => handleSelect(result)}
                          className="cursor-pointer group"
                        >
                          {getIcon(result.type)}
                          <div className="ml-2 flex-1">
                            <p className="text-sm font-medium">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                            )}
                          </div>
                          <button
                            onClick={(e) => removeRecentSearch(result.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
                          >
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {recentSearches.length > 0 && <CommandSeparator />}

                  {/* Popular Suggestions */}
                  <CommandGroup heading={
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3" />
                      Popular Searches
                    </span>
                  }>
                    {POPULAR_SUGGESTIONS.map((suggestion, index) => (
                      <CommandItem
                        key={`popular-${index}`}
                        value={`popular-${suggestion.title}`}
                        onSelect={() => handlePopularSelect(suggestion)}
                        className="cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                        <span className="ml-2 text-sm">{suggestion.title}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Search Results */}
              {hasQuery && hasResults && (
                <>
                  {(filter === "all" || filter === "users") && groupedResults.users.length > 0 && (
                    <CommandGroup heading="Users">
                      {groupedResults.users.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.title}
                          onSelect={() => handleSelect(result)}
                          className="cursor-pointer"
                        >
                          {getIcon(result.type)}
                          <div className="ml-2">
                            <p className="text-sm font-medium">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {(filter === "all" || filter === "listings") && groupedResults.listings.length > 0 && (
                    <CommandGroup heading="Listings">
                      {groupedResults.listings.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.title}
                          onSelect={() => handleSelect(result)}
                          className="cursor-pointer"
                        >
                          {getIcon(result.type)}
                          <div className="ml-2">
                            <p className="text-sm font-medium">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {(filter === "all" || filter === "fragrances") && groupedResults.fragrances.length > 0 && (
                    <CommandGroup heading="Fragrances">
                      {groupedResults.fragrances.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.title}
                          onSelect={() => handleSelect(result)}
                          className="cursor-pointer"
                        >
                          {getIcon(result.type)}
                          <div className="ml-2">
                            <p className="text-sm font-medium">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};
