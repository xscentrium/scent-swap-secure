import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowLeftRight, ShoppingCart, ShieldCheck, User } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingImage, type DBVerification } from "@/components/ListingImage";
import { FavoriteButton } from "@/components/FavoriteButton";
import { BatchCodeStatus } from "@/components/BatchCodeStatus";
import { ListingEscrowTimeline } from "@/components/ListingEscrowTimeline";
import { FragranceDetailsModal } from "@/components/FragranceDetailsModal";
import { useState } from "react";

type ListingDetailRow = {
  id: string;
  name: string;
  brand: string;
  size: string;
  condition: string;
  listing_type: string;
  price: number | null;
  estimated_value: number | null;
  image_url: string | null;
  description: string | null;
  profiles: { username: string; avatar_url: string | null; id_verified?: boolean | null } | null;
  image_verification?: DBVerification | DBVerification[];
};

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          profiles!listings_owner_id_fkey (username, avatar_url, id_verified),
          image_verification:listing_image_verifications(status, reason, source)
        `)
        .eq("id", id)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data as ListingDetailRow;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="container max-w-6xl pt-24 pb-12"><Skeleton className="h-[520px] w-full" /></div>;
  }

  if (!listing) {
    return <div className="container max-w-3xl pt-24 pb-12 text-muted-foreground">Listing not found.</div>;
  }

  const value = listing.price || listing.estimated_value;

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${listing.brand} ${listing.name} Listing | Xscentrium`} description={`View the full listing for ${listing.brand} ${listing.name}.`} path={`/listing/${listing.id}`} image={listing.image_url || undefined} />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-6xl space-y-6">
          <Button variant="ghost" asChild>
            <Link to="/marketplace"><ArrowLeft className="w-4 h-4 mr-2" /> Marketplace</Link>
          </Button>

          <div className="grid lg:grid-cols-[minmax(320px,520px)_1fr] gap-8 items-start">
            <Card className="overflow-hidden p-0">
              <div className="relative aspect-square bg-muted">
                <ListingImage url={listing.image_url} alt={`${listing.brand} ${listing.name}`} verification={Array.isArray(listing.image_verification) ? listing.image_verification[0] : listing.image_verification} />
                <div className="absolute top-4 left-4">
                  <FavoriteButton name={listing.name} brand={listing.brand} imageUrl={listing.image_url || undefined} className="bg-background/90" />
                </div>
              </div>
            </Card>

            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">{listing.brand}</p>
                <h1 className="mt-2 text-4xl md:text-6xl font-serif leading-tight">{listing.name}</h1>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{listing.size}</Badge>
                <Badge variant="outline" className="capitalize">{listing.condition.replace("_", " ")}</Badge>
                <Badge variant="outline">{listing.listing_type === "sale" ? "For Sale" : listing.listing_type === "trade" ? "For Trade" : "Sale or Trade"}</Badge>
                {listing.profiles?.id_verified && <Badge><ShieldCheck className="w-3 h-3 mr-1" /> Verified Seller</Badge>}
              </div>

              <Card className="p-5 bg-muted/40">
                <p className="text-sm text-muted-foreground">{listing.price ? "Price" : "Estimated Value"}</p>
                <p className="text-4xl font-bold mt-1">${value}</p>
              </Card>

              {listing.description && <p className="text-foreground/80 leading-relaxed">{listing.description}</p>}

              {listing.profiles && (
                <Card className="p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="font-medium">@{listing.profiles.username}</p>
                    <p className="text-xs text-muted-foreground">{listing.profiles.id_verified ? "Verified Seller" : "Seller"}</p>
                  </div>
                </Card>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                {listing.listing_type !== "trade" && listing.price && <Button size="lg"><ShoppingCart className="w-4 h-4 mr-2" /> Buy Now</Button>}
                {listing.listing_type !== "sale" && <Button size="lg" variant={listing.listing_type === "trade" ? "default" : "outline"} asChild><Link to={`/trade/${listing.id}`}><ArrowLeftRight className="w-4 h-4 mr-2" /> Propose Trade</Link></Button>}
                <Button size="lg" variant="secondary" className="sm:col-span-2" onClick={() => setDetailsOpen(true)}>View fragrance details</Button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <BatchCodeStatus listingId={listing.id} />
            <ListingEscrowTimeline listingId={listing.id} />
          </div>
        </div>
      </main>

      <FragranceDetailsModal open={detailsOpen} onOpenChange={setDetailsOpen} name={listing.name} brand={listing.brand} imageUrl={listing.image_url} />
    </div>
  );
}