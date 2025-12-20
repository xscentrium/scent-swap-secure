import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, DollarSign, Info } from 'lucide-react';

interface PriceTrackerProps {
  fragranceName: string;
  fragranceBrand: string;
  size?: string;
}

type MarketData = {
  retailPrice: number;
  marketValueNew: number;
  marketValueUsed: number;
  priceRange: { low: number; high: number };
  pricePerMl: number;
  valueTrend: 'rising' | 'stable' | 'falling' | 'volatile';
  lastUpdated: string;
  notes: string;
};

export const PriceTracker = ({ fragranceName, fragranceBrand, size }: PriceTrackerProps) => {
  const { data: marketData, isLoading, error } = useQuery({
    queryKey: ['market-value', fragranceName, fragranceBrand, size],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fragrance-market-value', {
        body: { name: fragranceName, brand: fragranceBrand, size },
      });
      
      if (error) throw error;
      return data?.marketData as MarketData | null;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const { data: priceHistory } = useQuery({
    queryKey: ['price-history', fragranceName, fragranceBrand],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fragrance_price_history')
        .select('*')
        .eq('fragrance_name', fragranceName)
        .eq('fragrance_brand', fragranceBrand)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'falling':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'volatile':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Market Value
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error || !marketData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Market Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Market data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Market Value
          </CardTitle>
          <Badge variant="outline" className={getTrendColor(marketData.valueTrend)}>
            {getTrendIcon(marketData.valueTrend)}
            <span className="ml-1 capitalize">{marketData.valueTrend}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">New (Sealed)</p>
            <p className="text-lg font-bold text-primary">${marketData.marketValueNew}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Used (Excellent)</p>
            <p className="text-lg font-bold">${marketData.marketValueUsed}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Retail Price</span>
            <span>${marketData.retailPrice}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price Range</span>
            <span>${marketData.priceRange.low} - ${marketData.priceRange.high}</span>
          </div>
          {marketData.pricePerMl && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price per ml</span>
              <span>${marketData.pricePerMl.toFixed(2)}/ml</span>
            </div>
          )}
        </div>

        {marketData.notes && (
          <div className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <p>{marketData.notes}</p>
          </div>
        )}

        {priceHistory && priceHistory.length > 0 && (
          <>
            <div className="border-t pt-3">
              <p className="text-xs font-medium mb-2">Recent Sales</p>
              <div className="space-y-1">
                {priceHistory.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {record.size} ({record.condition})
                    </span>
                    <span className="font-medium">${record.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
