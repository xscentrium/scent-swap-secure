import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Package, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchResult {
  id: string;
  type: "user" | "listing" | "fragrance";
  title: string;
  subtitle?: string;
  url: string;
}

export const NavigationSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

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

  const searchAll = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Search users
      const { data: users } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(5);

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

      // Search listings
      const { data: listings } = await supabase
        .from("listings")
        .select("id, name, brand")
        .or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
        .eq("is_active", true)
        .limit(5);

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

      // Search collection items (fragrances)
      const { data: fragrances } = await supabase
        .from("collection_items")
        .select("id, name, brand")
        .or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
        .limit(5);

      if (fragrances) {
        const uniqueFragrances = fragrances.reduce((acc, item) => {
          const key = `${item.name}-${item.brand}`;
          if (!acc.has(key)) {
            acc.set(key, item);
          }
          return acc;
        }, new Map());

        searchResults.push(
          ...Array.from(uniqueFragrances.values()).slice(0, 5).map((item: any) => ({
            id: item.id,
            type: "fragrance" as const,
            title: item.name,
            subtitle: item.brand,
            url: `/discover?search=${encodeURIComponent(item.name)}`,
          }))
        );
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    searchAll(debouncedQuery);
  }, [debouncedQuery, searchAll]);

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery("");
    navigate(url);
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
        <CommandInput
          placeholder="Search fragrances, users, listings..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : (
            <>
              <CommandEmpty>No results found.</CommandEmpty>

              {groupedResults.users.length > 0 && (
                <CommandGroup heading="Users">
                  {groupedResults.users.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.title}
                      onSelect={() => handleSelect(result.url)}
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

              {groupedResults.listings.length > 0 && (
                <CommandGroup heading="Listings">
                  {groupedResults.listings.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.title}
                      onSelect={() => handleSelect(result.url)}
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

              {groupedResults.fragrances.length > 0 && (
                <CommandGroup heading="Fragrances">
                  {groupedResults.fragrances.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.title}
                      onSelect={() => handleSelect(result.url)}
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
        </CommandList>
      </CommandDialog>
    </>
  );
};
