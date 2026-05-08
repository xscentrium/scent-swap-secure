import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Star } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ListingImage, isListingDisplayable } from "@/components/ListingImage";

export const Marketplace = () => {
  const navigate = useNavigate();

  const { data: listings, isLoading } = useQuery({
    queryKey: ["marketplace-section-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`*, owner:profiles!owner_id(username, id_verified), image_verification:listing_image_verifications(status, reason, source)`)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []).filter(isListingDisplayable).slice(0, 4);
    },
  });

  return (
    <section id="marketplace" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12 animate-in fade-in duration-700">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Available for Trade
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse verified listings from collectors worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? [...Array(4)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </Card>
              ))
            : listings?.map((listing: any, index) => (
                <Card
                  key={listing.id}
                  className="overflow-hidden hover:shadow-luxury transition-smooth group animate-in fade-in duration-700 cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => navigate(`/marketplace?listing=${listing.id}`)}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <ListingImage
                      url={listing.image_url}
                      alt={`${listing.brand} ${listing.name}`}
                      className="group-hover:scale-110 transition-transform duration-500"
                    />
                    <div
                      className="absolute top-3 left-3"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                      <h3 className="font-semibold text-lg line-clamp-1">{listing.name}</h3>
                      <p className="text-sm text-muted-foreground">{listing.brand}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {listing.size} • {listing.condition}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="font-medium">5.0</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between mb-3">
                        {listing.listing_type === "sale" ? (
                          <>
                            <span className="text-sm text-muted-foreground">Price</span>
                            <span className="font-semibold text-lg">${listing.price}</span>
                          </>
                        ) : listing.listing_type === "trade" ? (
                          <>
                            <span className="text-sm text-muted-foreground">Est. Value</span>
                            <span className="font-semibold text-lg">
                              ${listing.estimated_value}
                            </span>
                          </>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">
                              Price: ${listing.price}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              Trade Value: ${listing.estimated_value}
                            </span>
                          </div>
                        )}
                      </div>
                      {listing.listing_type === "sale" ? (
                        <Button className="w-full">Buy Now</Button>
                      ) : listing.listing_type === "trade" ? (
                        <Button className="w-full">Propose Trade</Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button className="flex-1">Buy</Button>
                          <Button className="flex-1" variant="outline">
                            Trade
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
        </div>
      </div>
    </section>
  );
};
