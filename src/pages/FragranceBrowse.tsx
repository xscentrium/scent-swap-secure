import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";
import { FragranceDetailsModal } from "@/components/FragranceDetailsModal";

const ACCORD_GROUPS = [
  { label: "Woody", accord: "woody", color: "#6B4423" },
  { label: "Warm spicy", accord: "warm spicy", color: "#C25E3C" },
  { label: "Aromatic", accord: "aromatic", color: "#7DA89B" },
  { label: "Fresh spicy", accord: "fresh spicy", color: "#A8C66E" },
  { label: "Leather", accord: "leather", color: "#9C7A6B" },
  { label: "Oud", accord: "oud", color: "#8C857C" },
  { label: "Powdery", accord: "powdery", color: "#E8DDD2" },
  { label: "Amber", accord: "amber", color: "#C99B7A" },
  { label: "Vanilla", accord: "vanilla", color: "#F1ECC9" },
  { label: "Rose", accord: "rose", color: "#E89BAC" },
  { label: "Citrus", accord: "citrus", color: "#F2C94C" },
  { label: "Floral", accord: "floral", color: "#F7B6C9" },
  { label: "Musky", accord: "musky", color: "#BDB7AE" },
  { label: "Green", accord: "green", color: "#9BCB7E" },
  { label: "Fruity", accord: "fruity", color: "#F19E5C" },
  { label: "Sweet", accord: "sweet", color: "#E8B4D8" },
  { label: "Aquatic", accord: "aquatic", color: "#7BC8E8" },
];

export default function FragranceBrowse() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("by") as "note" | "accord") ?? "accord";
  const [noteQ, setNoteQ] = useState(params.get("q") ?? "");
  const [selectedAccords, setSelectedAccords] = useState<string[]>(
    (params.get("a") ?? "").split(",").filter(Boolean)
  );
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<{ name: string; brand: string; imageUrl?: string | null } | null>(null);
  const debouncedNote = useDebounce(noteQ, 300);

  // Persist filters in URL
  useEffect(() => {
    const next: Record<string, string> = { by: tab };
    if (tab === "note" && debouncedNote) next.q = debouncedNote;
    if (tab === "accord" && selectedAccords.length) next.a = selectedAccords.join(",");
    setParams(next, { replace: true });
  }, [tab, debouncedNote, selectedAccords]);

  // Live search by note
  useEffect(() => {
    if (tab !== "note") return;
    if (!debouncedNote) { setResults([]); return; }
    setLoading(true);
    supabase.rpc("search_fragrances_by_note", { note_q: debouncedNote, lim: 80 })
      .then(({ data }) => { setResults(data ?? []); setLoading(false); });
  }, [tab, debouncedNote]);

  // Live multi-accord filter (intersect results across all selected accords)
  useEffect(() => {
    if (tab !== "accord") return;
    if (selectedAccords.length === 0) { setResults([]); return; }
    setLoading(true);
    (async () => {
      const lists = await Promise.all(
        selectedAccords.map(a =>
          supabase.rpc("search_fragrances_by_accord", { accord_q: a, lim: 200 }).then(r => r.data ?? [])
        )
      );
      // intersect by id
      const idCount = new Map<string, { row: any; count: number }>();
      lists.flat().forEach((row: any) => {
        const ex = idCount.get(row.id);
        if (ex) ex.count += 1;
        else idCount.set(row.id, { row, count: 1 });
      });
      const intersected = Array.from(idCount.values())
        .filter(x => x.count === selectedAccords.length)
        .map(x => x.row);
      setResults(intersected);
      setLoading(false);
    })();
  }, [tab, selectedAccords]);

  const toggleAccord = (a: string) =>
    setSelectedAccords(s => s.includes(a) ? s.filter(x => x !== a) : [...s, a]);

  const setTab = (t: "note" | "accord") => setParams({ by: t }, { replace: true });

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <SEO
        title="Browse Fragrances by Notes & Accords | Xscentrium"
        description="Explore the Xscentrium catalog of fragrances. Search by name, brand, accord and notes."
        path="/browse"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Browse Fragrances",
          url: "https://xscentrium.com/browse",
          description: "Explore the Xscentrium catalog of fragrances by name, brand, accord and notes.",
        }}
      />
      <h1 className="text-3xl md:text-5xl font-serif">Browse fragrances</h1>

      <div className="flex gap-2">
        <button onClick={() => setTab("note")}
          className={`px-3 py-1.5 rounded-md text-sm ${tab === "note" ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>By note</button>
        <button onClick={() => setTab("accord")}
          className={`px-3 py-1.5 rounded-md text-sm ${tab === "accord" ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>By accord</button>
      </div>

      {tab === "note" && (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-2">Type a note like "bergamot", "oud", "vanilla"…</p>
          <Input value={noteQ} onChange={e => setNoteQ(e.target.value)} placeholder="Search note…" />
        </Card>
      )}

      {tab === "accord" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Pick one or more accord groups — results update live and require all selected.
          </p>
          <div className="flex flex-wrap gap-2">
            {ACCORD_GROUPS.map(a => {
              const active = selectedAccords.includes(a.accord);
              return (
                <button key={a.accord} onClick={() => toggleAccord(a.accord)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition ${active ? 'ring-2 ring-primary scale-105' : 'opacity-80 hover:opacity-100'}`}
                  style={{ backgroundColor: a.color, color: "#1a1a1a" }}>
                  {a.label}
                </button>
              );
            })}
          </div>
          {selectedAccords.length > 0 && (
            <button onClick={() => setSelectedAccords([])} className="text-xs text-muted-foreground underline">
              Clear filters
            </button>
          )}
        </div>
      )}

      {(tab === "note" ? !!debouncedNote : selectedAccords.length > 0) && (
        <div className="text-sm text-muted-foreground">
          {loading ? "Searching…" : `${results.length} fragrance${results.length === 1 ? "" : "s"}`}
        </div>
      )}
      {!loading && (tab === "note" ? !debouncedNote : selectedAccords.length === 0) && (
        <p className="text-sm text-muted-foreground">
          {tab === "note"
            ? 'Start typing a note above (e.g. "bergamot", "oud", "vanilla") to browse our catalog of 35,000+ fragrances.'
            : "Pick one or more accord groups above to start browsing."}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {results.map((f: any) => (
          <Card key={f.id} className="p-4 hover:border-primary transition flex flex-col gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{f.brand}</p>
              <h3 className="font-semibold">{f.name}</h3>
              <div className="flex gap-2 mt-2 flex-wrap">
                {f.year && <Badge variant="secondary">{f.year}</Badge>}
                {f.strength && <Badge variant="outline">{f.strength}%</Badge>}
              </div>
            </div>
            <div className="flex gap-1.5 pt-2 border-t border-border/40 mt-auto">
              <button
                type="button"
                onClick={() => setActive({ name: f.name, brand: f.brand, imageUrl: f.image_url ?? null })}
                aria-label={`Quick view of ${f.brand} ${f.name}`}
                className="flex-1 min-w-0 min-h-11 text-[11px] sm:text-xs px-1.5 rounded-sm bg-muted hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition font-medium whitespace-nowrap"
              >
                Quick view
              </button>
              <Link
                to={`/fragrance/${f.id}`}
                aria-label={`Open full page for ${f.brand} ${f.name}`}
                className="flex-1 min-w-0 min-h-11 inline-flex items-center justify-center text-[11px] sm:text-xs px-1.5 rounded-sm bg-primary/10 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-primary transition font-medium whitespace-nowrap"
              >
                Full page →
              </Link>
            </div>
          </Card>
        ))}
        {!loading && (tab === "note" ? debouncedNote : selectedAccords.length > 0) && results.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">No fragrances match.</p>
        )}
      </div>

      <FragranceDetailsModal
        open={!!active}
        onOpenChange={(v) => !v && setActive(null)}
        name={active?.name ?? ""}
        brand={active?.brand ?? ""}
        imageUrl={active?.imageUrl ?? null}
        onSelectSimilar={(name, brand) => setActive({ name, brand })}
      />
    </div>
  );
}
