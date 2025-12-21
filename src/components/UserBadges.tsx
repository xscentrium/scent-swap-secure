import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  Star, 
  Package, 
  ArrowLeftRight,
  Shield,
  Sparkles,
  Award,
  Crown
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UserBadge {
  id: string;
  badge_type: string;
  badge_name: string;
  earned_at: string;
}

const BADGE_CONFIG: Record<string, { icon: React.ReactNode; color: string; description: string }> = {
  first_trade: {
    icon: <ArrowLeftRight className="h-5 w-5" />,
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    description: "Completed your first trade",
  },
  trade_veteran: {
    icon: <Shield className="h-5 w-5" />,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    description: "Completed 10 trades",
  },
  trade_master: {
    icon: <Crown className="h-5 w-5" />,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    description: "Completed 50 trades",
  },
  reviewer: {
    icon: <Star className="h-5 w-5" />,
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    description: "Posted 5 reviews",
  },
  expert_reviewer: {
    icon: <Award className="h-5 w-5" />,
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    description: "Posted 25 reviews",
  },
  collector: {
    icon: <Package className="h-5 w-5" />,
    color: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    description: "Added 10 fragrances to collection",
  },
  connoisseur: {
    icon: <Sparkles className="h-5 w-5" />,
    color: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    description: "Added 50 fragrances to collection",
  },
};

// All possible badges for showing locked ones
const ALL_BADGES = [
  "first_trade",
  "trade_veteran", 
  "trade_master",
  "reviewer",
  "expert_reviewer",
  "collector",
  "connoisseur",
];

interface UserBadgesProps {
  profileId?: string;
  showLocked?: boolean;
}

export function UserBadges({ profileId, showLocked = true }: UserBadgesProps) {
  const { profile } = useAuth();
  const targetProfileId = profileId || profile?.id;

  const { data: badges, isLoading } = useQuery({
    queryKey: ["user-badges", targetProfileId],
    queryFn: async () => {
      if (!targetProfileId) return [];
      
      const { data, error } = await supabase
        .from("user_badges")
        .select("*")
        .eq("profile_id", targetProfileId)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!targetProfileId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedBadgeTypes = new Set(badges?.map((b) => b.badge_type) || []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Achievements
          {badges && badges.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {badges.length} earned
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ALL_BADGES.map((badgeType) => {
            const isEarned = earnedBadgeTypes.has(badgeType);
            const badge = badges?.find((b) => b.badge_type === badgeType);
            const config = BADGE_CONFIG[badgeType];

            if (!showLocked && !isEarned) return null;

            return (
              <div
                key={badgeType}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  isEarned
                    ? `${config.color} border-current`
                    : "bg-muted/30 text-muted-foreground border-muted opacity-50"
                }`}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`p-2 rounded-full ${isEarned ? "bg-current/10" : "bg-muted"}`}>
                    {config.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {BADGE_CONFIG[badgeType]?.description.split(" ").slice(0, 2).join(" ") || badgeType}
                    </p>
                    <p className="text-xs opacity-75 mt-1">
                      {isEarned && badge
                        ? formatDistanceToNow(new Date(badge.earned_at), { addSuffix: true })
                        : config.description}
                    </p>
                  </div>
                </div>
                {!isEarned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                    <span className="text-2xl">🔒</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
