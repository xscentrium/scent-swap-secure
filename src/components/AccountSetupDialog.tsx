import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Label } from '@/components/ui/label';
import { AlertCircle, Mail, Calendar, CheckCircle, Gift } from 'lucide-react';
import { toast } from 'sonner';

export const AccountSetupDialog = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [birthday, setBirthday] = useState('');
  const [saving, setSaving] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [birthdaySet, setBirthdaySet] = useState(false);

  useEffect(() => {
    if (!loading && user && profile) {
      // Check if email is verified
      const isEmailVerified = user.email_confirmed_at !== null;
      setEmailVerified(isEmailVerified);
      
      // Check if birthday is set
      const hasBirthday = !!(profile as any).birthday;
      setBirthdaySet(hasBirthday);
      
      // Open dialog if either is missing
      if (!isEmailVerified || !hasBirthday) {
        setOpen(true);
      }
    }
  }, [loading, user, profile]);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setResendingEmail(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });
    setResendingEmail(false);

    if (error) {
      toast.error('Failed to resend verification email');
    } else {
      toast.success('Verification email sent!');
    }
  };

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

    // Validate age (must be at least 13)
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
    } else {
      setBirthdaySet(true);
      if (age < 16) {
        toast.success('Birthday saved! Note: Users under 16 need a guardian account to trade.');
      } else {
        toast.success('Birthday saved!');
      }
      
      // Close dialog if both are complete
      if (emailVerified) {
        setOpen(false);
      }
    }
  };

  const isComplete = emailVerified && birthdaySet;

  if (loading || !user || !profile) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      // Only allow closing if setup is complete
      if (!isComplete && val === false) {
        toast.error('Please complete account setup to use all features');
        return;
      }
      setOpen(val);
    }}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => {
        if (!isComplete) e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Complete Your Account Setup
          </DialogTitle>
          <DialogDescription>
            Please complete these steps to unlock all platform features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Email Verification */}
          <div className={`p-4 rounded-lg border ${emailVerified ? 'bg-green-500/10 border-green-500/30' : 'bg-muted border-border'}`}>
            <div className="flex items-start gap-3">
              {emailVerified ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              ) : (
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-medium">Verify Email Address</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {emailVerified 
                    ? 'Your email has been verified!'
                    : `We sent a verification email to ${user.email}. Please check your inbox and click the link.`
                  }
                </p>
                {!emailVerified && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleResendVerification}
                    disabled={resendingEmail}
                  >
                    {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Birthday */}
          <div className={`p-4 rounded-lg border ${birthdaySet ? 'bg-green-500/10 border-green-500/30' : 'bg-muted border-border'}`}>
            <div className="flex items-start gap-3">
              {birthdaySet ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              ) : (
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-medium">Set Your Birthday</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {birthdaySet 
                    ? 'Your birthday has been saved!'
                    : 'Required for account verification. You must be 13+ to join. Users under 16 need a guardian to trade.'
                  }
                </p>
                
                {!birthdaySet && (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center gap-2 p-2 bg-primary/10 rounded text-sm">
                      <Gift className="w-4 h-4 text-primary" />
                      <span>Get a <strong>$5 credit</strong> on your birthday (verified from your ID)!</span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                      />
                      <Button onClick={handleSaveBirthday} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isComplete && (
            <Button className="w-full" onClick={() => setOpen(false)}>
              Continue to Platform
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};