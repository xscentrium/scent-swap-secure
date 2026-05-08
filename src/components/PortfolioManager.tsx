import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Settings2 } from "lucide-react";

export type Portfolio = { id: string; name: string; slug: string; is_system: boolean; sort_order: number };

const SYSTEM: Portfolio[] = [
  { id: "sys-main", name: "Main collection", slug: "main", is_system: true, sort_order: 0 },
  { id: "sys-wishlist", name: "Wishlist", slug: "wishlist", is_system: true, sort_order: 1 },
  { id: "sys-sold", name: "Sold", slug: "sold", is_system: true, sort_order: 2 },
  { id: "sys-samples", name: "Samples & decants", slug: "samples", is_system: true, sort_order: 3 },
];

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || `p-${Date.now()}`;
}

export function usePortfolios(profileId: string | null) {
  return useQuery({
    queryKey: ["portfolios", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase.from("portfolios")
        .select("id, name, slug, is_system, sort_order")
        .eq("profile_id", profileId!)
        .order("sort_order");
      if (error) throw error;
      return [...SYSTEM, ...((data ?? []) as Portfolio[])];
    },
  });
}

interface Props {
  profileId: string;
  trigger?: React.ReactNode;
}

export function PortfolioManager({ profileId, trigger }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const { data: portfolios = [], isLoading } = usePortfolios(profileId);

  const create = useMutation({
    mutationFn: async (name: string) => {
      const slug = slugify(name);
      const { error } = await supabase.from("portfolios").insert({
        profile_id: profileId, name: name.trim(), slug,
        sort_order: portfolios.filter(p => !p.is_system).length + 10,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolios", profileId] });
      setNewName("");
      toast.success("Portfolio created");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create"),
  });

  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("portfolios").update({ name: name.trim() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolios", profileId] });
      setEditing(null);
      toast.success("Renamed");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to rename"),
  });

  const remove = useMutation({
    mutationFn: async (p: Portfolio) => {
      // Move items to "main" then delete the portfolio
      await supabase.from("collection_items").update({ portfolio: "main" })
        .eq("profile_id", profileId).eq("portfolio", p.slug);
      const { error } = await supabase.from("portfolios").delete().eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolios", profileId] });
      qc.invalidateQueries({ queryKey: ["collection", profileId] });
      toast.success("Portfolio deleted; items moved to Main");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete"),
  });

  const custom = portfolios.filter(p => !p.is_system);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Settings2 className="h-4 w-4 mr-2" /> Manage portfolios
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your portfolios</DialogTitle>
          <DialogDescription>Create custom collections like "Summer", "Office", or "Niche only".</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Built-in</div>
          {SYSTEM.map(p => (
            <div key={p.id} className="flex items-center justify-between text-sm py-1">
              <span>{p.name}</span>
              <span className="text-xs text-muted-foreground">default</span>
            </div>
          ))}

          <div className="text-xs uppercase tracking-wider text-muted-foreground pt-3">Custom</div>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : custom.length === 0 ? (
            <p className="text-sm text-muted-foreground">No custom portfolios yet.</p>
          ) : custom.map(p => (
            <div key={p.id} className="flex items-center gap-2">
              {editing?.id === p.id ? (
                <>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
                    className="h-8" autoFocus
                    onKeyDown={e => e.key === "Enter" && rename.mutate(editing)} />
                  <Button size="sm" onClick={() => rename.mutate(editing)} disabled={rename.isPending}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{p.name}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => setEditing({ id: p.id, name: p.name })}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                    onClick={() => {
                      if (confirm(`Delete "${p.name}"? Items will be moved to Main collection.`)) remove.mutate(p);
                    }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-3 border-t">
            <Input placeholder="New portfolio name…" value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && newName.trim() && create.mutate(newName)} />
            <Button onClick={() => newName.trim() && create.mutate(newName)} disabled={create.isPending || !newName.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
