import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Minus, AlertTriangle, Loader2, ChevronDown } from 'lucide-react';

interface Props {
  tradeId: string;
  className?: string;
  /** Bump to force a refetch (e.g. after a remove succeeds or fails). */
  refreshKey?: number;
  /** Initial number of entries to show before "Show more". */
  pageSize?: number;
  /** Show a toggle to filter to failed-removal entries only. */
  showFailureFilter?: boolean;
}

type LogRow = {
  id: string;
  action: 'added' | 'removed' | 'failed_remove' | string;
  path: string;
  created_at: string;
  actor_profile_id: string | null;
  error_message: string | null;
};

export const DisputeEvidenceLog = ({ tradeId, className, refreshKey = 0, pageSize = 5 }: Props) => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [actors, setActors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(pageSize);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('dispute_evidence_log')
        .select('id, action, path, created_at, actor_profile_id, error_message')
        .eq('trade_id', tradeId)
        .order('created_at', { ascending: true });
      const log = (data ?? []) as LogRow[];
      const ids = Array.from(new Set(log.map((r) => r.actor_profile_id).filter(Boolean) as string[]));
      const names: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username, display_name')
          .in('id', ids);
        for (const p of profs ?? []) {
          names[p.id] = (p as { display_name?: string; username?: string }).display_name
            || (p as { username?: string }).username || 'Unknown';
        }
      }
      if (!cancelled) {
        setRows(log);
        setActors(names);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tradeId, refreshKey]);

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

  // Show newest first when paginating, but keep chronological within visible slice
  const sliced = rows.slice(Math.max(0, rows.length - visible));
  const hidden = rows.length - sliced.length;

  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
        Evidence activity ({rows.length})
      </p>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + pageSize)}
          className="mb-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
        >
          <ChevronDown className="w-3 h-3" /> Show {Math.min(pageSize, hidden)} earlier
        </button>
      )}
      <ul className="space-y-1.5">
        {sliced.map((e) => {
          const actorName = (e.actor_profile_id && actors[e.actor_profile_id]) || 'A user';
          const filename = e.path.split('/').pop();
          const isFailure = e.action === 'failed_remove';
          const Icon = e.action === 'added' ? Plus : isFailure ? AlertTriangle : Minus;
          const tone = e.action === 'added'
            ? 'text-green-600'
            : isFailure ? 'text-destructive' : 'text-muted-foreground';
          const verb = e.action === 'added'
            ? 'added'
            : isFailure ? 'failed to remove' : 'removed';
          return (
            <li key={e.id} className="flex items-start gap-2 text-xs">
              <span className={`mt-0.5 ${tone}`}><Icon className="w-3 h-3" /></span>
              <div className="flex-1 min-w-0">
                <p className="truncate">
                  <span className="font-medium">{actorName}</span>{' '}
                  <span className="text-muted-foreground">{verb}</span>{' '}
                  <span title={filename ?? ''}>{filename}</span>
                </p>
                {isFailure && e.error_message && (
                  <p className="text-[11px] text-destructive break-words">
                    {e.error_message}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {new Date(e.created_at).toLocaleString()}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
