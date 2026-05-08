import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, XCircle, AlertTriangle, Clock, PackageCheck, Loader2, RefreshCcw, ArrowRight } from 'lucide-react';

type Row = {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  trade_id: string;
};

type TradeMini = {
  id: string;
  escrow_status: string;
  escrow_amount_initiator: number | null;
  escrow_amount_receiver: number | null;
  released_at: string | null;
  refunded_at: string | null;
  disputed_at: string | null;
};

const meta = (t: string) => {
  switch (t) {
    case 'created': return { icon: Clock, tone: 'text-muted-foreground', label: 'Escrow created' };
    case 'held': return { icon: Shield, tone: 'text-primary', label: 'Funds held' };
    case 'released': return { icon: CheckCircle, tone: 'text-green-600', label: 'Funds released' };
    case 'refunded': return { icon: RefreshCcw, tone: 'text-amber-600', label: 'Refunded' };
    case 'disputed': return { icon: AlertTriangle, tone: 'text-destructive', label: 'Disputed' };
    case 'initiator_received':
    case 'receiver_received':
      return { icon: PackageCheck, tone: 'text-green-600', label: 'Receipt confirmed' };
    default: return { icon: Clock, tone: 'text-muted-foreground', label: t };
  }
};

const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (s === 'released') return 'default';
  if (s === 'held') return 'secondary';
  if (s === 'disputed') return 'destructive';
  return 'outline';
};

export const ProfileEscrowHistory = ({ profileId }: { profileId: string }) => {
  const [trades, setTrades] = useState<TradeMini[]>([]);
  const [events, setEvents] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'held' | 'released' | 'refunded' | 'disputed'>('all');

  const load = async () => {
    setLoading(true);
    const { data: t } = await supabase
      .from('trades')
      .select('id, escrow_status, escrow_amount_initiator, escrow_amount_receiver, released_at, refunded_at, disputed_at')
      .or(`initiator_id.eq.${profileId},receiver_id.eq.${profileId}`)
      .order('updated_at', { ascending: false });
    const list = (t ?? []) as TradeMini[];
    setTrades(list);
    const ids = list.map((x) => x.id);
    if (ids.length) {
      const { data: ev } = await supabase
        .from('escrow_events')
        .select('id, event_type, from_status, to_status, metadata, created_at, trade_id')
        .in('trade_id', ids)
        .order('created_at', { ascending: false })
        .limit(100);
      setEvents((ev ?? []) as Row[]);
    } else {
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`profile-escrow-${profileId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escrow_events' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const totals = useMemo(() => {
    let held = 0, released = 0, refunded = 0;
    for (const tr of trades) {
      const amt = (tr.escrow_amount_initiator ?? 0) + (tr.escrow_amount_receiver ?? 0);
      if (tr.escrow_status === 'held') held += amt;
      if (tr.escrow_status === 'released') released += amt;
      if (tr.escrow_status === 'refunded') refunded += amt;
    }
    return { held, released, refunded };
  }, [trades]);

  const filtered = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter((e) => e.event_type === filter || e.to_status === filter);
  }, [events, filter]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!trades.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Shield className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p>No escrow activity yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <Shield className="w-3.5 h-3.5 text-primary" /> Currently Held
            </div>
            <p className="text-2xl font-semibold mt-1 tabular-nums">${totals.held.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <CheckCircle className="w-3.5 h-3.5 text-green-600" /> Released
            </div>
            <p className="text-2xl font-semibold mt-1 tabular-nums">${totals.released.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <RefreshCcw className="w-3.5 h-3.5 text-amber-600" /> Refunded
            </div>
            <p className="text-2xl font-semibold mt-1 tabular-nums">${totals.refunded.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'held', 'released', 'refunded', 'disputed'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Transaction History</h3>
            <span className="text-xs text-muted-foreground">{filtered.length} events</span>
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No events match this filter.</p>
          ) : (
            <ol className="space-y-3 border-l border-border/60 pl-5">
              {filtered.map((e) => {
                const m = meta(e.event_type);
                const Icon = m.icon;
                return (
                  <li key={e.id} className="relative">
                    <span className={`absolute -left-[26px] top-1 ${m.tone} bg-background rounded-full p-0.5 border border-border/40`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{m.label}</span>
                          {e.from_status && e.to_status && e.from_status !== e.to_status && (
                            <span className="text-muted-foreground"> · {e.from_status} → {e.to_status}</span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(e.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Link to={`/trades/${e.trade_id}`} className="shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                          Trade <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Per-trade status */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-4">Trades</h3>
          <div className="space-y-2">
            {trades.map((tr) => {
              const amt = (tr.escrow_amount_initiator ?? 0) + (tr.escrow_amount_receiver ?? 0);
              return (
                <Link
                  key={tr.id}
                  to={`/trades/${tr.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={statusVariant(tr.escrow_status)} className="capitalize">
                      {tr.escrow_status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono truncate">
                      {tr.id.slice(0, 8)}
                    </span>
                  </div>
                  <span className="text-sm font-medium tabular-nums shrink-0">${amt.toFixed(2)}</span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
