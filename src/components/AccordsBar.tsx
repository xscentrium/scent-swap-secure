import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ACCORD_COLORS: Record<string, string> = {
  woody: "#6B4423", "warm spicy": "#C25E3C", aromatic: "#7DA89B", "fresh spicy": "#A8C66E",
  leather: "#9C7A6B", oud: "#8C857C", powdery: "#E8DDD2", amber: "#C99B7A", vanilla: "#F1ECC9",
  rose: "#E89BAC", citrus: "#F2C94C", floral: "#F7B6C9", musky: "#BDB7AE", green: "#9BCB7E",
  fruity: "#F19E5C", sweet: "#E8B4D8", aquatic: "#7BC8E8", smoky: "#666",
};

export function AccordsBar({ fragranceId, max = 10 }: { fragranceId: string; max?: number }) {
  const [accords, setAccords] = useState<{ accord: string; strength: number }[]>([]);

  useEffect(() => {
    supabase.from("fragrance_accords").select("accord, strength")
      .eq("fragrance_id", fragranceId).order("strength", { ascending: false }).limit(max)
      .then(({ data }) => setAccords(data ?? []));
  }, [fragranceId, max]);

  if (!accords.length) return <p className="text-sm text-muted-foreground">No accords yet</p>;

  return (
    <div className="space-y-1.5">
      <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-2">Main accords</p>
      {accords.map(a => (
        <div key={a.accord} className="relative h-6 rounded-sm overflow-hidden bg-muted/40">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium z-10 text-foreground/90">
            {a.accord}
          </div>
          <div className="h-full rounded-sm transition-all"
            style={{ width: `${a.strength}%`, backgroundColor: ACCORD_COLORS[a.accord.toLowerCase()] ?? "#9aa5b1" }} />
        </div>
      ))}
    </div>
  );
}
