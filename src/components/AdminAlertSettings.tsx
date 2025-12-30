import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, AlertTriangle, Plus, X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ThresholdSettings {
  daily_threshold: number;
  hourly_spike_threshold: number;
  increase_percentage: number;
}

export const AdminAlertSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [thresholds, setThresholds] = useState<ThresholdSettings>({
    daily_threshold: 100,
    hourly_spike_threshold: 50,
    increase_percentage: 50,
  });
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('admin_alert_settings')
      .select('*');

    if (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } else if (data) {
      data.forEach(setting => {
        if (setting.setting_key === 'search_volume_thresholds') {
          const value = setting.setting_value;
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            setThresholds({
              daily_threshold: Number((value as Record<string, unknown>).daily_threshold) || 100,
              hourly_spike_threshold: Number((value as Record<string, unknown>).hourly_spike_threshold) || 50,
              increase_percentage: Number((value as Record<string, unknown>).increase_percentage) || 50,
            });
          }
        } else if (setting.setting_key === 'admin_emails') {
          if (Array.isArray(setting.setting_value)) {
            setAdminEmails(setting.setting_value as string[]);
          }
        }
      });
    }
    
    setLoading(false);
  };

  const handleSaveThresholds = async () => {
    setSaving(true);
    
    const thresholdValue = {
      daily_threshold: thresholds.daily_threshold,
      hourly_spike_threshold: thresholds.hourly_spike_threshold,
      increase_percentage: thresholds.increase_percentage,
    };
    
    const { error } = await supabase
      .from('admin_alert_settings')
      .update({ 
        setting_value: thresholdValue as unknown as null,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'search_volume_thresholds');

    setSaving(false);

    if (error) {
      toast.error('Failed to save thresholds');
    } else {
      toast.success('Thresholds saved successfully');
    }
  };

  const handleSaveEmails = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from('admin_alert_settings')
      .update({ 
        setting_value: adminEmails as unknown as null,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'admin_emails');

    setSaving(false);

    if (error) {
      toast.error('Failed to save admin emails');
    } else {
      toast.success('Admin emails saved successfully');
    }
  };

  const addEmail = () => {
    if (!newEmail.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (adminEmails.includes(newEmail.toLowerCase())) {
      toast.error('This email is already added');
      return;
    }
    
    setAdminEmails([...adminEmails, newEmail.toLowerCase()]);
    setNewEmail('');
  };

  const removeEmail = (email: string) => {
    setAdminEmails(adminEmails.filter(e => e !== email));
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Thresholds */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Search Alert Thresholds
          </CardTitle>
          <CardDescription>
            Configure when to send alerts based on search volume
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="daily-threshold">Daily Search Threshold</Label>
              <Input
                id="daily-threshold"
                type="number"
                min="1"
                value={thresholds.daily_threshold}
                onChange={(e) => setThresholds({
                  ...thresholds,
                  daily_threshold: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-muted-foreground">
                Alert when daily searches exceed this number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourly-threshold">Hourly Spike Threshold</Label>
              <Input
                id="hourly-threshold"
                type="number"
                min="1"
                value={thresholds.hourly_spike_threshold}
                onChange={(e) => setThresholds({
                  ...thresholds,
                  hourly_spike_threshold: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-muted-foreground">
                Alert when hourly searches exceed this number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="increase-percentage">Day-over-Day Increase %</Label>
              <Input
                id="increase-percentage"
                type="number"
                min="1"
                max="1000"
                value={thresholds.increase_percentage}
                onChange={(e) => setThresholds({
                  ...thresholds,
                  increase_percentage: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-muted-foreground">
                Alert when daily increase exceeds this percentage
              </p>
            </div>
          </div>

          <Button onClick={handleSaveThresholds} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Thresholds
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Admin Email Recipients */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Alert Email Recipients
          </CardTitle>
          <CardDescription>
            Configure which email addresses receive search volume alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {adminEmails.length === 0 ? (
              <p className="text-sm text-muted-foreground">No email recipients configured</p>
            ) : (
              adminEmails.map((email) => (
                <Badge key={email} variant="secondary" className="gap-1 pr-1">
                  {email}
                  <button
                    onClick={() => removeEmail(email)}
                    className="ml-1 p-0.5 hover:bg-destructive/20 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="admin@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addEmail();
                }
              }}
            />
            <Button variant="outline" onClick={addEmail}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={handleSaveEmails} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Recipients
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};