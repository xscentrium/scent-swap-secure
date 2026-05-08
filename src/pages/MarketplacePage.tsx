import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Star, Shield, Search, ArrowUpDown, Loader2, X, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FavoriteButton } from '@/components/FavoriteButton';
import { cn } from '@/lib/utils';

type Listing = {
  id: string;
  name: string;
  brand: string;
  size: string;
  condition: string;
  estimated_value: number | null;
  price: number | null;
  listing_type: string;
  image_url: string | null;
  owner_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
};

const MarketplacePage = () => {
  const [search, setSearch] = useState('');
  const [listingTypeFilter, setListingTypeFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: listings, isLoading } = useQuery({
    queryKey: ['listings', search, listingTypeFilter, conditionFilter, sortBy, priceRange],
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_owner_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('is_active', true);

      if (search) {
        query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`);
      }

      if (listingTypeFilter !== 'all') {
        query = query.eq('listing_type', listingTypeFilter as 'sale' | 'trade' | 'both');
      }

      if (conditionFilter !== 'all') {
        query = query.eq('condition', conditionFilter as 'new' | 'excellent' | 'good' | 'fair');
      }

      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'price_low') {
        query = query.order('price', { ascending: true, nullsFirst: false });
      } else if (sortBy === 'price_high') {
        query = query.order('price', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Listing[];
    },
  });

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'excellent': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'good': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'fair': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold mb-2">Marketplace</h1>
            <p className="text-muted-foreground">Browse fragrances available for trade or purchase</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={listingTypeFilter} onValueChange={setListingTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sale">For Sale</SelectItem>
                  <SelectItem value="trade">For Trade</SelectItem>
                  <SelectItem value="both">Sale & Trade</SelectItem>
                </SelectContent>
              </Select>

              <Select value={conditionFilter} onValueChange={setConditionFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Listings Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <Card key={listing.id} className="group overflow-hidden hover:shadow-luxury transition-all duration-300 border-border/50">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {listing.image_url ? (
                      <img
                        src={listing.image_url}
                        alt={listing.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <FavoriteButton
                        name={listing.name}
                        brand={listing.brand}
                        imageUrl={listing.image_url || undefined}
                        className="bg-background/80 hover:bg-background"
                      />
                    </div>
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      {listing.listing_type === 'trade' && (
                        <Badge className="bg-accent text-accent-foreground">Trade Only</Badge>
                      )}
                      {listing.listing_type === 'sale' && (
                        <Badge className="bg-primary text-primary-foreground">For Sale</Badge>
                      )}
                      {listing.listing_type === 'both' && (
                        <Badge className="gradient-primary text-primary-foreground border-0">Sale/Trade</Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">{listing.name}</h3>
                        <p className="text-sm text-muted-foreground">{listing.brand}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className={getConditionColor(listing.condition)}>
                        {listing.condition}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{listing.size}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      {listing.price && (
                        <span className="text-xl font-bold text-primary">${listing.price}</span>
                      )}
                      {listing.estimated_value && !listing.price && (
                        <span className="text-sm text-muted-foreground">
                          Est. ${listing.estimated_value}
                        </span>
                      )}
                      {listing.profiles && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Shield className="w-3 h-3" />
                          <span>@{listing.profiles.username}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 gap-2">
                    {listing.listing_type !== 'trade' && (
                      <Button size="sm" className="flex-1">
                        Buy Now
                      </Button>
                    )}
                    {listing.listing_type !== 'sale' && (
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link to={`/trade/${listing.id}`}>Propose Trade</Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No listings found</p>
              <Button asChild>
                <Link to="/create-listing">Create the first listing</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MarketplacePage;
