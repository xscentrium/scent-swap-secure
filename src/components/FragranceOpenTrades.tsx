import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Repeat, ArrowRight } from "lucide-react";

type Listing = {
  id: string;
  name: string;
  brand: string;
  size: string;
  condition: string;
  price: number | null;
  estimated_value: number | null;
  image_url: string | null;
  listing_type: string;
};

export function FragranceOpenTrades({ name, brand }: { name: string; brand: string }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, name, brand, size, condition, price, estimated_value, image_url, listing_type")
        .eq("is_active", true)
        .in("listing_type", ["trade", "both"])
        .ilike("name", name)
        .ilike("brand", brand)
        .limit(8);
      setListings(data ?? []);
      setLoading(false);
    })();
  }, [name, brand]);

  if (loading) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-primary" />
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Open trades</p>
        </div>
        {listings.length > 0 && (
          <Link to={`/marketplace?q=${encodeURIComponent(`${brand} ${name}`)}`} className="text-xs text-muted-foreground hover:text-foreground">
            View all
          </Link>
        )}
      </div>

      {listings.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {listings.map((l) => (
            <Link key={l.id} to={`/trade/${l.id}`} className="group">
              <div className="border rounded-lg p-3 hover:border-primary/50 hover:bg-muted/30 transition flex gap-3">
                <div className="w-14 h-14 rounded bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                  {l.image_url ? (
                    <img src={l.image_url} alt={l.name} className="w-full h-full object-contain" />
                  ) : (
                    <Repeat className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1 mb-1">
                    <Badge variant="secondary" className="text-[10px] capitalize">{l.size}</Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">{l.condition}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Est. ${l.estimated_value?.toFixed(0) ?? l.price?.toFixed(0) ?? "—"}
                  </p>
                  <span className="text-xs text-primary inline-flex items-center gap-1 mt-1 group-hover:gap-2 transition-all">
                    Propose trade <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          No open trades for this fragrance right now.{" "}
          <Link to="/create-listing" className="text-primary hover:underline">List yours</Link> to start one.
        </div>
      )}
    </Card>
  );
}
