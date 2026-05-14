import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

type Mode = "followers" | "following";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profileId: string;
  mode: Mode;
}

export function FollowListDialog({ open, onOpenChange, profileId, mode }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["follow-list", profileId, mode],
    enabled: open && !!profileId,
    queryFn: async () => {
      const col = mode === "followers" ? "follower_id" : "following_id";
      const filter = mode === "followers" ? "following_id" : "follower_id";
      const { data: rows } = await supabase
        .from("follows")
        .select(`${col}`)
        .eq(filter, profileId);
      const ids = (rows ?? []).map((r: any) => r[col]);
      if (ids.length === 0) return [];
      const { data: profs } = await supabase
        .from("public_profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", ids);
      return profs ?? [];
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">{mode}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No {mode} yet.</p>
          ) : (
            data.map((p: any) => (
              <Link
                key={p.id}
                to={`/profile/${p.username}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={p.avatar_url ?? undefined} />
                  <AvatarFallback>{(p.display_name || p.username || "?").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.display_name || p.username}</p>
                  <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
