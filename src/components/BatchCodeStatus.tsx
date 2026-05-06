import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, ShieldQuestion, Loader2 } from 'lucide-react';

type BatchRow = {
  batch_code: string;
  ai_verdict: string | null;
  ai_plausibility_score: number | null;
  ai_explanation: string | null;
  decoded_year: number | null;
  decoded_factory: string | null;
  verified_at: string | null;
};

export const BatchCodeStatus = ({ listingId, compact }: { listingId: string; compact?: boolean }) => {
  const [row, setRow] = useState<BatchRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('listing_batch_codes')
        .select('batch_code, ai_verdict, ai_plausibility_score, ai_explanation, decoded_year, decoded_factory, verified_at')
        .eq('listing_id', listingId)
        .maybeSingle();
      if (!cancelled) { setRow(data as BatchRow | null); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [listingId]);

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  if (!row) {
    return compact ? null : (
      <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
        No batch code submitted by the seller yet.
      </div>
    );
  }

  const score = row.ai_plausibility_score ?? 0;
  const verdict = (row.ai_verdict ?? 'unknown').toLowerCase();
  const tone =
    verdict === 'plausible' || score >= 70 ? { Icon: ShieldCheck, cls: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Plausible' } :
    verdict === 'suspicious' || score < 40 ? { Icon: ShieldAlert, cls: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Suspicious' } :
    { Icon: ShieldQuestion, cls: 'bg-muted text-muted-foreground border-border', label: verdict || 'Unknown' };

  const Icon = tone.Icon;

  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Batch code authenticity</p>
        </div>
        <Badge variant="outline" className={tone.cls}>
          <Icon className="w-3 h-3 mr-1" /> {tone.label}{score ? ` · ${score}%` : ''}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><span className="text-muted-foreground">Code:</span> <span className="font-mono">{row.batch_code}</span></div>
        {row.decoded_year && <div><span className="text-muted-foreground">Year:</span> {row.decoded_year}</div>}
        {row.decoded_factory && <div><span className="text-muted-foreground">Factory:</span> {row.decoded_factory}</div>}
        {row.verified_at && (
          <div className="col-span-2 text-muted-foreground">
            Verified {new Date(row.verified_at).toLocaleString()}
          </div>
        )}
      </div>
      {!compact && row.ai_explanation && (
        <p className="text-xs text-muted-foreground border-t border-border/50 pt-2">{row.ai_explanation}</p>
      )}
    </div>
  );
};
