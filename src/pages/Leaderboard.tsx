import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Package, Flame, Medal, Crown, TrendingUp, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Link } from "react-router-dom";

interface LeaderboardEntry {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  count: number;
}

interface UserRank {
  rank: number;
  count: number;
  percentile: number;
}

const Leaderboard = () => {
  const { profile } = useAuth();

  // Top traders (get all for ranking)
  const { data: allTraders, isLoading: loadingTraders } = useQuery({
    queryKey: ['leaderboard-traders-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('trust_scores')
        .select(`
          total_trades_completed,
          profile:profiles!trust_scores_profile_id_fkey(id, username, display_name, avatar_url)
        `)
        .order('total_trades_completed', { ascending: false });

      return data?.map(d => ({
        id: (d.profile as any).id,
        username: (d.profile as any).username,
        display_name: (d.profile as any).display_name,
        avatar_url: (d.profile as any).avatar_url,
        count: d.total_trades_completed,
      })) || [];
    },
  });

  // Top collectors (get all for ranking)
  const { data: allCollectors, isLoading: loadingCollectors } = useQuery({
    queryKey: ['leaderboard-collectors-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('collection_items')
        .select('profile_id, profiles!collection_items_profile_id_fkey(id, username, display_name, avatar_url)')
        .order('created_at', { ascending: false });

      const counts = new Map<string, { profile: any; count: number }>();
      data?.forEach(item => {
        const profileId = item.profile_id;
        if (counts.has(profileId)) {
          counts.get(profileId)!.count++;
        } else {
          counts.set(profileId, { profile: item.profiles, count: 1 });
        }
      });

      return Array.from(counts.entries())
        .map(([id, { profile, count }]) => ({
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          count,
        }))
        .sort((a, b) => b.count - a.count);
    },
  });

  // SOTD streaks (get all for ranking)
  const { data: allStreaks, isLoading: loadingStreaks } = useQuery({
    queryKey: ['leaderboard-streaks-all'],
    queryFn: async () => {
      const { data: allLogs } = await supabase
        .from('scent_logs')
        .select('profile_id, logged_date, profiles!scent_logs_profile_id_fkey(id, username, display_name, avatar_url)')
        .order('logged_date', { ascending: false });

      const userStreaks = new Map<string, { profile: any; streak: number }>();
      const logsByProfile = new Map<string, string[]>();
      
      allLogs?.forEach(log => {
        if (!logsByProfile.has(log.profile_id)) {
          logsByProfile.set(log.profile_id, []);
        }
        logsByProfile.get(log.profile_id)!.push(log.logged_date);
      });

      logsByProfile.forEach((dates, profileId) => {
        const profile = allLogs?.find(l => l.profile_id === profileId)?.profiles;
        if (!profile) return;

        const uniqueDates = [...new Set(dates)].sort().reverse();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let streak = 0;
        if (uniqueDates.length > 0) {
          const firstDate = new Date(uniqueDates[0]);
          firstDate.setHours(0, 0, 0, 0);

          if (firstDate.getTime() === today.getTime() || firstDate.getTime() === yesterday.getTime()) {
            streak = 1;
            let expectedDate = firstDate.getTime();

            for (let i = 1; i < uniqueDates.length; i++) {
              const checkDate = new Date(uniqueDates[i]);
              checkDate.setHours(0, 0, 0, 0);
              const prevDay = expectedDate - 86400000;
              
              if (checkDate.getTime() === prevDay) {
                streak++;
                expectedDate = prevDay;
              } else {
                break;
              }
            }
          }
        }

        userStreaks.set(profileId, { profile, streak });
      });

      return Array.from(userStreaks.entries())
        .map(([id, { profile, streak }]) => ({
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          count: streak,
        }))
        .sort((a, b) => b.count - a.count);
    },
  });

  const getUserRank = (data: LeaderboardEntry[] | undefined, profileId: string | undefined): UserRank | null => {
    if (!data || !profileId) return null;
    const index = data.findIndex(e => e.id === profileId);
    if (index === -1) return null;
    return {
      rank: index + 1,
      count: data[index].count,
      percentile: Math.round(((data.length - index) / data.length) * 100),
    };
  };

  const topTraders = allTraders?.slice(0, 10);
  const topCollectors = allCollectors?.slice(0, 10);
  const topStreaks = allStreaks?.filter(u => u.count > 0).slice(0, 10);

  const userTraderRank = getUserRank(allTraders, profile?.id);
  const userCollectorRank = getUserRank(allCollectors, profile?.id);
  const userStreakRank = getUserRank(allStreaks?.filter(u => u.count > 0), profile?.id);

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-muted-foreground">{rank + 1}</span>;
  };

  const UserRankCard = ({ 
    rank, 
    label, 
    suffix,
    icon: Icon,
    iconColor 
  }: { 
    rank: UserRank | null; 
    label: string;
    suffix: string;
    icon: any;
    iconColor: string;
  }) => {
    if (!rank || !profile) return null;

    return (
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-background ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">#{rank.rank}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Your score</p>
            <p className="font-semibold">{rank.count} {suffix}</p>
            <Badge variant="outline" className="mt-1">
              Top {100 - rank.percentile}%
            </Badge>
          </div>
        </div>
        {rank.rank <= 3 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-primary">
            <Trophy className="w-4 h-4" />
            <span>You're in the top 3!</span>
          </div>
        )}
      </div>
    );
  };

  const LeaderboardList = ({ 
    data, 
    loading, 
    suffix,
    currentUserId
  }: { 
    data?: LeaderboardEntry[]; 
    loading: boolean;
    suffix: string;
    currentUserId?: string;
  }) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    if (!data?.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No data yet. Be the first!
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {data.map((entry, index) => {
          const isCurrentUser = entry.id === currentUserId;
          return (
            <Link
              key={entry.id}
              to={`/profile/${entry.username}`}
              className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                isCurrentUser 
                  ? 'bg-primary/10 border border-primary/30 hover:bg-primary/20' 
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              <div className="flex-shrink-0 w-8 flex justify-center">
                {getRankIcon(index)}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.avatar_url || undefined} />
                <AvatarFallback>{entry.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {entry.display_name || entry.username}
                  {isCurrentUser && <span className="ml-2 text-xs text-primary">(You)</span>}
                </p>
                <p className="text-sm text-muted-foreground">@{entry.username}</p>
              </div>
              <Badge variant={isCurrentUser ? "default" : "secondary"} className="flex-shrink-0">
                {entry.count} {suffix}
              </Badge>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-serif font-bold mb-2">Leaderboard</h1>
            <p className="text-muted-foreground">
              Top performers in our fragrance community
            </p>
          </div>

          <Tabs defaultValue="traders" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6">
              <TabsTrigger value="traders" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Traders
              </TabsTrigger>
              <TabsTrigger value="collectors" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Collectors
              </TabsTrigger>
              <TabsTrigger value="streaks" className="flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Streaks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="traders" className="space-y-4">
              <UserRankCard 
                rank={userTraderRank} 
                label="Your Trading Rank"
                suffix="trades"
                icon={Trophy}
                iconColor="text-primary"
              />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Top Traders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LeaderboardList
                    data={topTraders}
                    loading={loadingTraders}
                    suffix="trades"
                    currentUserId={profile?.id}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="collectors" className="space-y-4">
              <UserRankCard 
                rank={userCollectorRank} 
                label="Your Collection Rank"
                suffix="items"
                icon={Package}
                iconColor="text-blue-500"
              />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Top Collectors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LeaderboardList
                    data={topCollectors}
                    loading={loadingCollectors}
                    suffix="items"
                    currentUserId={profile?.id}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="streaks" className="space-y-4">
              <UserRankCard 
                rank={userStreakRank} 
                label="Your Streak Rank"
                suffix="days"
                icon={Flame}
                iconColor="text-orange-500"
              />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Longest SOTD Streaks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LeaderboardList
                    data={topStreaks}
                    loading={loadingStreaks}
                    suffix="days"
                    currentUserId={profile?.id}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;