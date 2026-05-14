import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { FavoriteButton } from '@/components/FavoriteButton';
import { 
  ShieldCheck, 
  Star, 
  Clock, 
  Wind,
  Sun,
  Moon,
  Snowflake,
  Leaf,
  Flower2,
  ShoppingCart,
  ArrowLeftRight,
  User,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BatchCodeStatus } from '@/components/BatchCodeStatus';
import { ListingEscrowTimeline } from '@/components/ListingEscrowTimeline';
import { ListingImage, verificationLabel, type DBVerification } from '@/components/ListingImage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BadgeCheck, ImageOff } from 'lucide-react';

type FragranceDetails = {
  name: string;
  brand: string;
  concentration?: string;
  releaseYear?: number;
  perfumer?: string;
  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];
  mainAccords?: string[];
  longevity?: string;
  sillage?: string;
  seasonRating?: { spring: number; summer: number; fall: number; winter: number };
  dayNightRating?: { day: number; night: number };
  averageRating?: number;
  description?: string;
};

interface Listing {
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
  owner?: {
    username: string;
    id_verified: boolean;
  };
  image_verification?: DBVerification | DBVerification[];
}

interface ListingQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing | null;
}

export const ListingQuickView = ({
  open,
  onOpenChange,
  listing,
}: ListingQuickViewProps) => {
  const navigate = useNavigate();

  const { data: details, isLoading } = useQuery({
    queryKey: ['fragrance-details', listing?.name, listing?.brand],
    queryFn: async () => {
      if (!listing) return null;
      const { data, error } = await supabase.functions.invoke('fragrance-details', {
        body: { name: listing.name, brand: listing.brand },
      });
      
      if (error) throw error;
      return data?.details as FragranceDetails | null;
    },
    enabled: open && !!listing?.name && !!listing?.brand,
    staleTime: 1000 * 60 * 30,
  });

  if (!listing) return null;

  const SeasonIcon = ({ season }: { season: string }) => {
    switch (season) {
      case 'spring': return <Flower2 className="w-4 h-4" />;
      case 'summer': return <Sun className="w-4 h-4" />;
      case 'fall': return <Leaf className="w-4 h-4" />;
      case 'winter': return <Snowflake className="w-4 h-4" />;
      default: return null;
    }
  };

  const renderRatingBar = (value: number, max: number = 5) => (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-3 rounded-sm ${i < value ? 'bg-primary' : 'bg-muted'}`}
        />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left - Image */}
          <div className="relative aspect-square md:aspect-auto bg-muted">
            <ListingImage
              url={listing.image_url}
              alt={listing.name}
              verification={Array.isArray(listing.image_verification) ? listing.image_verification[0] : listing.image_verification}
            />
            <div className="absolute top-4 left-4">
              <FavoriteButton
                name={listing.name}
                brand={listing.brand}
                imageUrl={listing.image_url || undefined}
                className="bg-background/90 hover:bg-background"
              />
            </div>
            {listing.owner?.id_verified && (
              <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground border-0">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Verified Seller
              </Badge>
            )}
          </div>

          {/* Right - Details */}
          <div className="p-6 space-y-4">
            <DialogHeader className="p-0">
              <DialogTitle className="font-serif text-2xl">{listing.name}</DialogTitle>
              <p className="text-lg text-muted-foreground">{listing.brand}</p>
            </DialogHeader>

            {/* Listing Info */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{listing.size}</Badge>
              <Badge variant="outline" className="capitalize">{listing.condition.replace('_', ' ')}</Badge>
              <Badge variant="outline">
                {listing.listing_type === 'sale' ? 'For Sale' : listing.listing_type === 'trade' ? 'For Trade' : 'Sale or Trade'}
              </Badge>
            </div>

            {/* Photo verification status */}
            {(() => {
              const dbV = Array.isArray(listing.image_verification) ? listing.image_verification[0] : listing.image_verification;
              const v = verificationLabel(listing.image_url, dbV);
              if (v.tone === 'ok') return null;
              const Icon = v.tone === 'muted' ? ImageOff : AlertTriangle;
              return (
                <Alert variant={v.tone === 'bad' ? 'destructive' : 'default'}>
                  <Icon className="h-4 w-4" />
                  <AlertTitle>{v.label}</AlertTitle>
                  <AlertDescription className="text-xs">
                    {dbV?.reason || 'This listing\'s image is awaiting verification by our team.'}
                    <br />
                    <span className="text-muted-foreground">Estimated verification: within 24 hours of upload.</span>
                  </AlertDescription>
                </Alert>
              );
            })()}

            {/* Price */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {listing.price ? 'Price' : 'Estimated Value'}
                </span>
                <span className="text-3xl font-bold">
                  ${listing.price || listing.estimated_value}
                </span>
              </div>
            </div>

            {/* Seller */}
            {listing.owner && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">@{listing.owner.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {listing.owner.id_verified ? 'Verified Seller' : 'Seller'}
                  </p>
                </div>
              </div>
            )}

            <BatchCodeStatus listingId={listing.id} />

            <ListingEscrowTimeline listingId={listing.id} />

            <Separator />

            {/* Note Pyramid */}
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </div>
            ) : details ? (
              <div className="space-y-4">
                {/* Notes Pyramid Visual */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                    Note Pyramid
                  </h4>
                  <div className="space-y-3">
                    {/* Top Notes */}
                    {details.topNotes && details.topNotes.length > 0 && (
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-primary/60" />
                          <span className="text-xs font-medium text-muted-foreground">TOP</span>
                        </div>
                        <div className="ml-4 pl-4 border-l-2 border-primary/20">
                          <div className="flex flex-wrap gap-1">
                            {details.topNotes.slice(0, 5).map((note) => (
                              <Badge 
                                key={note} 
                                variant="secondary" 
                                className="text-xs capitalize bg-primary/10 hover:bg-primary/20"
                              >
                                {note}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Heart Notes */}
                    {details.heartNotes && details.heartNotes.length > 0 && (
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-accent/60" />
                          <span className="text-xs font-medium text-muted-foreground">HEART</span>
                        </div>
                        <div className="ml-4 pl-4 border-l-2 border-accent/20">
                          <div className="flex flex-wrap gap-1">
                            {details.heartNotes.slice(0, 5).map((note) => (
                              <Badge 
                                key={note} 
                                variant="secondary" 
                                className="text-xs capitalize bg-accent/10 hover:bg-accent/20"
                              >
                                {note}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Base Notes */}
                    {details.baseNotes && details.baseNotes.length > 0 && (
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-secondary/60" />
                          <span className="text-xs font-medium text-muted-foreground">BASE</span>
                        </div>
                        <div className="ml-4 pl-4 border-l-2 border-secondary/20">
                          <div className="flex flex-wrap gap-1">
                            {details.baseNotes.slice(0, 5).map((note) => (
                              <Badge 
                                key={note} 
                                variant="secondary" 
                                className="text-xs capitalize bg-secondary/50 hover:bg-secondary/70"
                              >
                                {note}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance & Season */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {details.longevity && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Longevity:</span>
                      <span className="font-medium">{details.longevity}</span>
                    </div>
                  )}
                  {details.sillage && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wind className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Sillage:</span>
                      <span className="font-medium">{details.sillage}</span>
                    </div>
                  )}
                </div>

                {/* Season Rating */}
                {details.seasonRating && (
                  <div className="flex items-center justify-between pt-2">
                    {Object.entries(details.seasonRating).map(([season, rating]) => (
                      <div key={season} className="flex flex-col items-center gap-1">
                        <SeasonIcon season={season} />
                        <span className="text-[10px] uppercase text-muted-foreground">{season}</span>
                        {renderRatingBar(rating)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <Separator />

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="secondary"
                className="sm:col-span-2"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/listing/${listing.id}`);
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Full page
              </Button>
              {listing.listing_type !== 'trade' && listing.price && (
                <Button 
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/marketplace?listing=${listing.id}`);
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Now
                </Button>
              )}
              {listing.listing_type !== 'sale' && (
                <Button 
                  variant={listing.listing_type === 'trade' ? 'default' : 'outline'}
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/marketplace?listing=${listing.id}`);
                  }}
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Propose Trade
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
