import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Minus, Loader2 } from 'lucide-react';

interface Props {
  tradeId: string;
  className?: string;
}

type LogRow = {
  id: string;
  action: 'added' | 'removed';
  path: string;
  created_at: string;
  actor_profile_id: string | null;
};

export const DisputeEvidenceLog = ({ tradeId, className }: Props) => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [actors, setActors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('dispute_evidence_log')
        .select('id, action, path, created_at, actor_profile_id')
        .eq('trade_id', tradeId)
        .order('created_at', { ascending: true });
      const log = (data ?? []) as LogRow[];
      const ids = Array.from(new Set(log.map((r) => r.actor_profile_id).filter(Boolean) as string[]));
      let names: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username, display_name')
          .in('id', ids);
        for (const p of profs ?? []) {
          names[p.id] = (p as any).display_name || (p as any).username || 'Unknown';
        }
      }
      if (!cancelled) {
        setRows(log);
        setActors(names);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tradeId]);

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading evidence log…
        </div>
      </div>
    );
  }

  if (rows.length === 0) return null;

  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Evidence activity</p>
      <ul className="space-y-1.5">
        {rows.map((e) => {
          const actorName = (e.actor_profile_id && actors[e.actor_profile_id]) || 'A user';
          const filename = e.path.split('/').pop();
          const Icon = e.action === 'added' ? Plus : Minus;
          const tone = e.action === 'added' ? 'text-green-600' : 'text-muted-foreground';
          return (
            <li key={e.id} className="flex items-start gap-2 text-xs">
              <span className={`mt-0.5 ${tone}`}><Icon className="w-3 h-3" /></span>
              <div className="flex-1 min-w-0">
                <p className="truncate">
                  <span className="font-medium">{actorName}</span>{' '}
                  <span className="text-muted-foreground">{e.action}</span>{' '}
                  <span title={filename ?? ''}>{filename}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
