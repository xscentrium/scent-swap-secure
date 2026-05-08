import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShoppingBag } from "lucide-react";

type Link = {
  id: string;
  affiliate_url: string;
  description: string | null;
  profile_id: string;
};

export function FragranceBuyLinks({ name, brand }: { name: string; brand: string }) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("affiliate_links")
        .select("id, affiliate_url, description, profile_id")
        .ilike("fragrance_name", name)
        .ilike("brand", brand);
      setLinks(data ?? []);
      setLoading(false);
    })();
  }, [name, brand]);

  if (loading) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="h-4 w-4 text-primary" />
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Where to buy</p>
      </div>
      {links.length ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {links.map((l) => (
            <a key={l.id} href={l.affiliate_url} target="_blank" rel="noopener noreferrer sponsored">
              <Button variant="outline" className="w-full justify-between h-auto py-3">
                <span className="text-sm font-medium truncate">
                  {l.description || new URL(l.affiliate_url).hostname.replace("www.", "")}
                </span>
                <ExternalLink className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No retail partners yet for this fragrance. Check back soon.
        </p>
      )}
    </Card>
  );
}
