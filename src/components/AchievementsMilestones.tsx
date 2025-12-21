import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, Package, DollarSign, Flame, Star, Award,
  ShoppingBag, Users, MessageSquare, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: any;
  iconColor: string;
  target: number;
  current: number;
  type: 'trades' | 'collection' | 'earnings' | 'streak' | 'reviews' | 'badges';
  reward?: string;
}

// Celebration animation
const celebrateUnlock = (title: string) => {
  // Confetti burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });

  toast.success(`🎉 Achievement Unlocked: ${title}!`, {
    duration: 5000,
    style: {
      background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
      color: 'white',
      border: 'none',
    }
  });
};

export const AchievementsMilestones = () => {
  const { profile } = useAuth();
  const [celebratedIds, setCelebratedIds] = useState<Set<string>>(new Set());

  const { data: stats } = useQuery({
    queryKey: ['achievement-stats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const [trades, collection, reviews, badges, earnings, scentLogs] = await Promise.all([
        supabase
          .from('trades')
          .select('id, status, initiator_id, receiver_id', { count: 'exact' })
          .or(`initiator_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
          .eq('status', 'completed'),
        supabase
          .from('collection_items')
          .select('id', { count: 'exact' })
          .eq('profile_id', profile.id),
        supabase
          .from('fragrance_reviews')
          .select('id', { count: 'exact' })
          .eq('profile_id', profile.id),
        supabase
          .from('user_badges')
          .select('id', { count: 'exact' })
          .eq('profile_id', profile.id),
        supabase
          .from('trades')
          .select(`
            initiator_id,
            receiver_id,
            initiator_listing:listings!trades_initiator_listing_id_fkey(price),
            receiver_listing:listings!trades_receiver_listing_id_fkey(price)
          `)
          .or(`initiator_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
          .eq('status', 'completed'),
        supabase
          .from('scent_logs')
          .select('logged_date')
          .eq('profile_id', profile.id)
          .order('logged_date', { ascending: false })
      ]);

      // Calculate total earnings
      let totalEarnings = 0;
      earnings.data?.forEach(trade => {
        if (trade.initiator_id === profile.id && trade.initiator_listing?.price) {
          totalEarnings += trade.initiator_listing.price;
        } else if (trade.receiver_id === profile.id && trade.receiver_listing?.price) {
          totalEarnings += trade.receiver_listing.price;
        }
      });

      // Calculate streak
      let streak = 0;
      if (scentLogs.data && scentLogs.data.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dates = [...new Set(scentLogs.data.map(l => l.logged_date))].sort().reverse();
        
        const firstDate = new Date(dates[0]);
        firstDate.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (firstDate.getTime() === today.getTime() || firstDate.getTime() === yesterday.getTime()) {
          streak = 1;
          let expectedDate = firstDate.getTime();
          for (let i = 1; i < dates.length; i++) {
            const checkDate = new Date(dates[i]);
            checkDate.setHours(0, 0, 0, 0);
            if (checkDate.getTime() === expectedDate - 86400000) {
              streak++;
              expectedDate = checkDate.getTime();
            } else break;
          }
        }
      }

      return {
        trades: trades.count || 0,
        collection: collection.count || 0,
        reviews: reviews.count || 0,
        badges: badges.count || 0,
        earnings: totalEarnings,
        streak,
      };
    },
    enabled: !!profile?.id,
  });

  const milestones: Milestone[] = [
    // Trade milestones
    { id: 'trade-1', title: 'First Trade', description: 'Complete your first trade', icon: Trophy, iconColor: 'text-yellow-500', target: 1, current: stats?.trades || 0, type: 'trades' },
    { id: 'trade-10', title: 'Rising Trader', description: 'Complete 10 trades', icon: Trophy, iconColor: 'text-yellow-500', target: 10, current: stats?.trades || 0, type: 'trades' },
    { id: 'trade-50', title: 'Trade Expert', description: 'Complete 50 trades', icon: Trophy, iconColor: 'text-yellow-500', target: 50, current: stats?.trades || 0, type: 'trades' },
    { id: 'trade-100', title: 'Trade Master', description: 'Complete 100 trades', icon: Trophy, iconColor: 'text-yellow-500', target: 100, current: stats?.trades || 0, type: 'trades', reward: 'Gold Badge' },
    
    // Collection milestones
    { id: 'collect-10', title: 'Collector', description: 'Add 10 fragrances to collection', icon: Package, iconColor: 'text-blue-500', target: 10, current: stats?.collection || 0, type: 'collection' },
    { id: 'collect-50', title: 'Enthusiast', description: 'Add 50 fragrances to collection', icon: Package, iconColor: 'text-blue-500', target: 50, current: stats?.collection || 0, type: 'collection' },
    { id: 'collect-100', title: 'Connoisseur', description: 'Add 100 fragrances to collection', icon: Package, iconColor: 'text-blue-500', target: 100, current: stats?.collection || 0, type: 'collection', reward: 'Platinum Badge' },
    
    // Earnings milestones
    { id: 'earn-100', title: 'First Hundred', description: 'Earn $100 from sales', icon: DollarSign, iconColor: 'text-green-500', target: 100, current: stats?.earnings || 0, type: 'earnings' },
    { id: 'earn-500', title: 'Hustler', description: 'Earn $500 from sales', icon: DollarSign, iconColor: 'text-green-500', target: 500, current: stats?.earnings || 0, type: 'earnings' },
    { id: 'earn-1000', title: 'Big Earner', description: 'Earn $1,000 from sales', icon: DollarSign, iconColor: 'text-green-500', target: 1000, current: stats?.earnings || 0, type: 'earnings', reward: 'VIP Status' },
    
    // Streak milestones
    { id: 'streak-7', title: 'Week Warrior', description: 'Log SOTD for 7 days straight', icon: Flame, iconColor: 'text-orange-500', target: 7, current: stats?.streak || 0, type: 'streak' },
    { id: 'streak-30', title: 'Month Master', description: 'Log SOTD for 30 days straight', icon: Flame, iconColor: 'text-orange-500', target: 30, current: stats?.streak || 0, type: 'streak' },
    { id: 'streak-100', title: 'Dedication Legend', description: 'Log SOTD for 100 days straight', icon: Flame, iconColor: 'text-orange-500', target: 100, current: stats?.streak || 0, type: 'streak', reward: 'Fire Badge' },
    
    // Review milestones  
    { id: 'review-5', title: 'Critic', description: 'Write 5 fragrance reviews', icon: Star, iconColor: 'text-purple-500', target: 5, current: stats?.reviews || 0, type: 'reviews' },
    { id: 'review-25', title: 'Reviewer Pro', description: 'Write 25 fragrance reviews', icon: Star, iconColor: 'text-purple-500', target: 25, current: stats?.reviews || 0, type: 'reviews' },
  ];

  // Check for newly completed milestones and celebrate
  useEffect(() => {
    if (!stats) return;

    const storedCelebrated = localStorage.getItem('celebrated-milestones');
    const previouslyUnlocked = new Set<string>(storedCelebrated ? JSON.parse(storedCelebrated) : []);

    milestones.forEach(milestone => {
      if (milestone.current >= milestone.target && !previouslyUnlocked.has(milestone.id)) {
        celebrateUnlock(milestone.title);
        previouslyUnlocked.add(milestone.id);
      }
    });

    localStorage.setItem('celebrated-milestones', JSON.stringify([...previouslyUnlocked]));
    setCelebratedIds(previouslyUnlocked);
  }, [stats]);

  const completedCount = milestones.filter(m => m.current >= m.target).length;
  const inProgressMilestones = milestones.filter(m => m.current < m.target && m.current > 0).slice(0, 3);
  const completedMilestones = milestones.filter(m => m.current >= m.target);
  const lockedMilestones = milestones.filter(m => m.current === 0);

  if (!profile) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Achievements & Milestones
          </div>
          <Badge variant="secondary">
            {completedCount}/{milestones.length} Unlocked
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round((completedCount / milestones.length) * 100)}%</span>
          </div>
          <Progress value={(completedCount / milestones.length) * 100} className="h-2" />
        </div>

        {/* In Progress */}
        {inProgressMilestones.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">In Progress</h4>
            {inProgressMilestones.map(milestone => (
              <div key={milestone.id} className="p-4 rounded-lg border bg-muted/30 space-y-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-background ${milestone.iconColor}`}>
                    <milestone.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{milestone.title}</p>
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  </div>
                  <Badge variant="outline">
                    {milestone.current}/{milestone.target}
                  </Badge>
                </div>
                <Progress 
                  value={(milestone.current / milestone.target) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        )}

        {/* Completed */}
        {completedMilestones.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Completed</h4>
            <div className="grid grid-cols-2 gap-2">
              {completedMilestones.map(milestone => (
                <div 
                  key={milestone.id} 
                  className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{milestone.title}</p>
                    {milestone.reward && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {milestone.reward}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked */}
        {lockedMilestones.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Locked</h4>
            <div className="grid grid-cols-2 gap-2">
              {lockedMilestones.slice(0, 6).map(milestone => (
                <div 
                  key={milestone.id} 
                  className="p-3 rounded-lg bg-muted/50 border border-border flex items-center gap-2 opacity-60"
                >
                  <milestone.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="font-medium text-sm truncate text-muted-foreground">{milestone.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
