import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CalendarDays, 
  Plus, 
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface ScheduledFragrance {
  id: string;
  scheduled_date: string;
  fragrance_name: string;
  fragrance_brand: string;
  occasion: string | null;
  notes: string | null;
  is_worn: boolean;
}

const OCCASIONS = [
  "Work",
  "Date Night",
  "Casual",
  "Special Event",
  "Gym",
  "Night Out",
  "Meeting",
  "Travel",
];

export function FragranceCalendar() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    fragrance_name: "",
    fragrance_brand: "",
    occasion: "",
    notes: "",
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: scheduled, isLoading } = useQuery({
    queryKey: ["scheduled-fragrances", profile?.id, format(monthStart, "yyyy-MM")],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from("scheduled_fragrances")
        .select("*")
        .eq("profile_id", profile.id)
        .gte("scheduled_date", format(monthStart, "yyyy-MM-dd"))
        .lte("scheduled_date", format(monthEnd, "yyyy-MM-dd"))
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      return data as ScheduledFragrance[];
    },
    enabled: !!profile?.id,
  });

  const { data: collection } = useQuery({
    queryKey: ["collection-for-calendar", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from("collection_items")
        .select("name, brand")
        .eq("profile_id", profile.id)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const scheduledByDate = useMemo(() => {
    const map = new Map<string, ScheduledFragrance>();
    scheduled?.forEach((s) => {
      map.set(s.scheduled_date, s);
    });
    return map;
  }, [scheduled]);

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData & { date: Date }) => {
      if (!profile?.id) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("scheduled_fragrances").upsert({
        profile_id: profile.id,
        scheduled_date: format(data.date, "yyyy-MM-dd"),
        fragrance_name: data.fragrance_name,
        fragrance_brand: data.fragrance_brand,
        occasion: data.occasion || null,
        notes: data.notes || null,
      }, { onConflict: "profile_id,scheduled_date" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-fragrances"] });
      setIsDialogOpen(false);
      setFormData({ fragrance_name: "", fragrance_brand: "", occasion: "", notes: "" });
      toast.success("Fragrance scheduled!");
    },
    onError: () => {
      toast.error("Failed to schedule fragrance");
    },
  });

  const markWornMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("scheduled_fragrances")
        .update({ is_worn: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-fragrances"] });
      toast.success("Marked as worn!");
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    const existing = scheduledByDate.get(format(date, "yyyy-MM-dd"));
    if (existing) {
      setFormData({
        fragrance_name: existing.fragrance_name,
        fragrance_brand: existing.fragrance_brand,
        occasion: existing.occasion || "",
        notes: existing.notes || "",
      });
    } else {
      setFormData({ fragrance_name: "", fragrance_brand: "", occasion: "", notes: "" });
    }
    setIsDialogOpen(true);
  };

  const handleCollectionSelect = (value: string) => {
    const item = collection?.find((c) => `${c.brand} - ${c.name}` === value);
    if (item) {
      setFormData({ ...formData, fragrance_name: item.name, fragrance_brand: item.brand });
    }
  };

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Please sign in to use the fragrance calendar.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Fragrance Calendar
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md border w-full"
              modifiers={{
                scheduled: (date) => scheduledByDate.has(format(date, "yyyy-MM-dd")),
                worn: (date) => {
                  const s = scheduledByDate.get(format(date, "yyyy-MM-dd"));
                  return s?.is_worn ?? false;
                },
              }}
              modifiersClassNames={{
                scheduled: "bg-primary/20 font-bold text-primary",
                worn: "bg-green-500/20 text-green-700",
              }}
            />

            {/* Upcoming Schedule */}
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">This Month's Schedule</h3>
              {!scheduled || scheduled.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No fragrances scheduled</p>
                  <p className="text-xs">Click on a date to plan your scent</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {scheduled.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        item.is_worn ? "bg-green-500/10" : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {format(new Date(item.scheduled_date), "MMM d")}
                          </span>
                          {item.occasion && (
                            <Badge variant="outline" className="text-xs">
                              {item.occasion}
                            </Badge>
                          )}
                          {item.is_worn && (
                            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700">
                              <Check className="h-3 w-3 mr-1" />
                              Worn
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm truncate">
                          {item.fragrance_brand} - {item.fragrance_name}
                        </p>
                      </div>
                      {!item.is_worn && isSameDay(new Date(item.scheduled_date), new Date()) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markWornMutation.mutate(item.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Mark Worn
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedDate && `Schedule for ${format(selectedDate, "MMMM d, yyyy")}`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {collection && collection.length > 0 && (
                <div>
                  <Label>From Your Collection</Label>
                  <Select onValueChange={handleCollectionSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select from collection..." />
                    </SelectTrigger>
                    <SelectContent>
                      {collection.map((item) => (
                        <SelectItem key={`${item.brand}-${item.name}`} value={`${item.brand} - ${item.name}`}>
                          {item.brand} - {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.fragrance_brand}
                    onChange={(e) => setFormData({ ...formData, fragrance_brand: e.target.value })}
                    placeholder="e.g., Dior"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Fragrance Name</Label>
                  <Input
                    id="name"
                    value={formData.fragrance_name}
                    onChange={(e) => setFormData({ ...formData, fragrance_name: e.target.value })}
                    placeholder="e.g., Sauvage"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="occasion">Occasion</Label>
                <Select
                  value={formData.occasion}
                  onValueChange={(value) => setFormData({ ...formData, occasion: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select occasion..." />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCASIONS.map((occ) => (
                      <SelectItem key={occ} value={occ}>
                        {occ}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any notes for this day..."
                  rows={2}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => selectedDate && addMutation.mutate({ ...formData, date: selectedDate })}
                disabled={!formData.fragrance_name || !formData.fragrance_brand || addMutation.isPending}
              >
                {addMutation.isPending ? "Saving..." : "Save Schedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
