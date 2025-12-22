import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trophy, TrendingUp, Heart, Calendar, Star, 
  Sparkles, Award, Target, Flame, Gift
} from "lucide-react";
import { format, startOfYear, endOfYear, parseISO, differenceInDays, eachMonthOfInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface YearStats {
  totalScentLogs: number;
  uniqueFragrances: number;
  topFragrance: { name: string; brand: string; count: number } | null;
  topBrand: { brand: string; count: number } | null;
  longestStreak: number;
  currentStreak: number;
  collectionGrowth: number;
  wishlistCompleted: number;
  tradesCompleted: number;
  avgRating: number;
  topOccasion: string | null;
  topWeather: string | null;
  monthlyActivity: { month: string; count: number }[];
  topFragrances: { name: string; brand: string; count: number }[];
  favoriteSeasons: { season: string; count: number }[];
}

export const YearInReview = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['year-in-review', user?.id, selectedYear],
    queryFn: async (): Promise<YearStats> => {
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const yearStart = startOfYear(new Date(selectedYear, 0, 1));
      const yearEnd = endOfYear(new Date(selectedYear, 0, 1));

      // Fetch all scent logs for the year
      const { data: scentLogs } = await supabase
        .from('scent_logs')
        .select('*')
        .eq('profile_id', profile.id)
        .gte('logged_date', format(yearStart, 'yyyy-MM-dd'))
        .lte('logged_date', format(yearEnd, 'yyyy-MM-dd'))
        .order('logged_date', { ascending: true });

      // Calculate unique fragrances
      const uniqueFrags = new Map<string, { name: string; brand: string; count: number }>();
      const brandCounts = new Map<string, number>();
      const occasionCounts = new Map<string, number>();
      const weatherCounts = new Map<string, number>();
      let totalRating = 0;
      let ratingCount = 0;

      (scentLogs || []).forEach(log => {
        const key = `${log.fragrance_name}-${log.fragrance_brand}`;
        const existing = uniqueFrags.get(key);
        if (existing) {
          existing.count++;
        } else {
          uniqueFrags.set(key, { name: log.fragrance_name, brand: log.fragrance_brand, count: 1 });
        }

        brandCounts.set(log.fragrance_brand, (brandCounts.get(log.fragrance_brand) || 0) + 1);
        
        if (log.occasion) {
          occasionCounts.set(log.occasion, (occasionCounts.get(log.occasion) || 0) + 1);
        }
        if (log.weather) {
          weatherCounts.set(log.weather, (weatherCounts.get(log.weather) || 0) + 1);
        }
        if (log.rating) {
          totalRating += log.rating;
          ratingCount++;
        }
      });

      // Sort and get top fragrance
      const sortedFragrances = Array.from(uniqueFrags.values()).sort((a, b) => b.count - a.count);
      const topFragrance = sortedFragrances[0] || null;
      const topFragrances = sortedFragrances.slice(0, 5);

      // Get top brand
      const sortedBrands = Array.from(brandCounts.entries()).sort((a, b) => b[1] - a[1]);
      const topBrand = sortedBrands[0] ? { brand: sortedBrands[0][0], count: sortedBrands[0][1] } : null;

      // Get top occasion and weather
      const sortedOccasions = Array.from(occasionCounts.entries()).sort((a, b) => b[1] - a[1]);
      const topOccasion = sortedOccasions[0]?.[0] || null;

      const sortedWeather = Array.from(weatherCounts.entries()).sort((a, b) => b[1] - a[1]);
      const topWeather = sortedWeather[0]?.[0] || null;

      // Calculate streaks
      const sortedDates = (scentLogs || []).map(l => l.logged_date).sort();
      let longestStreak = 0;
      let currentStreak = 0;
      let tempStreak = 1;

      for (let i = 1; i < sortedDates.length; i++) {
        const diff = differenceInDays(parseISO(sortedDates[i]), parseISO(sortedDates[i - 1]));
        if (diff === 1) {
          tempStreak++;
        } else if (diff > 1) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      // Check current streak
      const today = new Date();
      const recentDates = sortedDates.slice(-30).reverse();
      for (let i = 0; i < recentDates.length; i++) {
        const diff = differenceInDays(today, parseISO(recentDates[i]));
        if (diff <= i + 1) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Monthly activity
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
      const monthlyActivity = months.map(month => {
        const monthStr = format(month, 'yyyy-MM');
        const count = (scentLogs || []).filter(l => l.logged_date.startsWith(monthStr)).length;
        return { month: format(month, 'MMM'), count };
      });

      // Collection growth (items added this year)
      const { count: collectionGrowth } = await supabase
        .from('collection_items')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id)
        .gte('created_at', yearStart.toISOString())
        .lte('created_at', yearEnd.toISOString());

      // Trades completed
      const { count: tradesCompleted } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .or(`initiator_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .eq('status', 'completed')
        .gte('created_at', yearStart.toISOString())
        .lte('created_at', yearEnd.toISOString());

      // Season preferences from scent logs
      const seasonCounts = new Map<string, number>();
      (scentLogs || []).forEach(log => {
        const month = parseInt(log.logged_date.split('-')[1]);
        let season = 'Spring';
        if (month >= 6 && month <= 8) season = 'Summer';
        else if (month >= 9 && month <= 11) season = 'Fall';
        else if (month === 12 || month <= 2) season = 'Winter';
        seasonCounts.set(season, (seasonCounts.get(season) || 0) + 1);
      });
      const favoriteSeasons = Array.from(seasonCounts.entries())
        .map(([season, count]) => ({ season, count }))
        .sort((a, b) => b.count - a.count);

      return {
        totalScentLogs: scentLogs?.length || 0,
        uniqueFragrances: uniqueFrags.size,
        topFragrance,
        topBrand,
        longestStreak: longestStreak || 1,
        currentStreak,
        collectionGrowth: collectionGrowth || 0,
        wishlistCompleted: 0, // Would need more tracking
        tradesCompleted: tradesCompleted || 0,
        avgRating: ratingCount > 0 ? totalRating / ratingCount : 0,
        topOccasion,
        topWeather,
        monthlyActivity,
        topFragrances,
        favoriteSeasons,
      };
    },
    enabled: !!user,
  });

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Sign in to see your Year in Review</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Your Year in Review</h2>
            <p className="text-muted-foreground">A look back at your fragrance journey</p>
          </div>
        </div>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{stats?.totalScentLogs || 0}</p>
            <p className="text-sm text-muted-foreground">Days Logged</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 mx-auto mb-2 text-accent" />
            <p className="text-3xl font-bold">{stats?.uniqueFragrances || 0}</p>
            <p className="text-sm text-muted-foreground">Fragrances Worn</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-primary/10 border-destructive/20">
          <CardContent className="p-4 text-center">
            <Flame className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p className="text-3xl font-bold">{stats?.longestStreak || 0}</p>
            <p className="text-sm text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-destructive/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <Gift className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{stats?.collectionGrowth || 0}</p>
            <p className="text-sm text-muted-foreground">Added to Collection</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Fragrance Highlight */}
      {stats?.topFragrance && (
        <Card className="overflow-hidden">
          <div className="gradient-primary p-6 text-primary-foreground">
            <div className="flex items-center gap-4">
              <Trophy className="h-12 w-12" />
              <div>
                <p className="text-sm opacity-90">Your Most Worn Fragrance of {selectedYear}</p>
                <h3 className="text-2xl font-bold">{stats.topFragrance.name}</h3>
                <p className="opacity-90">by {stats.topFragrance.brand} • Worn {stats.topFragrance.count} times</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.monthlyActivity || []}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Fragrances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top 5 Fragrances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topFragrances.map((frag, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Badge 
                    variant={idx === 0 ? "default" : "secondary"}
                    className="w-6 h-6 rounded-full p-0 flex items-center justify-center"
                  >
                    {idx + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{frag.name}</p>
                    <p className="text-xs text-muted-foreground">{frag.brand}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{frag.count}x</span>
                </div>
              ))}
              {(!stats?.topFragrances || stats.topFragrances.length === 0) && (
                <p className="text-muted-foreground text-center py-4">No fragrances logged yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        {stats?.topBrand && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Favorite Brand</p>
                  <p className="font-bold">{stats.topBrand.brand}</p>
                  <p className="text-xs text-muted-foreground">{stats.topBrand.count} wears</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stats?.topOccasion && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Top Occasion</p>
                  <p className="font-bold capitalize">{stats.topOccasion}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stats?.tradesCompleted > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Trades Completed</p>
                  <p className="font-bold">{stats.tradesCompleted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Season Distribution */}
      {stats?.favoriteSeasons && stats.favoriteSeasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Seasonal Wearing Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {['Spring', 'Summer', 'Fall', 'Winter'].map(season => {
                const data = stats.favoriteSeasons.find(s => s.season === season);
                const total = stats.favoriteSeasons.reduce((sum, s) => sum + s.count, 0);
                const percentage = data ? Math.round((data.count / total) * 100) : 0;
                
                return (
                  <div key={season} className="text-center">
                    <div className="text-2xl mb-1">
                      {season === 'Spring' && '🌸'}
                      {season === 'Summer' && '☀️'}
                      {season === 'Fall' && '🍂'}
                      {season === 'Winter' && '❄️'}
                    </div>
                    <p className="font-medium">{season}</p>
                    <p className="text-xl font-bold text-primary">{percentage}%</p>
                    <p className="text-xs text-muted-foreground">{data?.count || 0} wears</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
