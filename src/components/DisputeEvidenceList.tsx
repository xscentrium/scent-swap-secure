import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, FileText, Loader2, X, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  paths: string[] | null | undefined;
  className?: string;
  /** Optional trade id — required to persist removal back to the trade row. */
  tradeId?: string;
  /** When true, show a remove button on items the current user owns. */
  allowRemove?: boolean;
  /** Called after a successful removal so the parent can refresh data. */
  onRemoved?: (path: string) => void;
}

type Resolved = { path: string; url: string; isImage: boolean; ownedByMe: boolean };

const humanizeRemoveError = (raw: string): string => {
  const m = raw || '';
  if (/row-level security|permission|not authorized|policy/i.test(m)) {
    return "You don't have permission to remove this file.";
  }
  if (/not found|no such/i.test(m)) {
    return 'File no longer exists on the server.';
  }
  if (/network|fetch|failed to fetch/i.test(m)) {
    return 'Network error — check your connection and try again.';
  }
  return m || 'Server rejected the deletion.';
};

export const DisputeEvidenceList = ({ paths, className, tradeId, allowRemove, onRemoved }: Props) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Resolved[]>([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [removeErrors, setRemoveErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!paths || paths.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const resolved: Resolved[] = [];
      for (const p of paths) {
        const { data } = await supabase.storage
          .from('dispute-evidence')
          .createSignedUrl(p, 60 * 60);
        if (data?.signedUrl) {
          resolved.push({
            path: p,
            url: data.signedUrl,
            isImage: /\.(png|jpe?g|webp|gif|heic)$/i.test(p),
            ownedByMe: !!user?.id && p.split('/')[0] === user.id,
          });
        }
      }
      if (!cancelled) {
        setItems(resolved);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [paths?.join('|'), user?.id]);

  const handleRemove = async (path: string) => {
    setRemoveErrors((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
    setRemoving(path);
    try {
      const { error: storageError } = await supabase.storage
        .from('dispute-evidence')
        .remove([path]);
      if (storageError) throw storageError;

      // Persist the change back to the trade row so it disappears from views.
      if (tradeId) {
        const remaining = (paths ?? []).filter((p) => p !== path);
        const { error: updateError } = await supabase
          .from('trades')
          .update({ dispute_evidence_urls: remaining })
          .eq('id', tradeId);
        if (updateError) throw updateError;
      }

      setItems((prev) => prev.filter((i) => i.path !== path));
      onRemoved?.(path);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const friendly = humanizeRemoveError(msg);
      setRemoveErrors((prev) => ({ ...prev, [path]: friendly }));
      // Best-effort: log the failure to the audit timeline.
      if (tradeId) {
        try {
          await supabase.rpc('log_dispute_evidence_failure', {
            p_trade_id: tradeId,
            p_path: path,
            p_error: friendly,
          });
          onRemoved?.(path); // signal parent to refresh log
        } catch { /* ignore audit failures */ }
      }
    } finally {
      setRemoving(null);
    }
  };

  if (!paths || paths.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Evidence ({paths.length})
        </p>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((it) => {
            const filename = it.path.split('/').pop() ?? it.path;
            const err = removeErrors[it.path];
            const canRemove = allowRemove && it.ownedByMe;
            return (
              <div key={it.path} className="space-y-1">
                <div className="relative group rounded-md border border-border/60 bg-muted/40 overflow-hidden">
                  <a href={it.url} target="_blank" rel="noreferrer" title={filename} className="block hover:opacity-90">
                    {it.isImage ? (
                      <img src={it.url} alt={filename} className="w-full h-20 object-cover" />
                    ) : (
                      <div className="w-full h-20 flex items-center justify-center text-muted-foreground">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="px-1.5 py-1 border-t border-border/40 bg-background/40">
                      <p className="text-[10px] truncate text-muted-foreground">{filename}</p>
                    </div>
                  </a>
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => handleRemove(it.path)}
                      disabled={removing === it.path}
                      aria-label={`Remove ${filename}`}
                      className="absolute top-1 right-1 p-1 rounded-full bg-background/80 border border-border opacity-0 group-hover:opacity-100 focus:opacity-100 transition hover:bg-destructive hover:text-destructive-foreground disabled:opacity-100"
                    >
                      {removing === it.path ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
                {err && (
                  <div
                    role="alert"
                    className="text-[10px] leading-tight text-destructive bg-destructive/5 border border-destructive/30 rounded px-1.5 py-1 space-y-1"
                  >
                    <p>{err}</p>
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => handleRemove(it.path)}
                        disabled={removing === it.path}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-destructive hover:underline disabled:opacity-60"
                      >
                        {removing === it.path
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <RefreshCw className="w-3 h-3" />}
                        Retry
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
