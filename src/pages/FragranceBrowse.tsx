import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  const tab = (params.get("by") as "note" | "accord") ?? "note";
  const term = params.get("q") ?? "";
  const [noteQ, setNoteQ] = useState(tab === "note" ? term : "");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (tab === "note" && term) {
      supabase.rpc("search_fragrances_by_note", { note_q: term, lim: 80 }).then(({ data }) => setResults(data ?? []));
    } else if (tab === "accord" && term) {
      supabase.rpc("search_fragrances_by_accord", { accord_q: term, lim: 80 }).then(({ data }) => setResults(data ?? []));
    } else { setResults([]); }
  }, [tab, term]);

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <h1 className="text-3xl md:text-5xl font-serif">Browse fragrances</h1>

      <div className="flex gap-2">
        <button onClick={() => setParams({ by: "note", q: noteQ })}
          className={`px-3 py-1.5 rounded-md text-sm ${tab === "note" ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>By note</button>
        <button onClick={() => setParams({ by: "accord" })}
          className={`px-3 py-1.5 rounded-md text-sm ${tab === "accord" ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>By accord</button>
      </div>

      {tab === "note" && (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-2">Type a note like “bergamot”, “oud”, “vanilla”…</p>
          <Input value={noteQ} onChange={e => { setNoteQ(e.target.value); setParams({ by: "note", q: e.target.value }); }} placeholder="Search note…" />
        </Card>
      )}

      {tab === "accord" && (
        <div className="flex flex-wrap gap-2">
          {ACCORD_GROUPS.map(a => (
            <button key={a.accord} onClick={() => setParams({ by: "accord", q: a.accord })}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border ${term === a.accord ? 'ring-2 ring-primary' : ''}`}
              style={{ backgroundColor: a.color, color: "#1a1a1a" }}>
              {a.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {results.map((f: any) => (
          <Link key={f.id} to={`/fragrance/${f.id}`}>
            <Card className="p-4 hover:border-primary transition">
              <p className="text-xs text-muted-foreground">{f.brand}</p>
              <h3 className="font-semibold">{f.name}</h3>
              <div className="flex gap-2 mt-2">
                {f.year && <Badge variant="secondary">{f.year}</Badge>}
                {f.strength && <Badge variant="outline">{f.strength}%</Badge>}
              </div>
            </Card>
          </Link>
        ))}
        {term && results.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No fragrances match.</p>}
      </div>
    </div>
  );
}
