import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Star, CheckCircle, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

type TrustScoreData = {
  id: string;
  profile_id: string;
  total_trades_completed: number;
  total_trades_cancelled: number;
  average_rating: number | null;
  total_ratings: number;
  verification_bonus: number;
  calculated_score: number;
};

interface TrustScoreProps {
  profileId: string;
  variant?: 'full' | 'compact' | 'badge';
}

const getScoreLevel = (score: number) => {
  if (score >= 90) return { label: 'Excellent', color: 'text-green-500', bg: 'bg-green-500/10' };
  if (score >= 75) return { label: 'Very Good', color: 'text-blue-500', bg: 'bg-blue-500/10' };
  if (score >= 60) return { label: 'Good', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
  if (score >= 40) return { label: 'Fair', color: 'text-orange-500', bg: 'bg-orange-500/10' };
  return { label: 'New', color: 'text-muted-foreground', bg: 'bg-muted' };
};

export const TrustScore = ({ profileId, variant = 'full' }: TrustScoreProps) => {
  const { data: trustScore, isLoading } = useQuery({
    queryKey: ['trust-score', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trust_scores')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();
      
      if (error) throw error;
      return data as TrustScoreData | null;
    },
    enabled: !!profileId,
  });

  if (isLoading) {
    if (variant === 'badge') {
      return <Skeleton className="h-6 w-20 rounded-full" />;
    }
    return <Skeleton className="h-24 rounded-lg" />;
  }

  const score = trustScore?.calculated_score || 0;
  const level = getScoreLevel(score);

  if (variant === 'badge') {
    return (
      <Badge className={cn('gap-1', level.bg, level.color, 'border-0')}>
        <Shield className="w-3 h-3" />
        {score.toFixed(0)}
      </Badge>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-full', level.bg)}>
          <Shield className={cn('w-5 h-5', level.color)} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{score.toFixed(0)}</span>
            <Badge variant="outline" className={cn('text-xs', level.color)}>
              {level.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Trust Score</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-3 rounded-full', level.bg)}>
              <Shield className={cn('w-6 h-6', level.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl">{score.toFixed(0)}</span>
                <Badge variant="outline" className={cn(level.color)}>
                  {level.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Trust Score</p>
            </div>
          </div>
        </div>

        <Progress value={score} className="mb-4" />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">Trades:</span>
            <span className="font-medium">{trustScore?.total_trades_completed || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-muted-foreground">Rating:</span>
            <span className="font-medium">
              {trustScore?.average_rating?.toFixed(1) || 'N/A'}
              {trustScore?.total_ratings ? ` (${trustScore.total_ratings})` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Verification Bonus:</span>
            <span className="font-medium">+{trustScore?.verification_bonus || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
