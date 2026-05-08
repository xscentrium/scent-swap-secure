import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ShieldCheck, Star, Sparkles, Eye } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ListingImage, isListingDisplayable } from "@/components/ListingImage";
import { useNavigate } from "react-router-dom";
import { ListingQuickView } from "@/components/ListingQuickView";

export const FeaturedListings = () => {
  const navigate = useNavigate();
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const { data: listings, isLoading } = useQuery({
    queryKey: ['featured-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          owner:profiles!owner_id(username, id_verified),
          image_verification:listing_image_verifications(status, reason, source)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(24);
      
      if (error) throw error;
      return ((data as any[]) ?? []).filter(isListingDisplayable).slice(0, 8);
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-serif font-bold">Featured Fragrances</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!listings?.length) return null;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold">Featured Fragrances</h2>
              <p className="text-muted-foreground">Premium scents from verified collectors</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/marketplace')}>
            View All
          </Button>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {listings.map((listing) => (
              <CarouselItem key={listing.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <Card 
                  className="overflow-hidden hover:shadow-luxury transition-smooth group h-full cursor-pointer"
                  onClick={() => {
                    setSelectedListing(listing);
                    setQuickViewOpen(true);
                  }}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <ListingImage
                      url={listing.image_url}
                      alt={`${listing.brand} ${listing.name}`}
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
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-center justify-between">
                      <Badge variant="secondary" className="bg-background/90">
                        {listing.listing_type === 'sale' ? 'For Sale' : listing.listing_type === 'trade' ? 'For Trade' : 'Sale or Trade'}
                      </Badge>
                      <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-4 h-4 mr-1" />
                        Quick View
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{listing.name}</h3>
                      <p className="text-sm text-muted-foreground">{listing.brand}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{listing.size} • {listing.condition}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="font-medium">5.0</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between mb-3">
                        {listing.price ? (
                          <>
                            <span className="text-sm text-muted-foreground">Price</span>
                            <span className="font-semibold text-lg">${listing.price}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm text-muted-foreground">Est. Value</span>
                            <span className="font-semibold text-lg">${listing.estimated_value}</span>
                          </>
                        )}
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/marketplace?listing=${listing.id}`);
                        }}
                      >
                        {listing.listing_type === 'sale' ? 'Buy Now' : listing.listing_type === 'trade' ? 'Propose Trade' : 'View Details'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4" />
          <CarouselNext className="hidden md:flex -right-4" />
        </Carousel>

        <ListingQuickView
          open={quickViewOpen}
          onOpenChange={setQuickViewOpen}
          listing={selectedListing}
        />
      </div>
    </section>
  );
};
