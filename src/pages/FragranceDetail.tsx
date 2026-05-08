import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AccordsBar } from "@/components/AccordsBar";
import { RatingBars } from "@/components/RatingBars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FragranceSearchPicker } from "@/components/FragranceSearchPicker";
import { Plus } from "lucide-react";
import { PersonalizedWhenToWear } from "@/components/PersonalizedWhenToWear";

export default function FragranceDetail() {
  const { id } = useParams<{ id: string }>();
  const [frag, setFrag] = useState<any>(null);
  const [notes, setNotes] = useState<{ note: string; layer: string }[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("fragrances").select("*").eq("id", id).single().then(({ data }) => setFrag(data));
    supabase.from("fragrance_notes").select("note, layer, position").eq("fragrance_id", id).order("position")
      .then(({ data }) => setNotes(data ?? []));
  }, [id]);

  if (!frag) return <div className="container py-12">Loading…</div>;

  const top = notes.filter(n => n.layer === "top");
  const middle = notes.filter(n => n.layer === "middle");
  const base = notes.filter(n => n.layer === "base");

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{frag.brand}</p>
          <h1 className="text-3xl md:text-5xl font-serif">{frag.name}</h1>
          <div className="flex gap-2 mt-2">
            {frag.year && <Badge variant="secondary">{frag.year}</Badge>}
            {frag.gender && <Badge variant="outline">{frag.gender}</Badge>}
            {frag.perfumer && <Badge variant="outline">by {frag.perfumer}</Badge>}
          </div>
        </div>
        <Button onClick={() => setPickerOpen(true)}><Plus className="h-4 w-4 mr-2" />Add to portfolio</Button>
      </div>

      {frag.description && <p className="text-muted-foreground max-w-3xl">{frag.description}</p>}

      <Card className="p-6"><AccordsBar fragranceId={frag.id} /></Card>

      <Card className="p-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 text-center">Notes pyramid</p>
        <div className="grid grid-cols-3 gap-4">
          {[["Top", top], ["Heart", middle], ["Base", base]].map(([label, arr]: any) => (
            <div key={label}>
              <p className="text-sm font-medium mb-2">{label}</p>
              <div className="flex flex-wrap gap-1.5">
                {arr.length ? arr.map((n: any) => <Badge key={n.note} variant="outline">{n.note}</Badge>)
                  : <span className="text-xs text-muted-foreground">—</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <RatingBars fragranceId={frag.id} />

      <p className="text-sm">
        <Link className="underline" to="/discover">← Back to discover</Link>
      </p>

      <FragranceSearchPicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}
