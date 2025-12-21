import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Package, DollarSign } from 'lucide-react';
import { format, subDays, subMonths, startOfDay, startOfMonth, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';

type Period = 'week' | 'month';

export const StatsCharts = () => {
  const { profile } = useAuth();
  const [period, setPeriod] = useState<Period>('week');

  const { data: tradeData, isLoading: loadingTrades } = useQuery({
    queryKey: ['trade-stats', profile?.id, period],
    queryFn: async () => {
      const startDate = period === 'week' 
        ? subDays(new Date(), 7) 
        : subMonths(new Date(), 6);

      const { data: trades } = await supabase
        .from('trades')
        .select('created_at, status')
        .or(`initiator_id.eq.${profile?.id},receiver_id.eq.${profile?.id}`)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (period === 'week') {
        const days = eachDayOfInterval({ start: startDate, end: new Date() });
        return days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayTrades = trades?.filter(t => 
            format(new Date(t.created_at), 'yyyy-MM-dd') === dayStr
          ) || [];
          return {
            date: format(day, 'EEE'),
            total: dayTrades.length,
            completed: dayTrades.filter(t => t.status === 'completed').length,
          };
        });
      } else {
        const months = eachMonthOfInterval({ start: startDate, end: new Date() });
        return months.map(month => {
          const monthStr = format(month, 'yyyy-MM');
          const monthTrades = trades?.filter(t => 
            format(new Date(t.created_at), 'yyyy-MM') === monthStr
          ) || [];
          return {
            date: format(month, 'MMM'),
            total: monthTrades.length,
            completed: monthTrades.filter(t => t.status === 'completed').length,
          };
        });
      }
    },
    enabled: !!profile?.id,
  });

  const { data: collectionData, isLoading: loadingCollection } = useQuery({
    queryKey: ['collection-growth', profile?.id, period],
    queryFn: async () => {
      const startDate = period === 'week' 
        ? subDays(new Date(), 7) 
        : subMonths(new Date(), 6);

      const { data: items } = await supabase
        .from('collection_items')
        .select('created_at')
        .eq('profile_id', profile?.id)
        .order('created_at', { ascending: true });

      // Get initial count before start date
      const initialCount = items?.filter(i => 
        new Date(i.created_at) < startDate
      ).length || 0;

      if (period === 'week') {
        const days = eachDayOfInterval({ start: startDate, end: new Date() });
        let runningTotal = initialCount;
        return days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const added = items?.filter(i => 
            format(new Date(i.created_at), 'yyyy-MM-dd') === dayStr
          ).length || 0;
          runningTotal += added;
          return {
            date: format(day, 'EEE'),
            count: runningTotal,
            added,
          };
        });
      } else {
        const months = eachMonthOfInterval({ start: startDate, end: new Date() });
        let runningTotal = initialCount;
        return months.map(month => {
          const monthStr = format(month, 'yyyy-MM');
          const added = items?.filter(i => 
            format(new Date(i.created_at), 'yyyy-MM') === monthStr
          ).length || 0;
          runningTotal += added;
          return {
            date: format(month, 'MMM'),
            count: runningTotal,
            added,
          };
        });
      }
    },
    enabled: !!profile?.id,
  });

  const { data: earningsData, isLoading: loadingEarnings } = useQuery({
    queryKey: ['earnings-stats', profile?.id, period],
    queryFn: async () => {
      const startDate = period === 'week' 
        ? subDays(new Date(), 7) 
        : subMonths(new Date(), 6);

      // Get completed trades where user was seller (initiator with sale listing)
      const { data: trades } = await supabase
        .from('trades')
        .select(`
          created_at,
          status,
          initiator_id,
          receiver_id,
          initiator_listing:listings!trades_initiator_listing_id_fkey(price, listing_type),
          receiver_listing:listings!trades_receiver_listing_id_fkey(price, listing_type)
        `)
        .or(`initiator_id.eq.${profile?.id},receiver_id.eq.${profile?.id}`)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Calculate earnings (when user sold something)
      const processedTrades = trades?.map(trade => {
        let earnings = 0;
        if (trade.initiator_id === profile?.id && trade.initiator_listing?.price) {
          earnings = trade.initiator_listing.price;
        } else if (trade.receiver_id === profile?.id && trade.receiver_listing?.price) {
          earnings = trade.receiver_listing.price;
        }
        return { ...trade, earnings };
      }) || [];

      if (period === 'week') {
        const days = eachDayOfInterval({ start: startDate, end: new Date() });
        return days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayTrades = processedTrades.filter(t => 
            format(new Date(t.created_at), 'yyyy-MM-dd') === dayStr
          );
          return {
            date: format(day, 'EEE'),
            earnings: dayTrades.reduce((sum, t) => sum + t.earnings, 0),
            trades: dayTrades.length,
          };
        });
      } else {
        const months = eachMonthOfInterval({ start: startDate, end: new Date() });
        return months.map(month => {
          const monthStr = format(month, 'yyyy-MM');
          const monthTrades = processedTrades.filter(t => 
            format(new Date(t.created_at), 'yyyy-MM') === monthStr
          );
          return {
            date: format(month, 'MMM'),
            earnings: monthTrades.reduce((sum, t) => sum + t.earnings, 0),
            trades: monthTrades.length,
          };
        });
      }
    },
    enabled: !!profile?.id,
  });

  if (!profile) return null;

  const totalEarnings = earningsData?.reduce((sum, d) => sum + d.earnings, 0) || 0;
  const totalTrades = tradeData?.reduce((sum, d) => sum + d.total, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Activity Overview
          </CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">6 Months</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Earnings</span>
            </div>
            <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Trades</span>
            </div>
            <p className="text-2xl font-bold">{totalTrades}</p>
          </div>
        </div>

        {/* Earnings Chart */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Earnings Over Time
          </h4>
          {loadingEarnings ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Earnings']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Trading Activity */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trading Activity
          </h4>
          {loadingTrades ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={tradeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} name="All Trades" />
                <Line type="monotone" dataKey="completed" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Collection Growth */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Collection Growth
          </h4>
          {loadingCollection ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={collectionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} name="Total Items" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
