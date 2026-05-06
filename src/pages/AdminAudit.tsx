import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Shield, FileSearch } from 'lucide-react';
import { EscrowEventsList } from '@/components/EscrowEventsList';
import { DisputeEvidenceLog } from '@/components/DisputeEvidenceLog';
import { format } from 'date-fns';

const AdminAudit = () => {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const [search, setSearch] = useState(params.tradeId ?? '');
  const [tradeId, setTradeId] = useState(params.tradeId ?? '');

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      return !!data;
    },
    enabled: !!user?.id,
  });

  const { data: trade } = useQuery({
    queryKey: ['audit-trade', tradeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select(`
          id, status, escrow_status, created_at, disputed_at, released_at, refunded_at,
          initiator_received, receiver_received,
          locked_initiator_value, locked_receiver_value,
          escrow_amount_initiator, escrow_amount_receiver,
          initiator:profiles!trades_initiator_id_fkey(id, username),
          receiver:profiles!trades_receiver_id_fkey(id, username),
          initiator_listing:listings!trades_initiator_listing_id_fkey(id, name, brand),
          receiver_listing:listings!trades_receiver_listing_id_fkey(id, name, brand)
        `)
        .eq('id', tradeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!tradeId && isAdmin === true,
  });

  const { data: batchCodes } = useQuery({
    queryKey: ['audit-batch-codes', tradeId],
    queryFn: async () => {
      if (!trade) return [];
      const ids = [trade.initiator_listing?.id, trade.receiver_listing?.id].filter(Boolean) as string[];
      if (!ids.length) return [];
      const { data } = await supabase
        .from('listing_batch_codes')
        .select('*')
        .in('listing_id', ids);
      return data ?? [];
    },
    enabled: !!trade && isAdmin === true,
  });

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background"><Navigation />
        <div className="flex items-center justify-center pt-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background"><Navigation />
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
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/admin/disputes"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Disputes</Link>
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <FileSearch className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-serif font-bold">Trade Audit</h1>
          </div>
          <p className="text-muted-foreground mb-6">Inspect escrow transitions, batch-code verifications, and dispute evidence activity for any trade.</p>

          <form
            className="flex gap-2 mb-6"
            onSubmit={(e) => { e.preventDefault(); setTradeId(search.trim()); }}
          >
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Trade ID (UUID)" />
            <Button type="submit">Load</Button>
          </form>

          {!tradeId ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Enter a trade ID to load audit details.</CardContent></Card>
          ) : !trade ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No trade found for that ID.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold">
                        {trade.initiator_listing?.brand} {trade.initiator_listing?.name}
                        <span className="text-muted-foreground"> ↔ </span>
                        {trade.receiver_listing?.brand} {trade.receiver_listing?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">@{trade.initiator?.username} ↔ @{trade.receiver?.username}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">Status: {trade.status}</Badge>
                      <Badge variant="outline">Escrow: {trade.escrow_status}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <div>Created: {format(new Date(trade.created_at), 'PPp')}</div>
                    {trade.disputed_at && <div>Disputed: {format(new Date(trade.disputed_at), 'PPp')}</div>}
                    {trade.released_at && <div>Released: {format(new Date(trade.released_at), 'PPp')}</div>}
                    {trade.refunded_at && <div>Refunded: {format(new Date(trade.refunded_at), 'PPp')}</div>}
                    <div>Initiator received: {trade.initiator_received ? '✅' : '—'}</div>
                    <div>Receiver received: {trade.receiver_received ? '✅' : '—'}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <EscrowEventsList tradeId={tradeId} />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Batch-code verifications ({batchCodes?.length ?? 0})</p>
                  {!batchCodes || batchCodes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No batch codes recorded for either listing.</p>
                  ) : (
                    <ul className="space-y-2">
                      {batchCodes.map((b) => (
                        <li key={b.id} className="rounded-md border border-border/50 p-3 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="font-mono">{b.batch_code}</span>
                            <Badge variant="outline">{b.ai_verdict ?? 'unknown'} · {b.ai_plausibility_score ?? 0}%</Badge>
                          </div>
                          <p className="text-muted-foreground">Listing: {b.listing_id}</p>
                          {b.decoded_year && <p>Year: {b.decoded_year}{b.decoded_factory ? ` · ${b.decoded_factory}` : ''}</p>}
                          {b.ai_explanation && <p className="text-muted-foreground">{b.ai_explanation}</p>}
                          {b.verified_at && <p className="text-muted-foreground">Verified {new Date(b.verified_at).toLocaleString()}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <DisputeEvidenceLog tradeId={tradeId} pageSize={20} showFailureFilter />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminAudit;
