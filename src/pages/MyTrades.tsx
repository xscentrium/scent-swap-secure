import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeftRight, Clock, CheckCircle, XCircle, Shield, Loader2, AlertCircle, Package, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

type Trade = {
  id: string;
  status: string;
  escrow_amount_initiator: number | null;
  escrow_amount_receiver: number | null;
  locked_initiator_value: number | null;
  locked_receiver_value: number | null;
  escrow_status: string | null;
  dispute_reason: string | null;
  disputed_at: string | null;
  released_at: string | null;
  refunded_at: string | null;
  initiator_confirmed: boolean;
  receiver_confirmed: boolean;
  created_at: string;
  initiator_listing: {
    id: string;
    name: string;
    brand: string;
    size: string;
    image_url: string | null;
  } | null;
  receiver_listing: {
    id: string;
    name: string;
    brand: string;
    size: string;
    image_url: string | null;
  } | null;
  initiator: {
    id: string;
    username: string;
  } | null;
  receiver: {
    id: string;
    username: string;
  } | null;
};

const MyTrades = () => {
  const { user, profile, loading } = useAuth();
  const queryClient = useQueryClient();

  const { data: trades, isLoading } = useQuery({
    queryKey: ['my-trades', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select(`
          *,
          initiator_listing:listings!trades_initiator_listing_id_fkey (
            id, name, brand, size, image_url
          ),
          receiver_listing:listings!trades_receiver_listing_id_fkey (
            id, name, brand, size, image_url
          ),
          initiator:profiles!trades_initiator_id_fkey (
            id, username
          ),
          receiver:profiles!trades_receiver_id_fkey (
            id, username
          )
        `)
        .or(`initiator_id.eq.${profile!.id},receiver_id.eq.${profile!.id}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Trade[];
    },
    enabled: !!profile?.id,
  });

  const updateTrade = useMutation({
    mutationFn: async ({ tradeId, status, confirm, disputeReason }: { tradeId: string; status?: string; confirm?: boolean; disputeReason?: string }) => {
      const trade = trades?.find(t => t.id === tradeId);
      const updates: Database['public']['Tables']['trades']['Update'] = {};
      if (status) {
        updates.status = status as Database['public']['Enums']['trade_status'];
        // Escrow lifecycle transitions
        if (status === 'accepted') updates.escrow_status = 'held';
        if (status === 'completed') {
          updates.escrow_status = 'released';
          updates.released_at = new Date().toISOString();
        }
        if (status === 'cancelled') {
          updates.escrow_status = 'refunded';
          updates.refunded_at = new Date().toISOString();
        }
        if (status === 'disputed') {
          updates.escrow_status = 'disputed';
          updates.disputed_at = new Date().toISOString();
          if (disputeReason) updates.dispute_reason = disputeReason;
        }
      }
      if (confirm !== undefined) {
        const isInitiator = trade?.initiator?.id === profile?.id;
        if (isInitiator) {
          updates.initiator_confirmed = confirm;
        } else {
          updates.receiver_confirmed = confirm;
        }
        // Auto-complete + release escrow when both sides have confirmed
        const otherConfirmed = isInitiator ? trade?.receiver_confirmed : trade?.initiator_confirmed;
        if (confirm && otherConfirmed) {
          updates.status = 'completed' as Database['public']['Enums']['trade_status'];
          updates.escrow_status = 'released';
          updates.released_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('trades')
        .update(updates)
        .eq('id', tradeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trades'] });
      toast.success('Trade updated');
    },
    onError: () => {
      toast.error('Failed to update trade');
    },
  });

  const importToCollection = useMutation({
    mutationFn: async (listing: { name: string; brand: string; size: string; image_url: string | null }) => {
      const { error } = await supabase
        .from('collection_items')
        .insert({
          profile_id: profile!.id,
          name: listing.name,
          brand: listing.brand,
          size: listing.size,
          image_url: listing.image_url,
          notes: 'Acquired through trade',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      toast.success('Added to your collection!');
    },
    onError: () => {
      toast.error('Failed to add to collection');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case 'escrow_held':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20"><Shield className="w-3 h-3 mr-1" />Escrow Held</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-muted text-muted-foreground"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case 'disputed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><AlertCircle className="w-3 h-3 mr-1" />Disputed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get listing I received in trade (from the other party)
  const getReceivedListing = (trade: Trade) => {
    if (trade.initiator?.id === profile?.id) {
      return trade.receiver_listing;
    } else {
      return trade.initiator_listing;
    }
  };

  if (loading) {
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
          <p className="text-muted-foreground mb-4">Please sign in to view your trades.</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const pendingTrades = trades?.filter(t => t.status === 'pending' || t.status === 'accepted' || t.status === 'escrow_held') ?? [];
  const completedTrades = trades?.filter(t => t.status === 'completed' || t.status === 'cancelled' || t.status === 'disputed') ?? [];
  const incomingTrades = pendingTrades.filter(t => t.receiver?.id === profile.id && t.status === 'pending');
  const outgoingTrades = pendingTrades.filter(t => t.initiator?.id === profile.id && t.status === 'pending');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-serif font-bold">My Trades</h1>
            <Button variant="outline" asChild>
              <Link to="/trade-matches">
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Trade Matches
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="active">
            <TabsList className="mb-6">
              <TabsTrigger value="active">Active ({pendingTrades.length})</TabsTrigger>
              <TabsTrigger value="history">History ({completedTrades.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : pendingTrades.length > 0 ? (
                <div className="space-y-4">
                  {/* Incoming Proposals */}
                  {incomingTrades.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-lg font-semibold mb-3">Incoming Proposals</h2>
                      {incomingTrades.map((trade) => (
                        <Card key={trade.id} className="mb-4 border-primary/20">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                                    {trade.initiator_listing?.image_url ? (
                                      <img src={trade.initiator_listing.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : null}
                                  </div>
                                  <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                                  <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                                    {trade.receiver_listing?.image_url ? (
                                      <img src={trade.receiver_listing.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : null}
                                  </div>
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {trade.initiator_listing?.name} ↔ {trade.receiver_listing?.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    From @{trade.initiator?.username}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateTrade.mutate({ tradeId: trade.id, status: 'cancelled' })}
                                >
                                  Decline
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => updateTrade.mutate({ tradeId: trade.id, status: 'accepted' })}
                                >
                                  Accept
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* All Active Trades */}
                  {pendingTrades.filter(t => t.status !== 'pending' || t.initiator?.id === profile.id).map((trade) => (
                    <Card key={trade.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                                {trade.initiator_listing?.image_url ? (
                                  <img src={trade.initiator_listing.image_url} alt="" className="w-full h-full object-cover" />
                                ) : null}
                              </div>
                              <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                              <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                                {trade.receiver_listing?.image_url ? (
                                  <img src={trade.receiver_listing.image_url} alt="" className="w-full h-full object-cover" />
                                ) : null}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium">
                                {trade.initiator_listing?.name} ↔ {trade.receiver_listing?.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                With @{trade.initiator?.id === profile.id ? trade.receiver?.username : trade.initiator?.username}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(trade.status)}
                        </div>

                        {trade.status === 'accepted' && (
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                              Waiting for both parties to confirm shipping...
                            </p>
                            <div className="flex gap-2">
                              {((trade.initiator?.id === profile.id && !trade.initiator_confirmed) ||
                                (trade.receiver?.id === profile.id && !trade.receiver_confirmed)) && (
                                <Button 
                                  size="sm"
                                  onClick={() => updateTrade.mutate({ tradeId: trade.id, confirm: true })}
                                >
                                  I Shipped My Item
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active trades</p>
                  <Button className="mt-4" asChild>
                    <Link to="/marketplace">Browse Marketplace</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {completedTrades.length > 0 ? (
                <div className="space-y-4">
                  {completedTrades.map((trade) => {
                    const receivedListing = getReceivedListing(trade);
                    return (
                      <Card key={trade.id} className="border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-muted rounded-lg overflow-hidden">
                                  {trade.initiator_listing?.image_url ? (
                                    <img src={trade.initiator_listing.image_url} alt="" className="w-full h-full object-cover" />
                                  ) : null}
                                </div>
                                <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                                <div className="w-10 h-10 bg-muted rounded-lg overflow-hidden">
                                  {trade.receiver_listing?.image_url ? (
                                    <img src={trade.receiver_listing.image_url} alt="" className="w-full h-full object-cover" />
                                  ) : null}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium">
                                  {trade.initiator_listing?.name} ↔ {trade.receiver_listing?.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(trade.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {trade.status === 'completed' && receivedListing && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => importToCollection.mutate({
                                    name: receivedListing.name,
                                    brand: receivedListing.brand,
                                    size: receivedListing.size,
                                    image_url: receivedListing.image_url,
                                  })}
                                  disabled={importToCollection.isPending}
                                >
                                  <Package className="w-4 h-4 mr-1" />
                                  Add to Collection
                                </Button>
                              )}
                              {getStatusBadge(trade.status)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No trade history yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default MyTrades;
