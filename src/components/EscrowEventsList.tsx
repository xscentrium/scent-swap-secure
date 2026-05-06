import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle, XCircle, AlertTriangle, Clock, PackageCheck, Loader2 } from 'lucide-react';

type EscrowEvent = {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  actor_profile_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const meta = (t: string) => {
  switch (t) {
    case 'created': return { icon: Clock, tone: 'text-muted-foreground', label: 'Escrow created' };
    case 'held': return { icon: Shield, tone: 'text-primary', label: 'Escrow held' };
    case 'released': return { icon: CheckCircle, tone: 'text-green-600', label: 'Escrow released' };
    case 'refunded': return { icon: XCircle, tone: 'text-muted-foreground', label: 'Escrow refunded' };
    case 'disputed': return { icon: AlertTriangle, tone: 'text-destructive', label: 'Escrow disputed' };
    case 'initiator_received':
    case 'receiver_received':
      return { icon: PackageCheck, tone: 'text-green-600', label: 'Party confirmed receipt' };
    default: return { icon: Clock, tone: 'text-muted-foreground', label: t };
  }
};

export const EscrowEventsList = ({
  tradeId, refreshKey = 0, className,
}: { tradeId: string; refreshKey?: number; className?: string }) => {
  const [rows, setRows] = useState<EscrowEvent[]>([]);
  const [actors, setActors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('escrow_events')
        .select('id, event_type, from_status, to_status, actor_profile_id, metadata, created_at')
        .eq('trade_id', tradeId)
        .order('created_at', { ascending: true });
      const ev = (data ?? []) as EscrowEvent[];
      const ids = Array.from(new Set(ev.map((r) => r.actor_profile_id).filter(Boolean) as string[]));
      const names: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, username, display_name').in('id', ids);
        for (const p of (profs ?? []) as Array<{ id: string; username: string; display_name?: string }>) {
          names[p.id] = p.display_name || p.username;
        }
      }
      if (!cancelled) { setRows(ev); setActors(names); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [tradeId, refreshKey]);

  if (loading) return <div className={className}><Loader2 className="w-3 h-3 animate-spin text-muted-foreground" /></div>;
  if (!rows.length) return null;

  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Escrow events ({rows.length})</p>
      <ol className="space-y-2">
        {rows.map((e) => {
          const m = meta(e.event_type);
          const Icon = m.icon;
          const who = e.actor_profile_id ? actors[e.actor_profile_id] : null;
          return (
            <li key={e.id} className="flex items-start gap-2 text-xs">
              <span className={`mt-0.5 ${m.tone}`}><Icon className="w-3.5 h-3.5" /></span>
              <div className="flex-1 min-w-0">
                <p>
                  <span className="font-medium">{m.label}</span>
                  {e.from_status && e.to_status && e.from_status !== e.to_status && (
                    <span className="text-muted-foreground"> ({e.from_status} → {e.to_status})</span>
                  )}
                  {who && <span className="text-muted-foreground"> · by {who}</span>}
                </p>
                <p className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
