import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Search, TrendingUp, Calendar, Filter, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";

interface SearchAnalyticsData {
  query: string;
  filter_type: string;
  results_count: number;
  created_at: string;
}

interface TopSearch {
  query: string;
  count: number;
}

interface TrendData {
  date: string;
  searches: number;
}

interface FilterDistribution {
  name: string;
  value: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "hsl(var(--muted))"];

export default function SearchAnalytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [topSearches, setTopSearches] = useState<TopSearch[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [filterDistribution, setFilterDistribution] = useState<FilterDistribution[]>([]);
  const [totalSearches, setTotalSearches] = useState(0);
  const [avgResultsCount, setAvgResultsCount] = useState(0);
  const [zeroResultsRate, setZeroResultsRate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "24h":
        return { start: subDays(now, 1), end: now };
      case "7d":
        return { start: subDays(now, 7), end: now };
      case "30d":
        return { start: subDays(now, 30), end: now };
      case "90d":
        return { start: subDays(now, 90), end: now };
      default:
        return { start: subDays(now, 7), end: now };
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      const { start, end } = getDateRange();

      try {
        const { data, error } = await supabase
          .from("search_analytics")
          .select("*")
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString())
          .order("created_at", { ascending: false });

        if (error) throw error;

        const analytics = data as SearchAnalyticsData[];

        // Calculate total searches
        setTotalSearches(analytics.length);

        // Calculate average results count
        const avgResults = analytics.length > 0
          ? analytics.reduce((sum, item) => sum + item.results_count, 0) / analytics.length
          : 0;
        setAvgResultsCount(Math.round(avgResults * 10) / 10);

        // Calculate zero results rate
        const zeroResults = analytics.filter((item) => item.results_count === 0).length;
        const zeroRate = analytics.length > 0 ? (zeroResults / analytics.length) * 100 : 0;
        setZeroResultsRate(Math.round(zeroRate * 10) / 10);

        // Calculate top searches
        const queryCount = new Map<string, number>();
        analytics.forEach((item) => {
          const q = item.query.toLowerCase();
          queryCount.set(q, (queryCount.get(q) || 0) + 1);
        });
        const topSearchesData = Array.from(queryCount.entries())
          .map(([query, count]) => ({ query, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setTopSearches(topSearchesData);

        // Calculate trend data (group by date)
        const dateCount = new Map<string, number>();
        analytics.forEach((item) => {
          const date = format(new Date(item.created_at), "MMM dd");
          dateCount.set(date, (dateCount.get(date) || 0) + 1);
        });
        
        // Generate all dates in range for continuous chart
        const trendDataArray: TrendData[] = [];
        const days = timeRange === "24h" ? 1 : timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
        for (let i = days - 1; i >= 0; i--) {
          const date = format(subDays(new Date(), i), "MMM dd");
          trendDataArray.push({
            date,
            searches: dateCount.get(date) || 0,
          });
        }
        setTrendData(trendDataArray);

        // Calculate filter distribution
        const filterCount = new Map<string, number>();
        analytics.forEach((item) => {
          filterCount.set(item.filter_type, (filterCount.get(item.filter_type) || 0) + 1);
        });
        const filterData = Array.from(filterCount.entries())
          .map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
          }));
        setFilterDistribution(filterData);

      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <p className="text-center text-muted-foreground">Please log in to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Search Analytics</h1>
              <p className="text-muted-foreground">Track what users are searching for</p>
            </div>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Searches</CardDescription>
                  <CardTitle className="text-4xl">{totalSearches.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    In the selected time period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Avg Results per Search</CardDescription>
                  <CardTitle className="text-4xl">{avgResultsCount}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Average results returned
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Zero Results Rate</CardDescription>
                  <CardTitle className="text-4xl">{zeroResultsRate}%</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Searches with no results
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="top-searches">Top Searches</TabsTrigger>
                <TabsTrigger value="filters">Filter Usage</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Search Trends Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Search Trends
                    </CardTitle>
                    <CardDescription>Number of searches over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="date" 
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />
                          <YAxis 
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="searches" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Top 5 Searches Quick View */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      Top 5 Searches
                    </CardTitle>
                    <CardDescription>Most popular search terms</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topSearches.slice(0, 5)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            type="number"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />
                          <YAxis 
                            dataKey="query" 
                            type="category" 
                            width={120}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                          />
                          <Bar 
                            dataKey="count" 
                            fill="hsl(var(--primary))" 
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="top-searches">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      Top Searches
                    </CardTitle>
                    <CardDescription>All popular search terms</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topSearches.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No search data available for this period
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {topSearches.map((search, index) => (
                          <div 
                            key={search.query}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="font-medium">{search.query}</span>
                            </div>
                            <span className="text-muted-foreground">
                              {search.count} {search.count === 1 ? "search" : "searches"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="filters">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Filter Usage
                    </CardTitle>
                    <CardDescription>How users filter their searches</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filterDistribution.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No filter data available for this period
                      </p>
                    ) : (
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="h-[250px] w-full md:w-1/2">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={filterDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {filterDistribution.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[index % COLORS.length]} 
                                  />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: "hsl(var(--card))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "8px"
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-3 w-full md:w-1/2">
                          {filterDistribution.map((filter, index) => (
                            <div 
                              key={filter.name}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="font-medium">{filter.name}</span>
                              </div>
                              <span className="text-muted-foreground">
                                {filter.value} ({Math.round((filter.value / totalSearches) * 100)}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
