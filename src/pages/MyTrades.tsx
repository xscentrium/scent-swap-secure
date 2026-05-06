import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeftRight, Clock, CheckCircle, XCircle, Shield, Loader2, AlertCircle, Package, AlertTriangle, History, X, FileText, ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { DisputeEvidenceList } from '@/components/DisputeEvidenceList';
import { DisputeEvidenceLog } from '@/components/DisputeEvidenceLog';

type Trade = {
  id: string;
  status: string;
  escrow_amount_initiator: number | null;
  escrow_amount_receiver: number | null;
  locked_initiator_value: number | null;
  locked_receiver_value: number | null;
  escrow_status: string | null;
  dispute_reason: string | null;
  dispute_evidence_urls: string[] | null;
  disputed_at: string | null;
  disputed_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  released_at: string | null;
  refunded_at: string | null;
  initiator_confirmed: boolean;
  receiver_confirmed: boolean;
  created_at: string;
  updated_at: string;
  initiator_listing: { id: string; name: string; brand: string; size: string; image_url: string | null; } | null;
  receiver_listing: { id: string; name: string; brand: string; size: string; image_url: string | null; } | null;
  initiator: { id: string; username: string } | null;
  receiver: { id: string; username: string } | null;
};

type ConfirmAction =
  | { kind: 'cancel'; trade: Trade }
  | { kind: 'refund'; trade: Trade };

const MyTrades = () => {
  const { user, profile, loading } = useAuth();
  const queryClient = useQueryClient();
  const [disputeTrade, setDisputeTrade] = useState<Trade | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeFiles, setDisputeFiles] = useState<File[]>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [timelineTrade, setTimelineTrade] = useState<Trade | null>(null);
  const [evidenceErrors, setEvidenceErrors] = useState<string[]>([]);
  const [disputeReviewing, setDisputeReviewing] = useState(false);

  const escrowBadge = (status: string | null) => {
    switch (status) {
      case 'held':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20"><Shield className="w-3 h-3 mr-1" />Held</Badge>;
      case 'released':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Released</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="bg-muted text-muted-foreground"><XCircle className="w-3 h-3 mr-1" />Refunded</Badge>;
      case 'disputed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><AlertTriangle className="w-3 h-3 mr-1" />Disputed</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const renderEscrowPanel = (trade: Trade) => {
    const isInit = trade.initiator?.id === profile?.id;
    const yourHold = isInit ? trade.escrow_amount_initiator : trade.escrow_amount_receiver;
    const theirHold = isInit ? trade.escrow_amount_receiver : trade.escrow_amount_initiator;
    const yourLocked = isInit ? trade.locked_initiator_value : trade.locked_receiver_value;
    const theirLocked = isInit ? trade.locked_receiver_value : trade.locked_initiator_value;
    return (
      <div className="rounded-lg border border-border/60 bg-gradient-to-br from-muted/40 to-muted/10 p-3">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium">Escrow</span>
            {escrowBadge(trade.escrow_status)}
          </div>
          <button
            onClick={() => setTimelineTrade(trade)}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <History className="w-3 h-3" /> Timeline
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
          <div className="flex justify-between sm:block bg-background/40 sm:bg-transparent rounded-md sm:rounded-none px-2 py-1.5 sm:p-0">
            <p className="text-xs text-muted-foreground">Your hold</p>
            <div className="text-right sm:text-left">
              <p className="font-semibold tabular-nums">${yourHold?.toFixed(2) ?? '0.00'}</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">of ${yourLocked?.toFixed(2) ?? '0.00'}</p>
            </div>
          </div>
          <div className="flex justify-between sm:block bg-background/40 sm:bg-transparent rounded-md sm:rounded-none px-2 py-1.5 sm:p-0">
            <p className="text-xs text-muted-foreground">Their hold</p>
            <div className="text-right sm:text-left">
              <p className="font-semibold tabular-nums">${theirHold?.toFixed(2) ?? '0.00'}</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">of ${theirLocked?.toFixed(2) ?? '0.00'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
      return data as unknown as Trade[];
    },
    enabled: !!profile?.id,
  });

  const updateTrade = useMutation({
    mutationFn: async ({ tradeId, status, confirm, disputeReason, evidenceUrls }: { tradeId: string; status?: string; confirm?: boolean; disputeReason?: string; evidenceUrls?: string[] }) => {
      const trade = trades?.find(t => t.id === tradeId);
      if (!trade) throw new Error('Trade not found');

      const updates: Database['public']['Tables']['trades']['Update'] = {};

      if (status) {
        // Client-side guardrails — server enforces these too
        const valid: Record<string, string[]> = {
          pending: ['accepted', 'cancelled'],
          accepted: ['completed', 'disputed'],
          disputed: [],
          completed: [],
          cancelled: [],
        };
        if (!valid[trade.status]?.includes(status)) {
          throw new Error(`Cannot move trade from ${trade.status} to ${status}`);
        }

        updates.status = status as Database['public']['Enums']['trade_status'];
        if (status === 'accepted') updates.escrow_status = 'held';
        if (status === 'completed') {
          updates.escrow_status = 'released';
          updates.released_at = new Date().toISOString();
        }
        if (status === 'cancelled') {
          if (trade.status !== 'pending') {
            throw new Error('Only pending proposals can be cancelled');
          }
          updates.escrow_status = 'refunded';
          updates.refunded_at = new Date().toISOString();
        }
        if (status === 'disputed') {
          updates.escrow_status = 'disputed';
          updates.disputed_at = new Date().toISOString();
          if (disputeReason) updates.dispute_reason = disputeReason;
          if (evidenceUrls && evidenceUrls.length) updates.dispute_evidence_urls = evidenceUrls;
        }
      }

      if (confirm !== undefined) {
        if (trade.status !== 'accepted') {
          throw new Error('Can only confirm shipping on accepted trades');
        }
        const isInitiator = trade.initiator?.id === profile?.id;
        if (isInitiator) {
          updates.initiator_confirmed = confirm;
        } else {
          updates.receiver_confirmed = confirm;
        }
        const otherConfirmed = isInitiator ? trade.receiver_confirmed : trade.initiator_confirmed;
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
    onError: (e: Error) => {
      toast.error(e.message || 'Failed to update trade');
    },
  });

  // User-triggered escrow refund for refund-eligible trades (cancelled with stale escrow)
  const refundEscrow = useMutation({
    mutationFn: async (tradeId: string) => {
      const trade = trades?.find(t => t.id === tradeId);
      if (!trade) throw new Error('Trade not found');
      if (trade.status !== 'cancelled') {
        throw new Error('Only cancelled trades can be refunded');
      }
      if (trade.escrow_status === 'refunded') {
        throw new Error('Escrow already refunded');
      }
      const { error } = await supabase
        .from('trades')
        .update({ escrow_status: 'refunded', refunded_at: new Date().toISOString() })
        .eq('id', tradeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trades'] });
      toast.success('Escrow refunded to both parties');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to refund escrow'),
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
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-serif font-bold">My Trades</h1>
              <p className="text-sm text-muted-foreground mt-1">Track active proposals, escrow holds, and trade history.</p>
            </div>
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
                        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg overflow-hidden">
                                {trade.initiator_listing?.image_url ? (
                                  <img src={trade.initiator_listing.image_url} alt="" className="w-full h-full object-cover" />
                                ) : null}
                              </div>
                              <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg overflow-hidden">
                                {trade.receiver_listing?.image_url ? (
                                  <img src={trade.receiver_listing.image_url} alt="" className="w-full h-full object-cover" />
                                ) : null}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {trade.initiator_listing?.name} ↔ {trade.receiver_listing?.name}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                With @{trade.initiator?.id === profile.id ? trade.receiver?.username : trade.initiator?.username}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(trade.status)}
                        </div>

                        <div className="mt-3">
                          {renderEscrowPanel(trade)}
                        </div>

                        {trade.status === 'accepted' && (
                          <div className="flex items-start justify-between gap-3 pt-3 mt-3 border-t border-border flex-wrap">
                            <p className="text-sm text-muted-foreground">
                              {trade.initiator_confirmed && trade.receiver_confirmed
                                ? 'Both parties shipped — finalizing...'
                                : 'Waiting for both parties to confirm shipping...'}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => { setDisputeTrade(trade); setDisputeReason(''); }}
                              >
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Dispute
                              </Button>
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

                        {trade.status === 'pending' && trade.initiator?.id === profile.id && (
                          <div className="flex justify-end pt-3 mt-3 border-t border-border">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmAction({ kind: 'cancel', trade })}
                            >
                              Cancel Proposal
                            </Button>
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
                      <Card key={trade.id} className="border-border/50 hover:border-primary/40 transition-colors">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="flex items-center gap-2 shrink-0">
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
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {trade.initiator_listing?.name} ↔ {trade.receiver_listing?.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(trade.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(trade.status)}
                          </div>

                          {renderEscrowPanel(trade)}

                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {trade.status === 'cancelled' && trade.escrow_status !== 'refunded' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirmAction({ kind: 'refund', trade })}
                              >
                                <Shield className="w-4 h-4 mr-1" />
                                Refund Escrow
                              </Button>
                            )}
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

      <Dialog open={!!disputeTrade} onOpenChange={(open) => { if (!open) { setDisputeTrade(null); setDisputeReviewing(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {disputeReviewing ? 'Review & Confirm Dispute' : 'Open a Dispute'}
            </DialogTitle>
            <DialogDescription>
              {disputeReviewing
                ? 'Double-check your reason and attached evidence below. Once submitted, the trade will be frozen until support resolves it.'
                : 'This will mark the trade as disputed and freeze both escrow holds until resolved by support. Please describe the issue clearly.'}
            </DialogDescription>
          </DialogHeader>
          {disputeReviewing ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Reason</p>
                <p className="text-sm whitespace-pre-wrap">{disputeReason.trim()}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Evidence ({disputeFiles.length})
                </p>
                {disputeFiles.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No files attached.</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {disputeFiles.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2">
                        <span className="truncate">{f.name}</span>
                        <span className="text-muted-foreground shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
          <>
          <div className="space-y-2">
            <Label htmlFor="dispute-reason">Reason</Label>
            <Textarea
              id="dispute-reason"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="e.g. Item not received, wrong fragrance shipped, condition mismatch..."
              rows={5}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">{disputeReason.length}/1000</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dispute-evidence">Evidence (photos or PDF, optional)</Label>
            <input
              id="dispute-evidence"
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/heic,application/pdf"
              aria-invalid={evidenceErrors.length > 0}
              aria-describedby="dispute-evidence-help dispute-evidence-errors"
              onChange={(e) => {
                const incoming = Array.from(e.target.files ?? []);
                e.target.value = '';
                const allowedMimes = ['image/png','image/jpeg','image/jpg','image/webp','image/heic','image/heif','application/pdf'];
                const allowedExt = /\.(png|jpe?g|webp|heic|heif|pdf)$/i;
                const MAX_SIZE = 10 * 1024 * 1024;
                const MAX_COUNT = 5;
                const errs: string[] = [];
                const accepted: File[] = [];
                for (const f of incoming) {
                  const okType = (f.type && allowedMimes.includes(f.type.toLowerCase())) || allowedExt.test(f.name);
                  if (!okType) {
                    errs.push(`${f.name}: unsupported type. Use JPG, PNG, WEBP, HEIC, or PDF.`);
                    continue;
                  }
                  if (f.size > MAX_SIZE) {
                    errs.push(`${f.name}: ${(f.size / 1024 / 1024).toFixed(1)} MB exceeds the 10 MB limit.`);
                    continue;
                  }
                  accepted.push(f);
                }
                setDisputeFiles((prev) => {
                  const merged = [...prev];
                  for (const f of accepted) {
                    if (merged.length >= MAX_COUNT) {
                      errs.push(`You can attach at most ${MAX_COUNT} files. "${f.name}" was skipped.`);
                      continue;
                    }
                    if (merged.some(p => p.name === f.name && p.size === f.size)) {
                      errs.push(`${f.name}: already added.`);
                      continue;
                    }
                    merged.push(f);
                  }
                  return merged;
                });
                setEvidenceErrors(errs);
              }}
              className={`block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:bg-muted file:text-foreground hover:file:bg-muted/80 ${
                evidenceErrors.length > 0 ? 'file:border-destructive' : 'file:border-border'
              }`}
            />
            {disputeFiles.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                {disputeFiles.map((f, i) => {
                  const isImage = f.type.startsWith('image/');
                  const url = isImage ? URL.createObjectURL(f) : null;
                  return (
                    <div key={`${f.name}-${i}`} className="relative group rounded-md border border-border/60 bg-muted/40 overflow-hidden">
                      {isImage && url ? (
                        <img src={url} alt={f.name} className="w-full h-20 object-cover" onLoad={() => URL.revokeObjectURL(url)} />
                      ) : (
                        <div className="w-full h-20 flex items-center justify-center text-muted-foreground">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="px-1.5 py-1 border-t border-border/40">
                        <p className="text-[10px] truncate" title={f.name}>{f.name}</p>
                        <p className="text-[10px] text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDisputeFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-background/80 border border-border opacity-0 group-hover:opacity-100 transition hover:bg-destructive hover:text-destructive-foreground"
                        aria-label={`Remove ${f.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <p id="dispute-evidence-help" className="text-xs text-muted-foreground">
              JPG, PNG, WEBP, HEIC, or PDF — up to 5 files, max 10 MB each. {disputeFiles.length}/5 attached.
            </p>
            {evidenceErrors.length > 0 && (
              <div
                id="dispute-evidence-errors"
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/5 p-2"
              >
                <ul className="space-y-0.5 text-xs text-destructive">
                  {evidenceErrors.map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          </>
          )}
          <DialogFooter>
            {disputeReviewing ? (
              <>
                <Button
                  variant="outline"
                  disabled={updateTrade.isPending || uploadingEvidence}
                  onClick={() => setDisputeReviewing(false)}
                >
                  Back to edit
                </Button>
                <Button
                  variant="destructive"
                  disabled={updateTrade.isPending || uploadingEvidence}
                  onClick={async () => {
                    if (!disputeTrade || !user) return;
                    setEvidenceErrors([]);
                    let urls: string[] = [];
                    if (disputeFiles.length > 0) {
                      setUploadingEvidence(true);
                      const errs: string[] = [];
                      try {
                        for (const file of disputeFiles) {
                          const ext = file.name.split('.').pop() ?? 'bin';
                          const path = `${user.id}/${disputeTrade.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
                          const { error: upErr } = await supabase.storage
                            .from('dispute-evidence')
                            .upload(path, file, { contentType: file.type || undefined });
                          if (upErr) {
                            const raw = upErr.message || '';
                            let friendly = `${file.name}: ${raw}`;
                            if (/Unsupported file type|allowed/i.test(raw)) friendly = `${file.name}: file type rejected by server. Use JPG, PNG, WEBP, HEIC, or PDF.`;
                            else if (/exceeds 10 MB|too large/i.test(raw)) friendly = `${file.name}: server rejected file — over 10 MB.`;
                            else if (/Maximum of 5/i.test(raw)) friendly = `Server limit reached: max 5 evidence files per trade.`;
                            else if (/own folder|participant/i.test(raw)) friendly = `${file.name}: not allowed for this trade.`;
                            errs.push(friendly);
                          } else {
                            urls.push(path);
                          }
                        }
                      } finally {
                        setUploadingEvidence(false);
                      }
                      if (errs.length) {
                        setEvidenceErrors(errs);
                        setDisputeReviewing(false);
                        if (urls.length === 0) return;
                      }
                    }
                    updateTrade.mutate(
                      { tradeId: disputeTrade.id, status: 'disputed', disputeReason: disputeReason.trim(), evidenceUrls: urls },
                      { onSuccess: () => { setDisputeTrade(null); setDisputeFiles([]); setDisputeReason(''); setEvidenceErrors([]); setDisputeReviewing(false); } }
                    );
                  }}
                >
                  {uploadingEvidence ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</> : 'Confirm & Submit'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setDisputeTrade(null); setDisputeFiles([]); setDisputeReason(''); setEvidenceErrors([]); setDisputeReviewing(false); }}>Cancel</Button>
                <Button
                  variant="destructive"
                  disabled={disputeReason.trim().length < 10 || evidenceErrors.length > 0}
                  onClick={() => setDisputeReviewing(true)}
                >
                  Review &amp; Continue
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.kind === 'cancel' ? 'Cancel this trade proposal?' : 'Refund escrow to both parties?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.kind === 'cancel'
                ? 'This will cancel the proposal and immediately refund both escrow holds. This action cannot be undone.'
                : 'This will release both escrow holds back to the original owners. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep trade</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.kind === 'cancel') {
                  updateTrade.mutate(
                    { tradeId: confirmAction.trade.id, status: 'cancelled' },
                    { onSuccess: () => setConfirmAction(null) }
                  );
                } else {
                  refundEscrow.mutate(confirmAction.trade.id, {
                    onSuccess: () => setConfirmAction(null),
                  });
                }
              }}
            >
              {confirmAction?.kind === 'cancel' ? 'Cancel trade' : 'Refund escrow'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!timelineTrade} onOpenChange={(o) => !o && setTimelineTrade(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Trade Timeline
            </DialogTitle>
            <DialogDescription>Audit log of status and escrow changes.</DialogDescription>
          </DialogHeader>
          {timelineTrade && (() => {
            const t = timelineTrade;
            const initName = t.initiator?.username ? `@${t.initiator.username}` : 'initiator';
            const recvName = t.receiver?.username ? `@${t.receiver.username}` : 'receiver';
            const disputerName = t.disputed_by === t.initiator?.id ? initName
              : t.disputed_by === t.receiver?.id ? recvName : 'a party';
            const events: Array<{ at: string; label: string; icon: typeof Clock; tone: string }> = [];
            events.push({ at: t.created_at, label: `Trade proposed by ${initName} → ${recvName}`, icon: ArrowLeftRight, tone: 'text-muted-foreground' });
            if (t.disputed_at) events.push({ at: t.disputed_at, label: `Dispute opened by ${disputerName}`, icon: AlertTriangle, tone: 'text-destructive' });
            if (t.resolved_at) events.push({ at: t.resolved_at, label: `Resolved by admin → ${t.status}`, icon: Shield, tone: 'text-primary' });
            if (t.released_at) events.push({ at: t.released_at, label: 'Escrow released', icon: CheckCircle, tone: 'text-green-600' });
            if (t.refunded_at) events.push({ at: t.refunded_at, label: 'Escrow refunded', icon: XCircle, tone: 'text-muted-foreground' });
            events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
            return (
              <div className="space-y-4">
                <ol className="space-y-3 max-h-72 overflow-auto pr-1">
                  {events.map((e, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className={`mt-0.5 ${e.tone}`}><e.icon className="w-4 h-4" /></span>
                      <div className="flex-1">
                        <p className="text-sm">{e.label}</p>
                        <p className="text-xs text-muted-foreground">{new Date(e.at).toLocaleString()}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                {t.dispute_reason && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Dispute reason</p>
                    <p className="text-sm whitespace-pre-wrap">{t.dispute_reason}</p>
                  </div>
                )}
                <DisputeEvidenceList
                  paths={t.dispute_evidence_urls}
                  tradeId={t.id}
                  allowRemove
                  onRemoved={() => {
                    queryClient.invalidateQueries({ queryKey: ['my-trades'] });
                    setEvidenceLogKey((k) => k + 1);
                  }}
                />
                <DisputeEvidenceLog tradeId={t.id} refreshKey={evidenceLogKey} />
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyTrades;
