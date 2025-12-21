import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Package, Flame, Medal, Crown } from "lucide-react";
import { Link } from "react-router-dom";

interface LeaderboardEntry {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  count: number;
}

const Leaderboard = () => {
  // Top traders
  const { data: topTraders, isLoading: loadingTraders } = useQuery({
    queryKey: ['leaderboard-traders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('trust_scores')
        .select(`
          total_trades_completed,
          profile:profiles!trust_scores_profile_id_fkey(id, username, display_name, avatar_url)
        `)
        .order('total_trades_completed', { ascending: false })
        .limit(10);

      return data?.map(d => ({
        id: (d.profile as any).id,
        username: (d.profile as any).username,
        display_name: (d.profile as any).display_name,
        avatar_url: (d.profile as any).avatar_url,
        count: d.total_trades_completed,
      })) || [];
    },
  });

  // Top collectors
  const { data: topCollectors, isLoading: loadingCollectors } = useQuery({
    queryKey: ['leaderboard-collectors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('collection_items')
        .select('profile_id, profiles!collection_items_profile_id_fkey(id, username, display_name, avatar_url)')
        .order('created_at', { ascending: false });

      // Group by profile and count
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
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  });

  // SOTD streaks
  const { data: topStreaks, isLoading: loadingStreaks } = useQuery({
    queryKey: ['leaderboard-streaks'],
    queryFn: async () => {
      const { data: allLogs } = await supabase
        .from('scent_logs')
        .select('profile_id, logged_date, profiles!scent_logs_profile_id_fkey(id, username, display_name, avatar_url)')
        .order('logged_date', { ascending: false });

      // Calculate streaks per user
      const userStreaks = new Map<string, { profile: any; streak: number }>();
      
      // Group logs by profile
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
        .filter(u => u.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  });

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-muted-foreground">{rank + 1}</span>;
  };

  const LeaderboardList = ({ 
    data, 
    loading, 
    suffix 
  }: { 
    data?: LeaderboardEntry[]; 
    loading: boolean;
    suffix: string;
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
        {data.map((entry, index) => (
          <Link
            key={entry.id}
            to={`/profile/${entry.username}`}
            className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
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
              </p>
              <p className="text-sm text-muted-foreground">@{entry.username}</p>
            </div>
            <Badge variant="secondary" className="flex-shrink-0">
              {entry.count} {suffix}
            </Badge>
          </Link>
        ))}
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

            <TabsContent value="traders">
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
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="collectors">
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
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="streaks">
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