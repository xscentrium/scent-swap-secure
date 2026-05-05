import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, FileText, ImageIcon, Loader2 } from 'lucide-react';

interface Props {
  paths: string[] | null | undefined;
  className?: string;
}

type Resolved = { path: string; url: string; isImage: boolean };

export const DisputeEvidenceList = ({ paths, className }: Props) => {
  const [items, setItems] = useState<Resolved[]>([]);
  const [loading, setLoading] = useState(false);

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
          });
        }
      }
      if (!cancelled) {
        setItems(resolved);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [paths?.join('|')]);

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
            return (
              <a
                key={it.path}
                href={it.url}
                target="_blank"
                rel="noreferrer"
                title={filename}
                className="group block rounded-md border border-border/60 bg-muted/40 overflow-hidden hover:border-primary/60 transition"
              >
                {it.isImage ? (
                  <img src={it.url} alt={filename} className="w-full h-20 object-cover group-hover:opacity-90" />
                ) : (
                  <div className="w-full h-20 flex flex-col items-center justify-center text-muted-foreground p-2">
                    <FileText className="w-5 h-5 mb-1" />
                  </div>
                )}
                <div className="px-1.5 py-1 border-t border-border/40 bg-background/40">
                  <p className="text-[10px] truncate text-muted-foreground">{filename}</p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};
