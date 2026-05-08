import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Sun, Moon, Snowflake, Leaf, Flower2, CloudSun } from "lucide-react";

const TAGS = [
  { key: "winter", label: "Winter", Icon: Snowflake },
  { key: "spring", label: "Spring", Icon: Flower2 },
  { key: "summer", label: "Summer", Icon: Sun },
  { key: "fall", label: "Fall", Icon: Leaf },
  { key: "day", label: "Day", Icon: CloudSun },
  { key: "night", label: "Night", Icon: Moon },
];

/**
 * Personalized "when to wear" — given the current fragrance, surface the user's
 * past ratings on similar-accord fragrances and weight community season votes
 * by which tag the user is currently considering.
 */
export function PersonalizedWhenToWear({ fragranceId }: { fragranceId: string }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string>("night");
  const [score, setScore] = useState<number | null>(null);
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      setLoading(true);
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (!profile) { setLoading(false); return; }

      // 1. accords of this fragrance
      const { data: accords } = await supabase
        .from("fragrance_accords").select("accord, strength")
        .eq("fragrance_id", fragranceId);
      const accordList = (accords ?? []).map((a: any) => a.accord);

      // 2. user's prior ratings, joined by shared accord
      const { data: myRatings } = await supabase
        .from("fragrance_user_ratings")
        .select("rating, fragrance_id")
        .eq("profile_id", profile.id);

      // 3. community season votes for THIS fragrance with the selected tag
      const { data: votes } = await supabase
        .from("fragrance_season_votes")
        .select("tag")
        .eq("fragrance_id", fragranceId);
      const tagCount = (votes ?? []).filter((v: any) => v.tag === selected).length;
      const totalVotes = Math.max(1, votes?.length ?? 0);

      const ratingMap = { love: 2, like: 1, ok: 0, dislike: -1, hate: -2 } as const;
      const baseScore = (myRatings ?? []).reduce((sum, r: any) => sum + (ratingMap[r.rating as keyof typeof ratingMap] ?? 0), 0);
      const personal = Math.max(0, Math.min(100, 50 + baseScore * 5));
      const community = Math.round((tagCount / totalVotes) * 100);
      const final = Math.round(personal * 0.4 + community * 0.6);

      if (cancelled) return;
      setScore(final);
      setReason(
        accordList.length
          ? `Based on ${myRatings?.length ?? 0} of your ratings + ${tagCount}/${totalVotes} community votes for ${selected}.`
          : `Based on community votes for ${selected}.`
      );
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, fragranceId, selected]);

  const verdict = useMemo(() => {
    if (score === null) return "—";
    if (score >= 70) return "Great match 🌟";
    if (score >= 45) return "Solid pick";
    if (score >= 25) return "Try something else";
    return "Probably skip";
  }, [score]);

  if (!user) {
    return <Card className="p-4 text-sm text-muted-foreground">Sign in for personalized when-to-wear suggestions.</Card>;
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Personalized when to wear</p>
        <p className="text-sm text-muted-foreground">Pick a moment and we'll predict the fit for you.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TAGS.map(t => (
          <button key={t.key} onClick={() => setSelected(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition ${
              selected === t.key ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
            }`}>
            <t.Icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-3xl font-serif">{loading ? "…" : score !== null ? `${score}%` : "—"}</div>
        <div>
          <Badge variant={score && score >= 70 ? "default" : "outline"}>{verdict}</Badge>
          <p className="text-xs text-muted-foreground mt-1">{reason}</p>
        </div>
      </div>
    </Card>
  );
}
