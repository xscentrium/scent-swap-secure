import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ArrowRight, Shield, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

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
    id: string;
    username: string;
    user_id: string;
  } | null;
};

const Trade = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, loading: authLoading } = useAuth();
  const [selectedMyListing, setSelectedMyListing] = useState<string>('');

  // Fetch the target listing
  const { data: targetListing, isLoading: targetLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_owner_id_fkey (
            id,
            username,
            user_id
          )
        `)
        .eq('id', listingId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Listing | null;
    },
    enabled: !!listingId,
  });

  // Fetch current user's listings for trade
  const { data: myListings } = useQuery({
    queryKey: ['my-listings', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_owner_id_fkey (
            id,
            username,
            user_id
          )
        `)
        .eq('owner_id', profile!.id)
        .eq('is_active', true)
        .in('listing_type', ['trade', 'both']);
      
      if (error) throw error;
      return data as Listing[];
    },
    enabled: !!profile?.id,
  });

  // Create trade mutation
  const createTrade = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !targetListing?.profiles?.id || !selectedMyListing) {
        throw new Error('Missing required data');
      }

      const myListing = myListings?.find(l => l.id === selectedMyListing);
      if (!myListing) throw new Error('Selected listing not found');

      // Calculate escrow amounts (50% of estimated value)
      const escrowInitiator = (myListing.estimated_value ?? 0) * 0.5;
      const escrowReceiver = (targetListing.estimated_value ?? 0) * 0.5;

      const { data, error } = await supabase
        .from('trades')
        .insert({
          initiator_id: profile.id,
          receiver_id: targetListing.profiles!.id,
          initiator_listing_id: selectedMyListing,
          receiver_listing_id: targetListing.id,
          escrow_amount_initiator: escrowInitiator,
          escrow_amount_receiver: escrowReceiver,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Trade proposal sent!');
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      navigate('/my-trades');
    },
    onError: (error) => {
      toast.error('Failed to create trade proposal');
    },
  });

  const selectedMyListingData = myListings?.find(l => l.id === selectedMyListing);

  if (authLoading || targetLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center pt-32">
          <h1 className="text-2xl font-serif font-bold mb-2">Sign in Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to propose a trade.</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!targetListing) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center pt-32">
          <h1 className="text-2xl font-serif font-bold mb-2">Listing Not Found</h1>
          <p className="text-muted-foreground mb-4">This listing doesn't exist or is no longer available.</p>
          <Button asChild>
            <Link to="/marketplace">Browse Marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if user owns this listing
  if (targetListing.profiles?.user_id === user.id) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center pt-32">
          <h1 className="text-2xl font-serif font-bold mb-2">Can't Trade With Yourself</h1>
          <p className="text-muted-foreground mb-4">You can't propose a trade for your own listing.</p>
          <Button asChild>
            <Link to="/marketplace">Browse Marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/marketplace">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
          </Button>

          <h1 className="text-3xl font-serif font-bold mb-6">Propose a Trade</h1>

          {/* Escrow Info */}
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <Shield className="w-4 h-4 text-primary" />
            <AlertDescription>
              <strong>How escrow works:</strong> Both parties hold 50% of their fragrance's estimated value 
              as security. Once both confirm the trade is complete, the escrow is released.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Your Offering */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Your Offer</CardTitle>
                <CardDescription>Select what you'll trade</CardDescription>
              </CardHeader>
              <CardContent>
                {myListings && myListings.length > 0 ? (
                  <>
                    <Select value={selectedMyListing} onValueChange={setSelectedMyListing}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your fragrance" />
                      </SelectTrigger>
                      <SelectContent>
                        {myListings.map((listing) => (
                          <SelectItem key={listing.id} value={listing.id}>
                            {listing.name} ({listing.brand})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedMyListingData && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="font-medium">{selectedMyListingData.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedMyListingData.brand}</p>
                        <p className="text-sm text-muted-foreground">{selectedMyListingData.size} • {selectedMyListingData.condition}</p>
                        {selectedMyListingData.estimated_value && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <p className="text-sm">Est. Value: <span className="font-medium">${selectedMyListingData.estimated_value}</span></p>
                            <p className="text-xs text-muted-foreground">
                              Escrow: ${(selectedMyListingData.estimated_value * 0.5).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-3">No listings available for trade</p>
                    <Button size="sm" asChild>
                      <Link to="/create-listing">Create Listing</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <div className="hidden md:flex w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
                <ArrowRight className="w-6 h-6 text-primary" />
              </div>
            </div>

            {/* What You'll Get */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">You'll Receive</CardTitle>
                <CardDescription>From @{targetListing.profiles?.username}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-4">
                  {targetListing.image_url ? (
                    <img
                      src={targetListing.image_url}
                      alt={targetListing.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                <p className="font-medium">{targetListing.name}</p>
                <p className="text-sm text-muted-foreground">{targetListing.brand}</p>
                <p className="text-sm text-muted-foreground">{targetListing.size} • {targetListing.condition}</p>
                {targetListing.estimated_value && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-sm">Est. Value: <span className="font-medium">${targetListing.estimated_value}</span></p>
                    <p className="text-xs text-muted-foreground">
                      Their Escrow: ${(targetListing.estimated_value * 0.5).toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trade Summary */}
          {selectedMyListingData && (
            <Card className="mt-6 border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Trade Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Your Escrow Hold</p>
                    <p className="text-xl font-bold text-primary">
                      ${((selectedMyListingData.estimated_value ?? 0) * 0.5).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Their Escrow Hold</p>
                    <p className="text-xl font-bold text-primary">
                      ${((targetListing.estimated_value ?? 0) * 0.5).toFixed(2)}
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full mt-6" 
                  size="lg"
                  onClick={() => createTrade.mutate()}
                  disabled={createTrade.isPending || !selectedMyListing}
                >
                  {createTrade.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Proposal...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Send Trade Proposal
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Trade;
