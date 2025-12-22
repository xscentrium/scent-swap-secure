import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, BellOff, Loader2 } from "lucide-react";

interface CreatorNotifyButtonProps {
  creatorId: string;
  creatorUsername: string;
}

export function CreatorNotifyButton({ creatorId, creatorUsername }: CreatorNotifyButtonProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const { data: isSubscribed } = useQuery({
    queryKey: ["creator-subscription", profile?.id, creatorId],
    queryFn: async () => {
      if (!profile?.id) return false;
      const { data } = await supabase
        .from("creator_subscriptions")
        .select("id")
        .eq("subscriber_id", profile.id)
        .eq("creator_id", creatorId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!profile?.id && profile?.id !== creatorId,
  });

  const handleToggle = async () => {
    if (!profile?.id) {
      toast.error("Please sign in to get notifications");
      return;
    }

    setIsLoading(true);

    if (isSubscribed) {
      const { error } = await supabase
        .from("creator_subscriptions")
        .delete()
        .eq("subscriber_id", profile.id)
        .eq("creator_id", creatorId);

      if (error) {
        toast.error("Failed to turn off notifications");
      } else {
        toast.success(`Notifications off for @${creatorUsername}`);
        queryClient.invalidateQueries({ queryKey: ["creator-subscription", profile.id, creatorId] });
      }
    } else {
      const { error } = await supabase.from("creator_subscriptions").insert({
        subscriber_id: profile.id,
        creator_id: creatorId,
      });

      if (error) {
        toast.error("Failed to turn on notifications");
      } else {
        toast.success(`You'll be notified when @${creatorUsername} posts`);
        queryClient.invalidateQueries({ queryKey: ["creator-subscription", profile.id, creatorId] });
      }
    }

    setIsLoading(false);
  };

  if (!user || profile?.id === creatorId) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      title={isSubscribed ? "Turn off post notifications" : "Turn on post notifications"}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4 fill-primary text-primary" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
    </Button>
  );
}