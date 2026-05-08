import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AccordsBar } from "@/components/AccordsBar";
import { RatingBars } from "@/components/RatingBars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FragranceSearchPicker } from "@/components/FragranceSearchPicker";
import { Plus, Sparkles, Clock, Wind, Star, Sun, Moon, Snowflake, Leaf, Flower2, ArrowLeft } from "lucide-react";
import { PersonalizedWhenToWear } from "@/components/PersonalizedWhenToWear";
import { FavoriteButton } from "@/components/FavoriteButton";
import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";

const ACCORD_COLORS: Record<string, string> = {
  woody: "#6B4423", "warm spicy": "#C25E3C", aromatic: "#7DA89B", "fresh spicy": "#A8C66E",
  leather: "#9C7A6B", oud: "#8C857C", powdery: "#E8DDD2", amber: "#C99B7A", vanilla: "#F1ECC9",
  rose: "#E89BAC", citrus: "#F2C94C", floral: "#F7B6C9", musky: "#BDB7AE", green: "#9BCB7E",
  fruity: "#F19E5C", sweet: "#E8B4D8", aquatic: "#7BC8E8", smoky: "#666",
};

type AIDetails = {
  concentration?: string;
  releaseYear?: number;
  perfumer?: string;
  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];
  mainAccords?: string[];
  longevity?: string;
  sillage?: string;
  seasonRating?: { spring: number; summer: number; fall: number; winter: number };
  dayNightRating?: { day: number; night: number };
  averageRating?: number;
  description?: string;
};

export default function FragranceDetail() {
  const { id } = useParams<{ id: string }>();
  const [frag, setFrag] = useState<any>(null);
  const [notes, setNotes] = useState<{ note: string; layer: string }[]>([]);
  const [accords, setAccords] = useState<{ accord: string; strength: number }[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [ai, setAi] = useState<AIDetails | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: f }, { data: n }, { data: a }] = await Promise.all([
        supabase.from("fragrances").select("*").eq("id", id).single(),
        supabase.from("fragrance_notes").select("note, layer, position").eq("fragrance_id", id).order("position"),
        supabase.from("fragrance_accords").select("accord, strength").eq("fragrance_id", id).order("strength", { ascending: false }),
      ]);
      setFrag(f);
      setNotes(n ?? []);
      setAccords(a ?? []);
    })();
  }, [id]);

  // Enrich with AI when accords or top/base notes are missing
  useEffect(() => {
    if (!frag) return;
    const hasTop = notes.some(n => n.layer === "top");
    const hasBase = notes.some(n => n.layer === "base");
    const needs = accords.length === 0 || !hasTop || !hasBase || !frag.description;
    if (!needs) return;
    setAiLoading(true);
    supabase.functions.invoke("fragrance-details", { body: { name: frag.name, brand: frag.brand } })
      .then(({ data }) => setAi(data?.details ?? null))
      .finally(() => setAiLoading(false));
  }, [frag, notes, accords]);

  if (!frag) {
    return (
      <div className="container max-w-6xl py-8 space-y-6">
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const dbTop = notes.filter(n => n.layer === "top").map(n => n.note);
  const dbMid = notes.filter(n => n.layer === "middle").map(n => n.note);
  const dbBase = notes.filter(n => n.layer === "base").map(n => n.note);

  // Merge AI + DB note pyramid (DB wins where present)
  const top = dbTop.length ? dbTop : (ai?.topNotes ?? []);
  const middle = dbMid.length ? dbMid : (ai?.heartNotes ?? []);
  const base = dbBase.length ? dbBase : (ai?.baseNotes ?? []);

  // Merge accords
  const mergedAccords = accords.length
    ? accords
    : (ai?.mainAccords ?? []).slice(0, 8).map((a, i) => ({ accord: a, strength: 90 - i * 8 }));

  const description = frag.description || ai?.description;
  const perfumer = frag.perfumer || ai?.perfumer;

  return (
    <div className="min-h-screen">
      <Navigation />
      {/* HERO */}
      <div className="relative overflow-hidden border-b">
        <div
          className="absolute inset-0 opacity-40 dark:opacity-30 blur-3xl"
          style={{
            background: frag.image_url
              ? `radial-gradient(circle at 30% 40%, hsl(var(--primary) / 0.25), transparent 60%), radial-gradient(circle at 70% 60%, hsl(var(--accent) / 0.4), transparent 60%)`
              : "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--accent)))",
          }}
        />
        <div className="container max-w-6xl py-12 relative">
          <Link to="/discover" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition">
            <ArrowLeft className="h-4 w-4" /> Discover
          </Link>

          <div className="grid md:grid-cols-[340px_1fr] gap-10 items-start">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-muted to-secondary shadow-2xl"
            >
              {frag.image_url ? (
                <img src={frag.image_url} alt={`${frag.name} by ${frag.brand}`}
                  className="w-full h-full object-contain p-6" loading="eager" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 opacity-30" />
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-5"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{frag.brand}</p>
              <h1 className="text-4xl md:text-6xl font-serif leading-[1.05]">{frag.name}</h1>

              <div className="flex flex-wrap gap-2 pt-1">
                {frag.year && <Badge variant="secondary" className="text-xs">{frag.year}</Badge>}
                {(frag.gender) && <Badge variant="outline" className="capitalize text-xs">{frag.gender}</Badge>}
                {ai?.concentration && <Badge variant="outline" className="text-xs">{ai.concentration}</Badge>}
                {perfumer && <Badge variant="outline" className="text-xs">by {perfumer}</Badge>}
                {ai?.averageRating && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {ai.averageRating.toFixed(1)}
                  </Badge>
                )}
              </div>

              {description ? (
                <p className="text-base leading-relaxed text-foreground/80 max-w-2xl">{description}</p>
              ) : aiLoading ? (
                <Skeleton className="h-16 w-full max-w-2xl" />
              ) : null}

              <div className="flex flex-wrap gap-3 pt-3">
                <Button onClick={() => setPickerOpen(true)} size="lg">
                  <Plus className="h-4 w-4 mr-2" /> Add to portfolio
                </Button>
                <FavoriteButton name={frag.name} brand={frag.brand} imageUrl={frag.image_url} size="lg" variant="outline" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="container max-w-6xl py-10 space-y-8">
        {/* Accords */}
        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Main accords</p>
          {mergedAccords.length ? (
            <div className="space-y-2">
              {mergedAccords.map(a => (
                <div key={a.accord} className="relative h-7 rounded-sm overflow-hidden bg-muted/40">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium z-10 text-foreground/90 capitalize">
                    {a.accord}
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${a.strength}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full"
                    style={{ backgroundColor: ACCORD_COLORS[a.accord.toLowerCase()] ?? "#9aa5b1" }}
                  />
                </div>
              ))}
            </div>
          ) : aiLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No accord data available.</p>
          )}
        </Card>

        {/* Notes pyramid */}
        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-6 text-center">Notes pyramid</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: "Top", arr: top, color: "from-amber-400/20 to-transparent" },
              { label: "Heart", arr: middle, color: "from-rose-400/20 to-transparent" },
              { label: "Base", arr: base, color: "from-stone-500/20 to-transparent" },
            ].map(({ label, arr, color }) => (
              <div key={label} className={`rounded-lg p-4 bg-gradient-to-b ${color}`}>
                <p className="text-sm font-serif uppercase tracking-wider mb-3">{label}</p>
                {arr.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {arr.map(n => <Badge key={n} variant="outline" className="capitalize bg-background/60">{n}</Badge>)}
                  </div>
                ) : aiLoading ? (
                  <div className="flex flex-wrap gap-1.5">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-16" />)}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Performance & Seasons */}
        {(ai?.longevity || ai?.sillage || ai?.seasonRating || ai?.dayNightRating) && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-5">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Performance</p>
              <div className="grid grid-cols-2 gap-4">
                {ai?.longevity && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Longevity</p>
                      <p className="text-sm font-medium">{ai.longevity}</p>
                    </div>
                  </div>
                )}
                {ai?.sillage && (
                  <div className="flex items-center gap-3">
                    <Wind className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Sillage</p>
                      <p className="text-sm font-medium">{ai.sillage}</p>
                    </div>
                  </div>
                )}
              </div>
              {ai?.dayNightRating && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <RatingChip icon={<Sun className="h-4 w-4 text-amber-500" />} label="Day" value={ai.dayNightRating.day} />
                  <RatingChip icon={<Moon className="h-4 w-4 text-indigo-400" />} label="Night" value={ai.dayNightRating.night} />
                </div>
              )}
            </Card>

            {ai?.seasonRating && (
              <Card className="p-6 space-y-4">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Best seasons</p>
                <div className="grid grid-cols-4 gap-3">
                  <SeasonChip icon={<Flower2 className="h-4 w-4" />} label="Spring" value={ai.seasonRating.spring} />
                  <SeasonChip icon={<Sun className="h-4 w-4" />} label="Summer" value={ai.seasonRating.summer} />
                  <SeasonChip icon={<Leaf className="h-4 w-4" />} label="Fall" value={ai.seasonRating.fall} />
                  <SeasonChip icon={<Snowflake className="h-4 w-4" />} label="Winter" value={ai.seasonRating.winter} />
                </div>
              </Card>
            )}
          </div>
        )}

        <RatingBars fragranceId={frag.id} />

        <PersonalizedWhenToWear fragranceId={frag.id} />
      </div>

      <FragranceSearchPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        preselectedFragrance={frag}
      />
    </div>
  );
}

function RatingChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex gap-0.5 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-1.5 w-5 rounded-sm ${i < value ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SeasonChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {icon}
      <span className="text-xs">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`h-1.5 w-2 rounded-sm ${i < value ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
    </div>
  );
}
