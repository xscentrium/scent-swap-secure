import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const RATINGS = [
  { key: "love", emoji: "😍", color: "#ef4444" },
  { key: "like", emoji: "🙂", color: "#d946ef" },
  { key: "ok", emoji: "😐", color: "#f97316" },
  { key: "dislike", emoji: "😕", color: "#3b82f6" },
  { key: "hate", emoji: "😖", color: "#1e3a8a" },
] as const;

const SEASONS = [
  { key: "winter", label: "winter", color: "#7BC8E8" },
  { key: "spring", label: "spring", color: "#9BCB7E" },
  { key: "summer", label: "summer", color: "#F2C94C" },
  { key: "fall", label: "fall", color: "#E89B5A" },
  { key: "day", label: "day", color: "#FACC15" },
  { key: "night", label: "night", color: "#6366F1" },
] as const;

export function RatingBars({ fragranceId }: { fragranceId: string }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [seasonCounts, setSeasonCounts] = useState<Record<string, number>>({});
  const [myRating, setMyRating] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: r }, { data: s }] = await Promise.all([
      supabase.from("fragrance_user_ratings").select("rating").eq("fragrance_id", fragranceId),
      supabase.from("fragrance_season_votes").select("tag").eq("fragrance_id", fragranceId),
    ]);
    const rc: Record<string, number> = {};
    (r ?? []).forEach((x: any) => { rc[x.rating] = (rc[x.rating] ?? 0) + 1; });
    setCounts(rc);
    const sc: Record<string, number> = {};
    (s ?? []).forEach((x: any) => { sc[x.tag] = (sc[x.tag] ?? 0) + 1; });
    setSeasonCounts(sc);
  };

  useEffect(() => {
    load();
    if (!user) return;
    supabase.from("profiles").select("id").eq("user_id", user.id).single().then(async ({ data: p }) => {
      if (!p) return;
      setProfileId(p.id);
      const { data: mine } = await supabase.from("fragrance_user_ratings").select("rating")
        .eq("fragrance_id", fragranceId).eq("profile_id", p.id).maybeSingle();
      setMyRating(mine?.rating ?? null);
    });
  }, [fragranceId, user]);

  const vote = async (rating: string) => {
    if (!profileId) return toast.error("Sign in to rate");
    const { error } = await supabase.from("fragrance_user_ratings").upsert(
      { fragrance_id: fragranceId, profile_id: profileId, rating },
      { onConflict: "fragrance_id,profile_id" }
    );
    if (error) return toast.error(error.message);
    setMyRating(rating);
    load();
  };

  const voteSeason = async (tag: string) => {
    if (!profileId) return toast.error("Sign in to vote");
    const { error } = await supabase.from("fragrance_season_votes").insert({
      fragrance_id: fragranceId, profile_id: profileId, tag
    });
    if (error && !error.message.includes("duplicate")) return toast.error(error.message);
    load();
  };

  const max = Math.max(1, ...Object.values(counts));
  const sMax = Math.max(1, ...Object.values(seasonCounts));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="border rounded-lg p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">❤️ Rating</p>
        <div className="grid grid-cols-5 gap-2">
          {RATINGS.map(r => (
            <button key={r.key} onClick={() => vote(r.key)}
              className={`flex flex-col items-center gap-1 p-1 rounded transition ${myRating === r.key ? 'ring-2 ring-primary' : 'hover:bg-muted'}`}>
              <span className="text-2xl">{r.emoji}</span>
              <span className="text-xs">{r.key}</span>
              <div className="h-1 w-full rounded bg-muted overflow-hidden">
                <div className="h-full transition-all" style={{ width: `${((counts[r.key] ?? 0) / max) * 100}%`, backgroundColor: r.color }} />
              </div>
              <span className="text-xs text-muted-foreground">{counts[r.key] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">🕐 When to wear</p>
        <div className="grid grid-cols-6 gap-2">
          {SEASONS.map(s => (
            <button key={s.key} onClick={() => voteSeason(s.key)} className="flex flex-col items-center gap-1 p-1 rounded hover:bg-muted">
              <span className="text-xs">{s.label}</span>
              <div className="h-1 w-full rounded bg-muted overflow-hidden">
                <div className="h-full transition-all" style={{ width: `${((seasonCounts[s.key] ?? 0) / sMax) * 100}%`, backgroundColor: s.color }} />
              </div>
              <span className="text-xs text-muted-foreground">{seasonCounts[s.key] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
