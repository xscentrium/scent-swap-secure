import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, Lock, Sparkles, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type Pairing = {
  partnerName: string;
  partnerBrand: string;
  reason: string;
  layeringMethod: string;
  resultProfile: string;
  bestFor?: string[];
  compatibility?: number;
};

interface Props {
  fragranceId: string;
  name: string;
  brand: string;
}

const PUBLIC_LIMIT = 2;

export function FragrancePairings({ fragranceId, name, brand }: Props) {
  const { user } = useAuth();
  const [revealed, setRevealed] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["fragrance-pairings", fragranceId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-layering", {
        body: { anchor: { name, brand } },
      });
      if (error) throw error;
      return (data?.pairings ?? []) as Pairing[];
    },
    staleTime: 1000 * 60 * 60 * 6,
  });

  const pairings = data ?? [];
  const visible = user || revealed ? pairings : pairings.slice(0, PUBLIC_LIMIT);
  const hidden = Math.max(0, pairings.length - visible.length);

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Pairings & layering</p>
            <p className="text-sm text-muted-foreground">Fragrances that mix beautifully with {name}</p>
          </div>
        </div>
        <Sparkles className="h-4 w-4 text-muted-foreground" />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      )}

      {error && (
        <p className="text-sm text-muted-foreground">Couldn't load pairings right now.</p>
      )}

      {!isLoading && pairings.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">No pairing suggestions yet.</p>
      )}

      <div className="grid gap-3">
        {visible.map((p, i) => (
          <div key={i} className="rounded-lg border bg-card/40 p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-serif text-lg leading-tight">+ {p.partnerName}</p>
                <p className="text-xs text-muted-foreground">{p.partnerBrand}</p>
              </div>
              {typeof p.compatibility === "number" && (
                <Badge variant="secondary">{p.compatibility}/10</Badge>
              )}
            </div>
            <p className="text-sm text-foreground/85">{p.reason}</p>
            <p className="text-sm text-muted-foreground italic">Result: {p.resultProfile}</p>
            <div className="flex items-start gap-2 text-xs text-primary">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{p.layeringMethod}</span>
            </div>
            {p.bestFor && p.bestFor.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {p.bestFor.map(o => <Badge key={o} variant="outline" className="text-xs">{o}</Badge>)}
              </div>
            )}
          </div>
        ))}
      </div>

      {hidden > 0 && !user && (
        <div className="relative rounded-lg border border-dashed bg-muted/30 p-5 text-center space-y-3">
          <Lock className="h-5 w-5 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium">{hidden} more curated pairings</p>
          <p className="text-xs text-muted-foreground">Sign in to unlock the full layering guide for {name}.</p>
          <Button asChild size="sm">
            <Link to="/auth">Sign in to unlock</Link>
          </Button>
        </div>
      )}
    </Card>
  );
}
