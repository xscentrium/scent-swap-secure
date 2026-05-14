import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ShieldCheck, Star } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ListingImage, isListingDisplayable } from "@/components/ListingImage";
import { ListingQuickView } from "@/components/ListingQuickView";
import { cn } from "@/lib/utils";

type ListingType = "all" | "sale" | "trade" | "both";
type Sort = "newest" | "price_low" | "price_high";

const TYPE_CHIPS: { value: ListingType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sale", label: "For sale" },
  { value: "trade", label: "Trade only" },
  { value: "both", label: "Sale + trade" },
];

export const Marketplace = () => {
  const navigate = useNavigate();
  const [type, setType] = useState<ListingType>("all");
  const [brand, setBrand] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [quickViewListing, setQuickViewListing] = useState<any>(null);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["marketplace-section-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(
          `*, owner:profiles!owner_id(username, id_verified), image_verification:listing_image_verifications(status, reason, source)`
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return ((data as any[]) ?? []).filter(isListingDisplayable);
    },
  });

  const allBrands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of listings ?? []) counts.set(l.brand, (counts.get(l.brand) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [listings]);

  const topBrandChips = allBrands.slice(0, 6).map((b) => b[0]);

  const filtered = useMemo(() => {
    let arr = (listings ?? []).slice();
    if (type !== "all") arr = arr.filter((l) => l.listing_type === type);
    if (brand !== "all") arr = arr.filter((l) => l.brand === brand);
    if (sort === "price_low") {
      arr.sort((a, b) => (Number(a.price ?? a.estimated_value ?? 0)) - Number(b.price ?? b.estimated_value ?? 0));
    } else if (sort === "price_high") {
      arr.sort((a, b) => Number(b.price ?? b.estimated_value ?? 0) - Number(a.price ?? a.estimated_value ?? 0));
    }
    return arr.slice(0, 8);
  }, [listings, type, brand, sort]);

  const goToFullMarketplace = () => {
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (brand !== "all") params.set("brand", brand);
    if (sort !== "newest") params.set("sort", sort);
    navigate(`/marketplace${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section id="marketplace" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-10 animate-in fade-in duration-700">
          <p className="text-[10px] tracking-[0.28em] uppercase text-primary mb-3 font-medium">
            Available now
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-medium mb-3 tracking-tight">
            Browse the marketplace
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto font-light">
            Verified bottles from collectors worldwide — buy outright or propose a trade.
          </p>
        </div>

        {/* Filter bar */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {TYPE_CHIPS.map((c) => {
              const active = type === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setType(c.value)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs tracking-wide border transition-all",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-transparent border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {c.label}
                </button>
              );
            })}
            {topBrandChips.length > 0 && (
              <span className="hidden md:inline-block w-px bg-border/60 mx-1 self-stretch" />
            )}
            {topBrandChips.map((b) => {
              const active = brand === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBrand(active ? "all" : b)}
                  className={cn(
                    "hidden md:inline-flex px-3 py-1.5 rounded-full text-xs border transition-all",
                    active
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-transparent border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {b}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="w-[160px] md:hidden">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All brands</SelectItem>
                {allBrands.map(([b, n]) => (
                  <SelectItem key={b} value={b}>
                    {b} ({n})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_low">Price: low → high</SelectItem>
                <SelectItem value="price_high">Price: high → low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? [...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </Card>
              ))
            : filtered.length === 0
              ? (
                <div className="col-span-full text-center py-16 border border-dashed border-border/60 rounded-lg">
                  <p className="text-sm text-muted-foreground">No listings match those filters.</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setType("all");
                      setBrand("all");
                      setSort("newest");
                    }}
                    className="text-primary"
                  >
                    Clear filters
                  </Button>
                </div>
              )
              : filtered.map((listing: any, index) => (
                  <Card
                    key={listing.id}
                    className="overflow-hidden hover:shadow-luxury transition-smooth group animate-in fade-in duration-500 cursor-pointer"
                    style={{ animationDelay: `${index * 60}ms` }}
                    onClick={() => setQuickViewListing(listing)}
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <ListingImage
                        url={listing.image_url}
                        alt={`${listing.brand} ${listing.name}`}
                        verification={
                          Array.isArray(listing.image_verification)
                            ? listing.image_verification[0]
                            : listing.image_verification
                        }
                        className="group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3" onClick={(e) => e.stopPropagation()}>
                        <FavoriteButton
                          name={listing.name}
                          brand={listing.brand}
                          imageUrl={listing.image_url}
                          className="bg-background/80 hover:bg-background"
                        />
                      </div>
                      {listing.owner?.id_verified && (
                        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground border-0">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-base line-clamp-1">{listing.name}</h3>
                        <p className="text-xs text-muted-foreground">{listing.brand}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {listing.size} • {listing.condition}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                          <span className="font-medium">5.0</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                          {listing.listing_type === "sale" ? (
                            <>
                              <span className="text-xs text-muted-foreground">Price</span>
                              <span className="font-semibold text-lg">${listing.price}</span>
                            </>
                          ) : listing.listing_type === "trade" ? (
                            <>
                              <span className="text-xs text-muted-foreground">Est. value</span>
                              <span className="font-semibold text-lg">${listing.estimated_value}</span>
                            </>
                          ) : (
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">${listing.price} sale</span>
                              <span className="text-xs text-muted-foreground">
                                ${listing.estimated_value} trade
                              </span>
                            </div>
                          )}
                        </div>
                        {listing.listing_type === "sale" ? (
                          <Button className="w-full" size="sm">Buy Now</Button>
                        ) : listing.listing_type === "trade" ? (
                          <Button className="w-full" size="sm">Propose Trade</Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button className="flex-1" size="sm">Buy</Button>
                            <Button className="flex-1" size="sm" variant="outline">
                              Trade
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            size="lg"
            variant="outline"
            onClick={goToFullMarketplace}
            className="rounded-full px-8 group"
          >
            View all {(listings ?? []).length} listings
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>

      <ListingQuickView
        open={!!quickViewListing}
        onOpenChange={(open) => { if (!open) setQuickViewListing(null); }}
        listing={quickViewListing}
      />
    </section>
  );
};
