import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { 
  Shuffle, 
  Eye, 
  EyeOff, 
  Sparkles,
  X,
  Check,
  Users
} from "lucide-react";
import { toast } from "sonner";

interface TradePreferences {
  id: string;
  preferred_brands: string[];
  preferred_notes: string[];
  avoid_notes: string[];
  min_value: number;
  max_value: number;
  blind_match_enabled: boolean;
}

interface PotentialMatch {
  profile_id: string;
  username: string;
  matchScore: number;
  commonBrands: string[];
  listingCount: number;
}

const POPULAR_NOTES = [
  "Bergamot", "Vanilla", "Oud", "Rose", "Sandalwood",
  "Leather", "Tobacco", "Amber", "Musk", "Citrus",
  "Jasmine", "Patchouli", "Vetiver", "Cedar", "Lavender"
];

const POPULAR_BRANDS = [
  "Dior", "Chanel", "Tom Ford", "Creed", "Maison Francis Kurkdjian",
  "Parfums de Marly", "Amouage", "Xerjoff", "Nishane", "Initio"
];

export function BlindTradeMatching() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [newBrand, setNewBrand] = useState("");
  const [newPreferredNote, setNewPreferredNote] = useState("");
  const [newAvoidNote, setNewAvoidNote] = useState("");

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["trade-preferences", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from("trade_preferences")
        .select("*")
        .eq("profile_id", profile.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as TradePreferences | null;
    },
    enabled: !!profile?.id,
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["blind-matches", profile?.id],
    queryFn: async () => {
      if (!profile?.id || !preferences?.blind_match_enabled) return [];
      
      // Get other users with blind matching enabled
      const { data: otherPrefs, error } = await supabase
        .from("trade_preferences")
        .select("profile_id, preferred_brands, preferred_notes")
        .eq("blind_match_enabled", true)
        .neq("profile_id", profile.id);

      if (error) throw error;

      // Get profiles for these users
      const profileIds = otherPrefs?.map(p => p.profile_id) || [];
      if (profileIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", profileIds);

      const { data: listings } = await supabase
        .from("listings")
        .select("owner_id, brand")
        .eq("is_active", true)
        .in("owner_id", profileIds);

      // Calculate match scores
      const matches: PotentialMatch[] = (otherPrefs || []).map(pref => {
        const userProfile = profiles?.find(p => p.id === pref.profile_id);
        const userListings = listings?.filter(l => l.owner_id === pref.profile_id) || [];
        
        // Calculate common brands
        const myBrands = new Set(preferences?.preferred_brands || []);
        const theirBrands = new Set(pref.preferred_brands || []);
        const commonBrands = [...myBrands].filter(b => theirBrands.has(b));

        // Calculate common notes
        const myNotes = new Set(preferences?.preferred_notes || []);
        const theirNotes = new Set(pref.preferred_notes || []);
        const commonNotes = [...myNotes].filter(n => theirNotes.has(n));

        // Score based on overlap
        const brandScore = commonBrands.length * 20;
        const noteScore = commonNotes.length * 10;
        const listingBonus = Math.min(userListings.length * 5, 25);
        
        return {
          profile_id: pref.profile_id,
          username: userProfile?.username || "Unknown",
          matchScore: Math.min(brandScore + noteScore + listingBonus, 100),
          commonBrands,
          listingCount: userListings.length,
        };
      }).filter(m => m.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);

      return matches;
    },
    enabled: !!profile?.id && !!preferences?.blind_match_enabled,
  });

  const saveMutation = useMutation({
    mutationFn: async (updates: Partial<TradePreferences>) => {
      if (!profile?.id) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("trade_preferences")
        .upsert({
          profile_id: profile.id,
          ...preferences,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trade-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["blind-matches"] });
      toast.success("Preferences saved!");
    },
    onError: () => {
      toast.error("Failed to save preferences");
    },
  });

  const addBrand = () => {
    if (newBrand && !preferences?.preferred_brands?.includes(newBrand)) {
      saveMutation.mutate({
        preferred_brands: [...(preferences?.preferred_brands || []), newBrand],
      });
      setNewBrand("");
    }
  };

  const removeBrand = (brand: string) => {
    saveMutation.mutate({
      preferred_brands: (preferences?.preferred_brands || []).filter(b => b !== brand),
    });
  };

  const addPreferredNote = () => {
    if (newPreferredNote && !preferences?.preferred_notes?.includes(newPreferredNote)) {
      saveMutation.mutate({
        preferred_notes: [...(preferences?.preferred_notes || []), newPreferredNote],
      });
      setNewPreferredNote("");
    }
  };

  const removePreferredNote = (note: string) => {
    saveMutation.mutate({
      preferred_notes: (preferences?.preferred_notes || []).filter(n => n !== note),
    });
  };

  const addAvoidNote = () => {
    if (newAvoidNote && !preferences?.avoid_notes?.includes(newAvoidNote)) {
      saveMutation.mutate({
        avoid_notes: [...(preferences?.avoid_notes || []), newAvoidNote],
      });
      setNewAvoidNote("");
    }
  };

  const removeAvoidNote = (note: string) => {
    saveMutation.mutate({
      avoid_notes: (preferences?.avoid_notes || []).filter(n => n !== note),
    });
  };

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Please sign in to use blind trade matching.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Blind Trade Matching
              </CardTitle>
              <CardDescription>
                Get matched with traders based on your preferences
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {preferences?.blind_match_enabled ? (
                <Eye className="h-4 w-4 text-green-500" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                checked={preferences?.blind_match_enabled || false}
                onCheckedChange={(checked) => saveMutation.mutate({ blind_match_enabled: checked })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preferred Brands */}
          <div>
            <Label className="text-sm font-medium">Preferred Brands</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Add a brand..."
                list="brand-suggestions"
                onKeyPress={(e) => e.key === "Enter" && addBrand()}
              />
              <datalist id="brand-suggestions">
                {POPULAR_BRANDS.map(b => <option key={b} value={b} />)}
              </datalist>
              <Button onClick={addBrand} size="sm">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {(preferences?.preferred_brands || []).map((brand) => (
                <Badge key={brand} variant="secondary" className="gap-1">
                  {brand}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeBrand(brand)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Preferred Notes */}
          <div>
            <Label className="text-sm font-medium">Notes You Love</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newPreferredNote}
                onChange={(e) => setNewPreferredNote(e.target.value)}
                placeholder="Add a note..."
                list="note-suggestions"
                onKeyPress={(e) => e.key === "Enter" && addPreferredNote()}
              />
              <datalist id="note-suggestions">
                {POPULAR_NOTES.map(n => <option key={n} value={n} />)}
              </datalist>
              <Button onClick={addPreferredNote} size="sm">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {(preferences?.preferred_notes || []).map((note) => (
                <Badge key={note} variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  {note}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removePreferredNote(note)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes to Avoid */}
          <div>
            <Label className="text-sm font-medium">Notes to Avoid</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newAvoidNote}
                onChange={(e) => setNewAvoidNote(e.target.value)}
                placeholder="Add a note to avoid..."
                list="note-suggestions"
                onKeyPress={(e) => e.key === "Enter" && addAvoidNote()}
              />
              <Button onClick={addAvoidNote} size="sm" variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {(preferences?.avoid_notes || []).map((note) => (
                <Badge key={note} variant="destructive" className="gap-1">
                  {note}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeAvoidNote(note)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Value Range */}
          <div>
            <Label className="text-sm font-medium">
              Trade Value Range: ${preferences?.min_value || 0} - ${preferences?.max_value || 1000}
            </Label>
            <div className="pt-4 px-2">
              <Slider
                value={[preferences?.min_value || 0, preferences?.max_value || 1000]}
                onValueChange={([min, max]) => saveMutation.mutate({ min_value: min, max_value: max })}
                max={1000}
                step={25}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches */}
      {preferences?.blind_match_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matchesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : !matches || matches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No matches yet</p>
                <p className="text-sm">Add more preferences to find matches!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <div
                    key={match.profile_id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {match.matchScore}%
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">@{match.username}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.commonBrands.slice(0, 3).map((brand) => (
                          <Badge key={brand} variant="outline" className="text-xs">
                            {brand}
                          </Badge>
                        ))}
                        <span className="text-xs text-muted-foreground">
                          {match.listingCount} active listings
                        </span>
                      </div>
                    </div>
                    <Button size="sm">View Profile</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
