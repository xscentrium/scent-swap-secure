import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Ban, Loader2, UserX } from "lucide-react";
import { Link } from "react-router-dom";

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function BlockedUsersManager() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const { data: blockedUsers, isLoading } = useQuery({
    queryKey: ["blocked-users", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from("user_blocks")
        .select(`
          id, blocked_id, created_at,
          profile:profiles!user_blocks_blocked_id_fkey(username, display_name, avatar_url)
        `)
        .eq("blocker_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as BlockedUser[];
    },
    enabled: !!profile?.id,
  });

  const handleUnblock = async (blockId: string, username: string) => {
    setUnblocking(blockId);
    
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("id", blockId);

    if (error) {
      toast.error("Failed to unblock user");
    } else {
      toast.success(`Unblocked @${username}`);
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
    }
    
    setUnblocking(null);
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5" />
            Blocked Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ban className="w-5 h-5" />
          Blocked Users
        </CardTitle>
        <CardDescription>
          Blocked users can't message you or see your activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {blockedUsers && blockedUsers.length > 0 ? (
          <div className="space-y-3">
            {blockedUsers.map((block) => (
              <div key={block.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Link to={`/profile/${block.profile.username}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={block.profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {block.profile.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {block.profile.display_name || block.profile.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{block.profile.username}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(block.id, block.profile.username)}
                  disabled={unblocking === block.id}
                >
                  {unblocking === block.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Unblock"
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <UserX className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No blocked users</p>
            <p className="text-sm">Users you block will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}