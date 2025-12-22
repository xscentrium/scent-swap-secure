import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, Clock, Cloud, Star } from "lucide-react";
import { format, subMonths, getDay } from "date-fns";

export const UsagePatterns = () => {
  const { profile } = useAuth();

  const { data: scentLogs, isLoading } = useQuery({
    queryKey: ['scent-usage-patterns', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const startDate = subMonths(new Date(), 6);
      
      const { data } = await supabase
        .from('scent_logs')
        .select('*')
        .eq('profile_id', profile.id)
        .gte('logged_date', startDate.toISOString().split('T')[0])
        .order('logged_date', { ascending: true });

      return data || [];
    },
    enabled: !!profile?.id,
  });

  if (!profile) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-serif">Usage Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!scentLogs || scentLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-serif">Usage Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Log your daily fragrances to see usage patterns</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Day of week distribution
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayData = dayNames.map((name, index) => ({
    name,
    count: scentLogs.filter(log => getDay(new Date(log.logged_date)) === index).length
  }));

  // Most worn fragrances
  const fragranceCounts = scentLogs.reduce((acc, log) => {
    const key = `${log.fragrance_brand} ${log.fragrance_name}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topFragrances = Object.entries(fragranceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Occasion breakdown
  const occasionCounts = scentLogs.reduce((acc, log) => {
    const occasion = log.occasion || 'Not specified';
    acc[occasion] = (acc[occasion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const occasionData = Object.entries(occasionCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Weather preferences
  const weatherCounts = scentLogs.reduce((acc, log) => {
    const weather = log.weather || 'Not specified';
    acc[weather] = (acc[weather] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const weatherData = Object.entries(weatherCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  // Average rating
  const ratedLogs = scentLogs.filter(log => log.rating);
  const avgRating = ratedLogs.length > 0 
    ? ratedLogs.reduce((sum, log) => sum + (log.rating || 0), 0) / ratedLogs.length 
    : 0;

  const COLORS = ['hsl(32, 88%, 48%)', 'hsl(38, 92%, 58%)', 'hsl(28, 60%, 45%)', 'hsl(32, 70%, 60%)', 'hsl(38, 80%, 50%)'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-serif">Usage Patterns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-xl font-bold">{scentLogs.length}</div>
            <div className="text-xs text-muted-foreground">Days Logged</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <Star className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-xl font-bold">{avgRating.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Avg Rating</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-xl font-bold">{Object.keys(fragranceCounts).length}</div>
            <div className="text-xs text-muted-foreground">Unique Scents</div>
          </div>
        </div>

        {/* Day of Week Distribution */}
        <div>
          <h3 className="text-sm font-medium mb-3">Usage by Day</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={dayData}>
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis hide />
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

        {/* Top Fragrances */}
        {topFragrances.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">Most Worn</h3>
            <div className="space-y-2">
              {topFragrances.map((frag, index) => (
                <div key={frag.name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                    {index + 1}
                  </div>
                  <span className="flex-1 truncate text-sm">{frag.name}</span>
                  <span className="text-sm text-muted-foreground">{frag.count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Occasion & Weather */}
        <div className="grid grid-cols-2 gap-4">
          {occasionData.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">By Occasion</h3>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie
                    data={occasionData.slice(0, 4)}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={40}
                    dataKey="value"
                  >
                    {occasionData.slice(0, 4).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {weatherData.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">By Weather</h3>
              <div className="space-y-1">
                {weatherData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <Cloud className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate flex-1">{item.name}</span>
                    <span className="text-muted-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
