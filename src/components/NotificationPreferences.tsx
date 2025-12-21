import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, MessageSquare, Award, ArrowLeftRight, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

interface NotificationPrefs {
  trade_matches: boolean;
  trade_messages: boolean;
  trade_proposals: boolean;
  badge_earned: boolean;
  fragrance_reviews: boolean;
  push_enabled: boolean;
}

export const NotificationPreferences = () => {
  const { profile } = useAuth();
  const { isSupported, permission, requestPermission, isEnabled } = usePushNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    trade_matches: true,
    trade_messages: true,
    trade_proposals: true,
    badge_earned: true,
    fragrance_reviews: true,
    push_enabled: false,
  });

  useEffect(() => {
    if (profile?.id) {
      fetchPreferences();
    }
  }, [profile?.id]);

  const fetchPreferences = async () => {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('profile_id', profile?.id)
      .single();

    if (data) {
      setPrefs({
        trade_matches: data.trade_matches,
        trade_messages: data.trade_messages,
        trade_proposals: data.trade_proposals,
        badge_earned: data.badge_earned,
        fragrance_reviews: data.fragrance_reviews,
        push_enabled: data.push_enabled,
      });
    } else if (error?.code === 'PGRST116') {
      // No record exists, create one
      await supabase.from('notification_preferences').insert({
        profile_id: profile?.id,
      });
    }
    setLoading(false);
  };

  const handleToggle = async (key: keyof NotificationPrefs, value: boolean) => {
    // Special handling for push_enabled
    if (key === 'push_enabled' && value && !isEnabled) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    setPrefs(prev => ({ ...prev, [key]: value }));
    
    const { error } = await supabase
      .from('notification_preferences')
      .update({ [key]: value })
      .eq('profile_id', profile?.id);

    if (error) {
      toast.error('Failed to update preference');
      setPrefs(prev => ({ ...prev, [key]: !value }));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const notificationTypes = [
    {
      key: 'trade_matches' as const,
      label: 'Trade Matches',
      description: 'When someone wants a fragrance you have',
      icon: ArrowLeftRight,
    },
    {
      key: 'trade_messages' as const,
      label: 'Trade Messages',
      description: 'New messages in your trades',
      icon: MessageSquare,
    },
    {
      key: 'trade_proposals' as const,
      label: 'Trade Proposals',
      description: 'When someone proposes a trade with you',
      icon: ArrowLeftRight,
    },
    {
      key: 'badge_earned' as const,
      label: 'Badge Unlocks',
      description: 'When you earn a new badge',
      icon: Award,
    },
    {
      key: 'fragrance_reviews' as const,
      label: 'Fragrance Reviews',
      description: 'Reviews on fragrances in your collection',
      icon: FileText,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Browser Push Toggle */}
        {isSupported && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Browser Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get alerts even when you're not on the site
              </p>
            </div>
            <Switch
              checked={prefs.push_enabled && isEnabled}
              onCheckedChange={(checked) => handleToggle('push_enabled', checked)}
            />
          </div>
        )}

        <div className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <type.icon className="w-5 h-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label className="font-medium">{type.label}</Label>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              </div>
              <Switch
                checked={prefs[type.key]}
                onCheckedChange={(checked) => handleToggle(type.key, checked)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
