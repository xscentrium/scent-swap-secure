import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Gift } from 'lucide-react';
import { toast } from 'sonner';

const DISMISS_KEY = 'xs:account-setup-dismissed';

export const AccountSetupDialog = () => {
  const { user, profile, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [birthday, setBirthday] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading || !user || !profile) return;
    const hasBirthday = !!(profile as any).birthday;
    const dismissed = localStorage.getItem(DISMISS_KEY) === '1';
    if (!hasBirthday && !dismissed) {
      setOpen(true);
    }
  }, [loading, user, profile]);

  const calculateAge = (birthDateStr: string) => {
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSaveBirthday = async () => {
    if (!birthday) {
      toast.error('Please enter your birthday');
      return;
    }
    const age = calculateAge(birthday);
    if (age < 13) {
      toast.error('You must be at least 13 years old to use this platform');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ birthday })
      .eq('id', profile?.id);
    setSaving(false);

    if (error) {
      toast.error('Failed to save birthday');
      return;
    }

    if (age < 16) {
      toast.success('Birthday saved! Note: Users under 16 need a guardian account to trade.');
    } else {
      toast.success('Birthday saved — your $5 birthday credit is set!');
    }
    localStorage.removeItem(DISMISS_KEY);
    setOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setOpen(false);
  };

  if (loading || !user || !profile) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip(); else setOpen(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Get a $5 birthday credit
          </DialogTitle>
          <DialogDescription>
            Add your birthday to unlock a $5 credit on your special day. Totally optional — you can skip this and add it later in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-4 rounded-lg border bg-muted">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-medium">Your birthday</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Used only to send your annual credit. You must be 13+ to join.
                  </p>
                </div>
                <Input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button className="flex-1" onClick={handleSaveBirthday} disabled={saving || !birthday}>
              {saving ? 'Saving…' : 'Save & claim $5'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
