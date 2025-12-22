import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface FollowButtonProps {
  targetProfileId: string;
  targetUsername: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
}

export function FollowButton({
  targetProfileId,
  targetUsername,
  variant = "default",
  size = "default",
  showIcon = true,
}: FollowButtonProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);

  const { data: isFollowing } = useQuery({
    queryKey: ["is-following", profile?.id, targetProfileId],
    queryFn: async () => {
      if (!profile?.id) return false;
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", profile.id)
        .eq("following_id", targetProfileId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!profile?.id && profile?.id !== targetProfileId,
  });

  const handleFollow = async () => {
    if (!profile?.id) {
      toast.error("Please sign in to follow users");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.from("follows").insert({
      follower_id: profile.id,
      following_id: targetProfileId,
    });

    if (error) {
      toast.error("Failed to follow user");
    } else {
      toast.success(`Following @${targetUsername}`);
      queryClient.invalidateQueries({ queryKey: ["is-following", profile.id, targetProfileId] });
      queryClient.invalidateQueries({ queryKey: ["followers-count"] });
      queryClient.invalidateQueries({ queryKey: ["following-count"] });
      queryClient.invalidateQueries({ queryKey: ["followed-users"] });
    }
    setIsLoading(false);
  };

  const handleUnfollow = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", profile.id)
      .eq("following_id", targetProfileId);

    if (error) {
      toast.error("Failed to unfollow user");
    } else {
      toast.success(`Unfollowed @${targetUsername}`);
      queryClient.invalidateQueries({ queryKey: ["is-following", profile.id, targetProfileId] });
      queryClient.invalidateQueries({ queryKey: ["followers-count"] });
      queryClient.invalidateQueries({ queryKey: ["following-count"] });
      queryClient.invalidateQueries({ queryKey: ["followed-users"] });
    }
    setShowUnfollowDialog(false);
    setIsLoading(false);
  };

  if (!user || profile?.id === targetProfileId) {
    return null;
  }

  return (
    <>
      <Button
        variant={isFollowing ? "outline" : variant}
        size={size}
        onClick={isFollowing ? () => setShowUnfollowDialog(true) : handleFollow}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <>
            {showIcon && <UserCheck className="w-4 h-4 mr-2" />}
            Following
          </>
        ) : (
          <>
            {showIcon && <UserPlus className="w-4 h-4 mr-2" />}
            Follow
          </>
        )}
      </Button>

      <AlertDialog open={showUnfollowDialog} onOpenChange={setShowUnfollowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unfollow @{targetUsername}?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer see their SOTD picks, trades, and collection updates in your feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnfollow} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Unfollow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}