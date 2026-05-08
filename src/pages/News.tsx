import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Sparkles, ExternalLink } from "lucide-react";

export default function News() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("news_articles").select("*").order("published_at", { ascending: false }).limit(60)
      .then(({ data }) => { setItems(data ?? []); setLoading(false); });
  }, []);

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-3xl md:text-5xl font-serif mb-2">News</h1>
      <p className="text-muted-foreground mb-6">Latest from the fragrance world — releases, brand news and weekly AI-curated highlights.</p>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && items.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          No articles yet. The first feed sync will populate this page within an hour.
        </Card>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {items.map(a => (
          <a key={a.id} href={a.source_url} target="_blank" rel="noreferrer">
            <Card className="p-5 h-full hover:border-primary transition group">
              {a.image_url && <img src={a.image_url} alt="" className="rounded-md mb-3 aspect-video object-cover w-full" />}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span>{a.source}</span>
                <span>·</span>
                <span>{format(new Date(a.published_at), "MMM d, yyyy")}</span>
                {a.is_ai_curated && <Badge variant="secondary" className="ml-auto"><Sparkles className="h-3 w-3 mr-1" />AI digest</Badge>}
              </div>
              <h2 className="font-semibold leading-tight group-hover:underline">{a.title}</h2>
              {a.summary && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{a.summary}</p>}
              <div className="mt-3 text-xs flex items-center gap-1 text-primary"><ExternalLink className="h-3 w-3" /> Read</div>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
