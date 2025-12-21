import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Package, Award, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  tradeCount: number;
  collectionSize: number;
  badgesEarned: number;
  sotdStreak: number;
}

export const StatsDashboard = () => {
  const { profile } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-stats', profile?.id],
    queryFn: async (): Promise<Stats> => {
      if (!profile?.id) throw new Error('No profile');

      // Fetch all stats in parallel
      const [tradesResult, collectionResult, badgesResult, scentLogsResult] = await Promise.all([
        supabase
          .from('trades')
          .select('id', { count: 'exact' })
          .or(`initiator_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
          .eq('status', 'completed'),
        supabase
          .from('collection_items')
          .select('id', { count: 'exact' })
          .eq('profile_id', profile.id),
        supabase
          .from('user_badges')
          .select('id', { count: 'exact' })
          .eq('profile_id', profile.id),
        supabase
          .from('scent_logs')
          .select('logged_date')
          .eq('profile_id', profile.id)
          .order('logged_date', { ascending: false })
          .limit(365)
      ]);

      // Calculate SOTD streak
      let streak = 0;
      if (scentLogsResult.data && scentLogsResult.data.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dates = scentLogsResult.data.map(log => {
          const d = new Date(log.logged_date);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        });
        
        // Remove duplicates and sort descending
        const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
        
        // Check if today or yesterday has an entry (streak can start from either)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (uniqueDates[0] === today.getTime() || uniqueDates[0] === yesterday.getTime()) {
          streak = 1;
          let expectedDate = uniqueDates[0];
          
          for (let i = 1; i < uniqueDates.length; i++) {
            const prevDay = expectedDate - 86400000; // 24 hours in ms
            if (uniqueDates[i] === prevDay) {
              streak++;
              expectedDate = prevDay;
            } else {
              break;
            }
          }
        }
      }

      return {
        tradeCount: tradesResult.count || 0,
        collectionSize: collectionResult.count || 0,
        badgesEarned: badgesResult.count || 0,
        sotdStreak: streak
      };
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  if (!profile) return null;

  const statItems = [
    {
      label: "Trades Completed",
      value: stats?.tradeCount ?? 0,
      icon: TrendingUp,
      color: "text-emerald-500"
    },
    {
      label: "Collection Size",
      value: stats?.collectionSize ?? 0,
      icon: Package,
      color: "text-blue-500"
    },
    {
      label: "Badges Earned",
      value: stats?.badgesEarned ?? 0,
      icon: Award,
      color: "text-amber-500"
    },
    {
      label: "SOTD Streak",
      value: stats?.sotdStreak ?? 0,
      icon: Flame,
      color: "text-orange-500",
      suffix: stats?.sotdStreak === 1 ? " day" : " days"
    }
  ];

  return (
    <section className="py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-serif font-bold text-center mb-6">Your Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((item) => (
            <Card key={item.label} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 text-center">
                <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-2`} />
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mx-auto mb-1" />
                ) : (
                  <div className="text-3xl font-bold">
                    {item.value}{item.suffix || ''}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">{item.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
