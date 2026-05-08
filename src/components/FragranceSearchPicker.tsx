import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, Plus, Settings2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PortfolioManager, usePortfolios } from "@/components/PortfolioManager";

type Frag = { id: string; brand: string; name: string; year: number | null; image_url: string | null };
type Variant = { id: string; concentration: string; size_ml: number; batch_year: number | null };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPortfolio?: "main" | "wishlist" | "sold" | "samples";
  onAdded?: () => void;
  /** Pre-select a fragrance and skip search step */
  preselectedFragrance?: { id: string; brand: string; name: string; year?: number | null; image_url?: string | null };
}

export function FragranceSearchPicker({ open, onOpenChange, defaultPortfolio = "main", onAdded, preselectedFragrance }: Props) {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Frag[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Frag | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantId, setVariantId] = useState<string>("");
  const [portfolio, setPortfolio] = useState<string>(defaultPortfolio);
  const [adding, setAdding] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id").eq("user_id", user.id).single()
      .then(({ data }) => setProfileId(data?.id ?? null));
  }, [user]);

  // preselect support
  useEffect(() => {
    if (open && preselectedFragrance) {
      setSelected({
        id: preselectedFragrance.id,
        brand: preselectedFragrance.brand,
        name: preselectedFragrance.name,
        year: preselectedFragrance.year ?? null,
        image_url: preselectedFragrance.image_url ?? null,
      });
    }
  }, [open, preselectedFragrance]);

  // debounced search
  useEffect(() => {
    if (!open || preselectedFragrance) return;
    const t = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("search_fragrances", { q, lim: 25 });
      if (!error) setResults((data as Frag[]) ?? []);
      setLoading(false);
    }, 220);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    if (!selected) { setVariants([]); setVariantId(""); return; }
    supabase.from("fragrance_variants").select("id,concentration,size_ml,batch_year")
      .eq("fragrance_id", selected.id).order("size_ml")
      .then(({ data }) => {
        setVariants((data as Variant[]) ?? []);
        if (data && data.length) setVariantId(data[0].id);
      });
  }, [selected]);

  const handleAdd = async () => {
    if (!selected || !profileId) return;
    setAdding(true);
    try {
      const variant = variants.find(v => v.id === variantId);
      if (portfolio === "wishlist") {
        const { error } = await supabase.from("favorite_fragrances").insert({
          profile_id: profileId,
          fragrance_id: selected.id,
          fragrance_brand: selected.brand,
          fragrance_name: selected.name,
          image_url: selected.image_url,
        });
        if (error) throw error;
      } else if (portfolio === "samples") {
        const { error } = await supabase.from("samples_decants").insert({
          profile_id: profileId,
          fragrance_id: selected.id,
          variant_id: variantId || null,
          brand: selected.brand,
          name: selected.name,
          size_ml: variant?.size_ml ?? 5,
          type: "sample",
          image_url: selected.image_url,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("collection_items").insert({
          profile_id: profileId,
          fragrance_id: selected.id,
          variant_id: variantId || null,
          brand: selected.brand,
          name: selected.name,
          size: variant ? `${variant.size_ml}ml ${variant.concentration}` : null,
          image_url: selected.image_url,
          portfolio,
        });
        if (error) throw error;
      }
      toast.success(`Added to ${portfolio}`);
      onAdded?.();
      onOpenChange(false);
      setSelected(null); setQ("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to add");
    } finally { setAdding(false); }
  };

  const handleSuggest = async () => {
    if (!profileId) return toast.error("Sign in required");
    const brand = prompt("Brand name?"); if (!brand) return;
    const name = prompt("Fragrance name?"); if (!name) return;
    const { error } = await supabase.from("fragrance_suggestions").insert({
      profile_id: profileId, brand, name,
    });
    if (error) toast.error(error.message);
    else toast.success("Suggestion submitted for review");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add to your portfolio</DialogTitle>
          <DialogDescription>Search the catalog, pick a variant, and add it to a portfolio.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setSelected(null); }}
            placeholder="Search by brand or fragrance name…" className="pl-9" autoFocus />
        </div>

        {!selected && (
          <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
            {loading && <div className="p-3 text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>}
            {!loading && results.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No matches. <button className="underline text-primary" onClick={handleSuggest}>Suggest a missing fragrance</button>
              </div>
            )}
            {results.map(f => (
              <button key={f.id} onClick={() => setSelected(f)} className="w-full text-left p-3 hover:bg-muted flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs">{f.brand[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{f.brand} — {f.name}</div>
                  {f.year && <div className="text-xs text-muted-foreground">{f.year}</div>}
                </div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="space-y-4">
            <div className="border rounded-md p-3 flex items-center gap-3">
              <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">{selected.brand[0]}</div>
              <div className="flex-1">
                <div className="font-semibold">{selected.brand} — {selected.name}</div>
                {selected.year && <Badge variant="secondary" className="mt-1">{selected.year}</Badge>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Change</Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase text-muted-foreground">Variant</label>
                <Select value={variantId} onValueChange={setVariantId}>
                  <SelectTrigger><SelectValue placeholder="Pick size" /></SelectTrigger>
                  <SelectContent>
                    {variants.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.concentration} · {v.size_ml}ml</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Portfolio</label>
                <Select value={portfolio} onValueChange={setPortfolio}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main collection</SelectItem>
                    <SelectItem value="wishlist">Wishlist</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="samples">Samples & decants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleAdd} disabled={adding} className="w-full">
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add to portfolio
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
