import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Minus, Loader2 } from 'lucide-react';

type Entry = {
  id: string;
  action: 'added' | 'removed';
  path: string;
  created_at: string;
  actor_profile_id: string | null;
  actor: { username: string | null; display_name: string | null } | null;
};

interface Props {
  tradeId: string;
  className?: string;
}

export const DisputeEvidenceLog = ({ tradeId, className }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ['dispute-evidence-log', tradeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispute_evidence_log')
        .select('id, action, path, created_at, actor_profile_id, actor:profiles!dispute_evidence_log_actor_profile_id_fkey ( username, display_name )')
        .eq('trade_id', tradeId)
        .order('created_at', { ascending: true });
      if (error) {
        // Foreign key join might not exist; fallback without actor join
        const { data: d2 } = await supabase
          .from('dispute_evidence_log')
          .select('id, action, path, created_at, actor_profile_id')
          .eq('trade_id', tradeId)
          .order('created_at', { ascending: true });
        return (d2 ?? []).map((r) => ({ ...r, actor: null })) as unknown as Entry[];
      }
      return data as unknown as Entry[];
    },
    enabled: !!tradeId,
  });

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading evidence log…
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Evidence activity</p>
      <ul className="space-y-1.5">
        {data.map((e) => {
          const actorName = e.actor?.display_name || e.actor?.username || 'A user';
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
                  <span className="truncate" title={filename}>{filename}</span>
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
