import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Droplet, 
  Plus, 
  Trash2, 
  TestTube,
  Package
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SampleDecant {
  id: string;
  brand: string;
  name: string;
  size_ml: number;
  type: string;
  notes: string | null;
  acquired_from: string | null;
  acquired_date: string | null;
  created_at: string;
}

export function SampleDecantTracker() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    brand: "",
    name: "",
    size_ml: "",
    type: "sample",
    notes: "",
    acquired_from: "",
    acquired_date: "",
  });

  const { data: samples, isLoading } = useQuery({
    queryKey: ["samples-decants", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from("samples_decants")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SampleDecant[];
    },
    enabled: !!profile?.id,
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!profile?.id) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("samples_decants").insert({
        profile_id: profile.id,
        brand: data.brand,
        name: data.name,
        size_ml: parseFloat(data.size_ml),
        type: data.type,
        notes: data.notes || null,
        acquired_from: data.acquired_from || null,
        acquired_date: data.acquired_date || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples-decants"] });
      setIsDialogOpen(false);
      setFormData({
        brand: "",
        name: "",
        size_ml: "",
        type: "sample",
        notes: "",
        acquired_from: "",
        acquired_date: "",
      });
      toast.success("Sample added to your collection!");
    },
    onError: () => {
      toast.error("Failed to add sample");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("samples_decants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples-decants"] });
      toast.success("Sample removed");
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sample":
        return <TestTube className="h-4 w-4" />;
      case "decant":
        return <Droplet className="h-4 w-4" />;
      case "travel_spray":
        return <Package className="h-4 w-4" />;
      default:
        return <Droplet className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "sample":
        return "secondary";
      case "decant":
        return "default";
      case "travel_spray":
        return "outline";
      default:
        return "secondary";
    }
  };

  const totalMl = samples?.reduce((acc, s) => acc + Number(s.size_ml), 0) || 0;

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Please sign in to track your samples and decants.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Samples & Decants
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {samples?.length || 0} items • {totalMl.toFixed(1)}ml total
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Sample or Decant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., Dior"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Fragrance Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sauvage"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="size">Size (ml)</Label>
                  <Input
                    id="size"
                    type="number"
                    step="0.5"
                    value={formData.size_ml}
                    onChange={(e) => setFormData({ ...formData, size_ml: e.target.value })}
                    placeholder="e.g., 2"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sample">Sample</SelectItem>
                      <SelectItem value="decant">Decant</SelectItem>
                      <SelectItem value="travel_spray">Travel Spray</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="acquired_from">Acquired From</Label>
                <Input
                  id="acquired_from"
                  value={formData.acquired_from}
                  onChange={(e) => setFormData({ ...formData, acquired_from: e.target.value })}
                  placeholder="e.g., Trade with @user"
                />
              </div>
              <div>
                <Label htmlFor="acquired_date">Date Acquired</Label>
                <Input
                  id="acquired_date"
                  type="date"
                  value={formData.acquired_date}
                  onChange={(e) => setFormData({ ...formData, acquired_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any notes about this sample..."
                  rows={2}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => addMutation.mutate(formData)}
                disabled={!formData.brand || !formData.name || !formData.size_ml || addMutation.isPending}
              >
                {addMutation.isPending ? "Adding..." : "Add to Collection"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : !samples || samples.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TestTube className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No samples yet</p>
            <p className="text-sm">Add your first sample or decant!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {samples.map((sample) => (
              <div
                key={sample.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {getTypeIcon(sample.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{sample.name}</p>
                    <Badge variant={getTypeBadgeVariant(sample.type)}>
                      {sample.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sample.brand} • {sample.size_ml}ml
                    {sample.acquired_date && ` • ${format(new Date(sample.acquired_date), "MMM d, yyyy")}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate(sample.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
