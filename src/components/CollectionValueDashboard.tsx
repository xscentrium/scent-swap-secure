import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, DollarSign, Package, Sparkles, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type CollectionItem = {
  id: string;
  name: string;
  brand: string;
  size: string | null;
};

type EstimatedValue = {
  name: string;
  brand: string;
  estimatedValue: number;
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const CollectionValueDashboard = () => {
  const { profile } = useAuth();

  const { data: collection = [], isLoading: collectionLoading } = useQuery({
    queryKey: ['collection-items', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('collection_items')
        .select('*')
        .eq('profile_id', profile.id);
      if (error) throw error;
      return data as CollectionItem[];
    },
    enabled: !!profile?.id,
  });

  const { data: valuations = [], isLoading: valuationsLoading } = useQuery({
    queryKey: ['collection-valuations', collection],
    queryFn: async () => {
      if (collection.length === 0) return [];
      
      // Get estimated values from AI for each item
      const { data, error } = await supabase.functions.invoke('fragrance-market-value', {
        body: { 
          fragrances: collection.map(c => ({ name: c.name, brand: c.brand, size: c.size || '100ml' }))
        },
      });
      
      if (error) throw error;
      return (data?.valuations || []) as EstimatedValue[];
    },
    enabled: collection.length > 0,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  const totalValue = valuations.reduce((sum, v) => sum + (v.estimatedValue || 0), 0);
  const avgValue = valuations.length > 0 ? totalValue / valuations.length : 0;

  // Group by brand for pie chart
  const brandData = valuations.reduce((acc, v) => {
    const existing = acc.find(a => a.name === v.brand);
    if (existing) {
      existing.value += v.estimatedValue;
    } else {
      acc.push({ name: v.brand, value: v.estimatedValue });
    }
    return acc;
  }, [] as { name: string; value: number }[]).slice(0, 6);

  // Top items by value for bar chart
  const topItems = [...valuations]
    .sort((a, b) => b.estimatedValue - a.estimatedValue)
    .slice(0, 5)
    .map(v => ({
      name: v.name.length > 15 ? v.name.slice(0, 15) + '...' : v.name,
      value: v.estimatedValue,
    }));

  const isLoading = collectionLoading || valuationsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Collection Value
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (collection.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Collection Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Add fragrances to your collection to see valuation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Collection Value Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 text-primary mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Total Value</span>
            </div>
            <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2 text-accent mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Avg. Value</span>
            </div>
            <p className="text-2xl font-bold">${avgValue.toFixed(0)}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">Items</span>
            </div>
            <p className="text-2xl font-bold">{collection.length}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Items Bar Chart */}
          <div>
            <p className="text-sm font-medium mb-3">Top Valued Items</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItems} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`$${value}`, 'Value']} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Brand Distribution Pie Chart */}
          <div>
            <p className="text-sm font-medium mb-3">Value by Brand</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={brandData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {brandData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {brandData.map((item, index) => (
                <Badge key={item.name} variant="outline" className="text-xs">
                  <span
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {item.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
