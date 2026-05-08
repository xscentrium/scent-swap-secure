import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle, XCircle, AlertTriangle, Clock, PackageCheck, Loader2, RefreshCcw } from 'lucide-react';

type Row = {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  trade_id: string;
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

export const ListingEscrowTimeline = ({ listingId, className }: { listingId: string; className?: string }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: trades } = await supabase
      .from('trades')
      .select('id')
      .or(`initiator_listing_id.eq.${listingId},receiver_listing_id.eq.${listingId}`);
    const tradeIds = (trades ?? []).map((t: { id: string }) => t.id);
    if (!tradeIds.length) { setRows([]); setLoading(false); return; }
    const { data } = await supabase
      .from('escrow_events')
      .select('id, event_type, from_status, to_status, metadata, created_at, trade_id')
      .in('trade_id', tradeIds)
      .order('created_at', { ascending: false })
      .limit(20);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`listing-escrow-${listingId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escrow_events' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  if (loading) return <div className={className}><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;
  if (!rows.length) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-sm">Escrow Activity</h4>
        <span className="text-xs text-muted-foreground">({rows.length})</span>
      </div>
      <ol className="space-y-2 border-l border-border/60 pl-4">
        {rows.map((e) => {
          const m = meta(e.event_type);
          const Icon = m.icon;
          return (
            <li key={e.id} className="relative">
              <span className={`absolute -left-[22px] top-0.5 ${m.tone} bg-background rounded-full p-0.5`}>
                <Icon className="w-3.5 h-3.5" />
              </span>
              <p className="text-xs">
                <span className="font-medium">{m.label}</span>
                {e.from_status && e.to_status && e.from_status !== e.to_status && (
                  <span className="text-muted-foreground"> · {e.from_status} → {e.to_status}</span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
