import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sparkles, Plus, CalendarIcon, Star, Cloud, Sun, CloudRain, Snowflake } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

type ScentLog = {
  id: string;
  fragrance_name: string;
  fragrance_brand: string;
  logged_date: string;
  occasion: string | null;
  mood: string | null;
  weather: string | null;
  rating: number | null;
  notes: string | null;
};

const occasions = [
  { value: 'work', label: 'Work' },
  { value: 'date', label: 'Date Night' },
  { value: 'casual', label: 'Casual' },
  { value: 'special', label: 'Special Event' },
  { value: 'gym', label: 'Gym/Sport' },
];

const moods = [
  { value: 'confident', label: '💪 Confident' },
  { value: 'relaxed', label: '😌 Relaxed' },
  { value: 'romantic', label: '❤️ Romantic' },
  { value: 'energetic', label: '⚡ Energetic' },
  { value: 'cozy', label: '🛋️ Cozy' },
];

const weatherOptions = [
  { value: 'sunny', label: 'Sunny', icon: Sun },
  { value: 'cloudy', label: 'Cloudy', icon: Cloud },
  { value: 'rainy', label: 'Rainy', icon: CloudRain },
  { value: 'cold', label: 'Cold', icon: Snowflake },
];

export const SOTDTracker = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    fragrance_name: '',
    fragrance_brand: '',
    occasion: '',
    mood: '',
    weather: '',
    rating: 0,
    notes: '',
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['scent-logs', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('scent_logs')
        .select('*')
        .eq('profile_id', profile.id)
        .order('logged_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as ScentLog[];
    },
    enabled: !!profile?.id,
  });

  const addLogMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('scent_logs').insert({
        profile_id: profile.id,
        fragrance_name: formData.fragrance_name,
        fragrance_brand: formData.fragrance_brand,
        logged_date: format(selectedDate, 'yyyy-MM-dd'),
        occasion: formData.occasion || null,
        mood: formData.mood || null,
        weather: formData.weather || null,
        rating: formData.rating || null,
        notes: formData.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scent-logs'] });
      toast.success('SOTD logged!');
      setIsOpen(false);
      setFormData({
        fragrance_name: '',
        fragrance_brand: '',
        occasion: '',
        mood: '',
        weather: '',
        rating: 0,
        notes: '',
      });
    },
    onError: () => {
      toast.error('Failed to log SOTD');
    },
  });

  const todaysLog = logs.find(l => l.logged_date === format(new Date(), 'yyyy-MM-dd'));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Scent of the Day
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Log SOTD
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Your Scent of the Day</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(selectedDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Fragrance Name</Label>
                  <Input
                    placeholder="e.g., Aventus"
                    value={formData.fragrance_name}
                    onChange={(e) => setFormData({ ...formData, fragrance_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input
                    placeholder="e.g., Creed"
                    value={formData.fragrance_brand}
                    onChange={(e) => setFormData({ ...formData, fragrance_brand: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Occasion</Label>
                  <Select value={formData.occasion} onValueChange={(v) => setFormData({ ...formData, occasion: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {occasions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mood</Label>
                  <Select value={formData.mood} onValueChange={(v) => setFormData({ ...formData, mood: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {moods.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Weather</Label>
                <div className="flex gap-2">
                  {weatherOptions.map((w) => (
                    <Button
                      key={w.value}
                      type="button"
                      variant={formData.weather === w.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, weather: w.value })}
                    >
                      <w.icon className="w-4 h-4 mr-1" />
                      {w.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          'w-6 h-6 transition-colors',
                          star <= formData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="How did it perform? Any compliments?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => addLogMutation.mutate()}
                disabled={!formData.fragrance_name || !formData.fragrance_brand || addLogMutation.isPending}
              >
                {addLogMutation.isPending ? 'Saving...' : 'Log SOTD'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {todaysLog ? (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
            <p className="text-sm text-muted-foreground mb-1">Today's Scent</p>
            <p className="font-semibold">{todaysLog.fragrance_name}</p>
            <p className="text-sm text-muted-foreground">{todaysLog.fragrance_brand}</p>
            {todaysLog.rating && (
              <div className="flex gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-4 h-4',
                      star <= todaysLog.rating!
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground mb-4">
            <p>You haven't logged today's scent yet!</p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Recent Wears</p>
          {logs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-sm">{log.fragrance_name}</p>
                <p className="text-xs text-muted-foreground">{log.fragrance_brand}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(log.logged_date), 'MMM d')}
                </p>
                {log.occasion && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {log.occasion}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
