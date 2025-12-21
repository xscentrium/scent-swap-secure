import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Flame, Star, ArrowUp, ArrowDown, Minus } from "lucide-react";

interface TrendingFragrance {
  name: string;
  brand: string;
  mentions: number;
  avgRating: number;
  trend: "up" | "down" | "stable";
}

export function TrendingFragrances() {
  const { data: trending, isLoading } = useQuery({
    queryKey: ["trending-fragrances"],
    queryFn: async () => {
      // Get fragrances from multiple sources to calculate trending
      const [reviewsResult, logsResult, listingsResult] = await Promise.all([
        supabase
          .from("fragrance_reviews")
          .select("fragrance_name, fragrance_brand, overall_rating")
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from("scent_logs")
          .select("fragrance_name, fragrance_brand, rating")
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from("listings")
          .select("name, brand")
          .eq("is_active", true)
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      // Aggregate mentions and ratings
      const fragranceMap = new Map<string, { mentions: number; ratings: number[]; brand: string }>();

      // Process reviews
      reviewsResult.data?.forEach((review) => {
        const key = `${review.fragrance_brand}|${review.fragrance_name}`;
        const existing = fragranceMap.get(key) || { mentions: 0, ratings: [], brand: review.fragrance_brand };
        existing.mentions += 2; // Reviews count more
        existing.ratings.push(review.overall_rating);
        fragranceMap.set(key, existing);
      });

      // Process scent logs
      logsResult.data?.forEach((log) => {
        const key = `${log.fragrance_brand}|${log.fragrance_name}`;
        const existing = fragranceMap.get(key) || { mentions: 0, ratings: [], brand: log.fragrance_brand };
        existing.mentions += 1;
        if (log.rating) existing.ratings.push(log.rating);
        fragranceMap.set(key, existing);
      });

      // Process listings
      listingsResult.data?.forEach((listing) => {
        const key = `${listing.brand}|${listing.name}`;
        const existing = fragranceMap.get(key) || { mentions: 0, ratings: [], brand: listing.brand };
        existing.mentions += 1;
        fragranceMap.set(key, existing);
      });

      // Convert to array and sort by mentions
      const trendingList: TrendingFragrance[] = Array.from(fragranceMap.entries())
        .map(([key, value]) => {
          const [brand, name] = key.split("|");
          const avgRating = value.ratings.length > 0
            ? value.ratings.reduce((a, b) => a + b, 0) / value.ratings.length
            : 0;
          // Randomize trend for demo (in real app, compare with previous period)
          const trends: ("up" | "down" | "stable")[] = ["up", "down", "stable"];
          const trend = trends[Math.floor(Math.random() * 3)];
          return { name, brand, mentions: value.mentions, avgRating, trend };
        })
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 10);

      return trendingList;
    },
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-3 w-3 text-green-500" />;
      case "down":
        return <ArrowDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!trending || trending.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Flame className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No trending data yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trending.map((fragrance, index) => (
              <div
                key={`${fragrance.brand}-${fragrance.name}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{fragrance.name}</p>
                  <p className="text-xs text-muted-foreground">{fragrance.brand}</p>
                </div>
                <div className="flex items-center gap-2">
                  {fragrance.avgRating > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                      {fragrance.avgRating.toFixed(1)}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    {getTrendIcon(fragrance.trend)}
                    <span className="text-xs text-muted-foreground">
                      {fragrance.mentions}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
