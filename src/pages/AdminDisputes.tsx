import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, Shield, AlertTriangle, CheckCircle, XCircle, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DisputeEvidenceList } from '@/components/DisputeEvidenceList';
import { DisputeEvidenceLog } from '@/components/DisputeEvidenceLog';

type DisputedTrade = {
  id: string;
  status: string;
  escrow_status: string | null;
  dispute_reason: string | null;
  dispute_evidence_urls: string[] | null;
  disputed_at: string | null;
  locked_initiator_value: number | null;
  locked_receiver_value: number | null;
  escrow_amount_initiator: number | null;
  escrow_amount_receiver: number | null;
  initiator: { id: string; username: string } | null;
  receiver: { id: string; username: string } | null;
  initiator_listing: { name: string; brand: string; image_url: string | null } | null;
  receiver_listing: { name: string; brand: string; image_url: string | null } | null;
};

const AdminDisputes = () => {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{ trade: DisputedTrade; action: 'release' | 'refund' } | null>(null);

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      return !!data;
    },
    enabled: !!user?.id,
  });

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select(`
          id, status, escrow_status, dispute_reason, dispute_evidence_urls, disputed_at,
          locked_initiator_value, locked_receiver_value,
          escrow_amount_initiator, escrow_amount_receiver,
          initiator:profiles!trades_initiator_id_fkey ( id, username ),
          receiver:profiles!trades_receiver_id_fkey ( id, username ),
          initiator_listing:listings!trades_initiator_listing_id_fkey ( name, brand, image_url ),
          receiver_listing:listings!trades_receiver_listing_id_fkey ( name, brand, image_url )
        `)
        .eq('status', 'disputed')
        .order('disputed_at', { ascending: false });
      if (error) throw error;
      return data as unknown as DisputedTrade[];
    },
    enabled: isAdmin === true,
  });

  const resolve = useMutation({
    mutationFn: async ({ tradeId, action }: { tradeId: string; action: 'release' | 'refund' }) => {
      const newStatus = action === 'release' ? 'completed' : 'cancelled';
      const { error } = await supabase
        .from('trades')
        .update({ status: newStatus as 'completed' | 'cancelled' })
        .eq('id', tradeId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.action === 'release' ? 'Escrow released' : 'Escrow refunded');
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      setConfirmAction(null);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to resolve dispute'),
  });

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center pt-32">
          <Shield className="w-12 h-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-serif font-bold mb-2">Access Denied</h1>
          <Button asChild><Link to="/">Go Home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/admin/verification">
              <ArrowLeft className="w-4 h-4 mr-2" /> Admin
            </Link>
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <h1 className="text-3xl font-serif font-bold">Dispute Resolution</h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Review disputed trades and decide whether to release escrow to the seller or refund both parties.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : disputes && disputes.length > 0 ? (
            <div className="space-y-4">
              {disputes.map((t) => (
                <Card key={t.id} className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                          {t.initiator_listing?.image_url && <img src={t.initiator_listing.image_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <ArrowLeftRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                          {t.receiver_listing?.image_url && <img src={t.receiver_listing.image_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {t.initiator_listing?.brand} {t.initiator_listing?.name}
                            <span className="text-muted-foreground"> ↔ </span>
                            {t.receiver_listing?.brand} {t.receiver_listing?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{t.initiator?.username} ↔ @{t.receiver?.username}
                          </p>
                          {t.disputed_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Disputed {format(new Date(t.disputed_at), 'PPp')}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 shrink-0">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Disputed
                      </Badge>
                    </div>

                    {t.dispute_reason && (
                      <div className="rounded-lg border border-border/60 bg-card p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Reason</p>
                        <p className="text-sm whitespace-pre-wrap">{t.dispute_reason}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-border/60 bg-card p-3">
                        <p className="text-xs text-muted-foreground">Initiator hold</p>
                        <p className="font-semibold">${t.escrow_amount_initiator?.toFixed(2) ?? '0.00'}</p>
                        <p className="text-xs text-muted-foreground">Locked: ${t.locked_initiator_value?.toFixed(2) ?? '0.00'}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-card p-3">
                        <p className="text-xs text-muted-foreground">Receiver hold</p>
                        <p className="font-semibold">${t.escrow_amount_receiver?.toFixed(2) ?? '0.00'}</p>
                        <p className="text-xs text-muted-foreground">Locked: ${t.locked_receiver_value?.toFixed(2) ?? '0.00'}</p>
                      </div>
                    </div>

                    <DisputeEvidenceList paths={t.dispute_evidence_urls} />
                    <DisputeEvidenceLog tradeId={t.id} />
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setConfirmAction({ trade: t, action: 'refund' })}
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Refund Both
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setConfirmAction({ trade: t, action: 'release' })}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Release Escrow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg">No active disputes</h3>
                <p className="text-muted-foreground">All trades are running smoothly.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === 'release'
                ? 'Release escrow to seller?'
                : 'Refund both parties?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'release'
                ? 'This will mark the trade as completed and release the escrow holds. This action is permanent and cannot be undone.'
                : 'This will mark the trade as cancelled and refund both escrow holds. This action is permanent and cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.action === 'refund'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''}
              disabled={resolve.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (confirmAction) {
                  resolve.mutate({ tradeId: confirmAction.trade.id, action: confirmAction.action });
                }
              }}
            >
              {resolve.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {confirmAction?.action === 'release' ? 'Release escrow' : 'Refund both'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDisputes;
