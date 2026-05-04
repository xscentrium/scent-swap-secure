import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { ImageUpload } from '@/components/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Loader2, User, Shield, Link as LinkIcon, Settings2, Bell,
  Instagram, Twitter, CheckCircle, AlertCircle, Upload, Calendar, Mail, Lock, Gift, Users, ArrowLeftRight, ShieldAlert
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { z } from 'zod';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { BlockedUsersManager } from '@/components/BlockedUsersManager';
import { AdminAlertSettings } from '@/components/AdminAlertSettings';

const profileSchema = z.object({
  display_name: z.string().min(1).max(50),
  bio: z.string().max(500).optional(),
  instagram_url: z.string().url().optional().or(z.literal('')),
  twitter_url: z.string().url().optional().or(z.literal('')),
  facebook_url: z.string().url().optional().or(z.literal('')),
  tiktok_url: z.string().url().optional().or(z.literal('')),
});

const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be less than 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    instagram_url: '',
    twitter_url: '',
    facebook_url: '',
    tiktok_url: '',
  });

  const [idVerification, setIdVerification] = useState({
    status: 'none',
    documentUrl: '',
  });

  // Account settings
  const [newUsername, setNewUsername] = useState('');
  const [usernameLastChanged, setUsernameLastChanged] = useState<Date | null>(null);
  const [changingUsername, setChangingUsername] = useState(false);
  const [birthday, setBirthday] = useState('');
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Guardian settings
  const [guardianCode, setGuardianCode] = useState('');
  const [linkingGuardian, setLinkingGuardian] = useState(false);
  const [guardianInfo, setGuardianInfo] = useState<{ username: string; verified: boolean } | null>(null);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [pendingGuardianRequests, setPendingGuardianRequests] = useState<{ id: string; username: string }[]>([]);
  
  // Trade matches toggle
  const [tradeMatchesEnabled, setTradeMatchesEnabled] = useState(false);
  const [savingTradeMatches, setSavingTradeMatches] = useState(false);
  
  // Admin role check
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: (profile as any).bio || '',
        avatar_url: (profile as any).avatar_url || '',
        instagram_url: (profile as any).instagram_url || '',
        twitter_url: (profile as any).twitter_url || '',
        facebook_url: (profile as any).facebook_url || '',
        tiktok_url: (profile as any).tiktok_url || '',
      });
      setNewUsername(profile.username);
      const bday = (profile as any).birthday || '';
      setBirthday(bday);
      if (bday) {
        const birthDate = new Date(bday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        setUserAge(age);
      }
      setUsernameLastChanged((profile as any).username_last_changed_at ? new Date((profile as any).username_last_changed_at) : null);

      // Fetch ID verification status and guardian info
      fetchIdStatus();
      fetchGuardianInfo();
      fetchPendingGuardianRequests();
      fetchTradeMatchesSetting();
      checkAdminRole();
    }
  }, [profile]);

  // Realtime subscription for guardian requests
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('guardian-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `guardian_id=eq.${profile.id}`,
        },
        () => {
          // Refetch when any profile links/unlinks this user as guardian
          fetchPendingGuardianRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const fetchGuardianInfo = async () => {
    if (!profile?.id) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('guardian_id, guardian_verified')
      .eq('id', profile.id)
      .single();

    if (data?.guardian_id) {
      const { data: guardian } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.guardian_id)
        .single();
      
      if (guardian) {
        setGuardianInfo({ username: guardian.username, verified: data.guardian_verified || false });
      }
    }
  };

  const fetchPendingGuardianRequests = async () => {
    if (!profile?.id) return;
    
    // Find users who have this profile as their guardian but are not verified
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('guardian_id', profile.id)
      .eq('guardian_verified', false);

    if (data) {
      setPendingGuardianRequests(data);
    }
  };

  const fetchIdStatus = async () => {
    if (!profile?.id) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('id_verified, id_verification_status, id_document_url')
      .eq('id', profile.id)
      .single();

    if (data) {
      setIdVerification({
        status: data.id_verification_status || 'none',
        documentUrl: data.id_document_url || '',
      });
    }
  };

  const fetchTradeMatchesSetting = async () => {
    if (!profile?.id) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('trade_matches_enabled')
      .eq('id', profile.id)
      .single();

    if (data) {
      setTradeMatchesEnabled(data.trade_matches_enabled ?? false);
    }
  };

  const checkAdminRole = async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const handleToggleTradeMatches = async (enabled: boolean) => {
    setSavingTradeMatches(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ trade_matches_enabled: enabled })
      .eq('id', profile.id);

    setSavingTradeMatches(false);

    if (error) {
      toast.error('Failed to update setting');
    } else {
      setTradeMatchesEnabled(enabled);
      toast.success(enabled ? 'Trade matches enabled' : 'Trade matches disabled');
    }
  };

  const canChangeUsername = () => {
    if (!usernameLastChanged) return true;
    const daysSinceChange = (new Date().getTime() - usernameLastChanged.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceChange >= 14;
  };

  const daysUntilUsernameChange = () => {
    if (!usernameLastChanged) return 0;
    const daysSinceChange = (new Date().getTime() - usernameLastChanged.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(14 - daysSinceChange));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center pt-32">
          <h1 className="text-2xl font-serif font-bold mb-2">Sign in Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access settings.</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    try {
      profileSchema.parse(formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: formData.display_name,
        bio: formData.bio || null,
        avatar_url: formData.avatar_url || null,
        instagram_url: formData.instagram_url || null,
        twitter_url: formData.twitter_url || null,
        facebook_url: formData.facebook_url || null,
        tiktok_url: formData.tiktok_url || null,
      })
      .eq('id', profile.id);

    setSaving(false);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
    }
  };

  const handleChangeUsername = async () => {
    if (!canChangeUsername()) {
      toast.error(`You can change your username again in ${daysUntilUsernameChange()} days`);
      return;
    }

    try {
      usernameSchema.parse(newUsername);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    if (newUsername === profile.username) {
      toast.error('New username must be different');
      return;
    }

    setChangingUsername(true);

    // Check if username is taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', newUsername)
      .neq('id', profile.id)
      .single();

    if (existingUser) {
      setChangingUsername(false);
      toast.error('This username is already taken');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        username: newUsername,
        username_last_changed_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    setChangingUsername(false);

    if (error) {
      if (error.code === '23505') {
        toast.error('This username is already taken');
      } else {
        toast.error('Failed to change username');
      }
    } else {
      setUsernameLastChanged(new Date());
      toast.success('Username changed successfully');
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

    setSavingBirthday(true);

    const { error } = await supabase
      .from('profiles')
      .update({ birthday })
      .eq('id', profile.id);

    setSavingBirthday(false);

    if (error) {
      toast.error('Failed to save birthday');
    } else {
      if (age < 16) {
        toast.success('Birthday saved! Connect a guardian account to trade.');
      } else {
        toast.success('Birthday saved!');
      }
    }
  };

  const handleApproveGuardianRequest = async (requesterId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ guardian_verified: true })
      .eq('id', requesterId);

    if (error) {
      toast.error('Failed to approve guardian request');
    } else {
      toast.success('Guardian connection approved!');
      setPendingGuardianRequests(prev => prev.filter(r => r.id !== requesterId));
    }
  };

  const handleRejectGuardianRequest = async (requesterId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ guardian_id: null, guardian_verified: false })
      .eq('id', requesterId);

    if (error) {
      toast.error('Failed to reject request');
    } else {
      toast.success('Guardian request rejected');
      setPendingGuardianRequests(prev => prev.filter(r => r.id !== requesterId));
    }
  };

  const handleRemoveGuardian = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ guardian_id: null, guardian_verified: false })
      .eq('id', profile.id);

    if (error) {
      toast.error('Failed to remove guardian');
    } else {
      setGuardianInfo(null);
      toast.success('Guardian link removed');
    }
  };

  const handleLinkGuardian = async () => {
    if (!guardianCode.trim()) {
      toast.error('Please enter a guardian username or referral code');
      return;
    }

    setLinkingGuardian(true);

    // Find guardian by username or referral code
    const { data: guardian, error: findError } = await supabase
      .from('profiles')
      .select('id, username, birthday')
      .or(`username.eq.${guardianCode.toLowerCase()},referral_code.eq.${guardianCode.toUpperCase()}`)
      .single();

    if (findError || !guardian) {
      setLinkingGuardian(false);
      toast.error('Guardian account not found');
      return;
    }

    // Check guardian is 18+
    if (guardian.birthday) {
      const guardianAge = calculateAge(guardian.birthday);
      if (guardianAge < 18) {
        setLinkingGuardian(false);
        toast.error('Guardian must be at least 18 years old');
        return;
      }
    } else {
      setLinkingGuardian(false);
      toast.error('Guardian has not set their birthday');
      return;
    }

    // Link guardian and create notification
    const { error } = await supabase
      .from('profiles')
      .update({ guardian_id: guardian.id, guardian_verified: false })
      .eq('id', profile.id);

    if (error) {
      setLinkingGuardian(false);
      toast.error('Failed to link guardian account');
      return;
    }

    // Create notification for guardian
    await supabase.from('notifications').insert({
      user_id: guardian.id,
      type: 'guardian_request',
      title: 'Guardian Request',
      message: `@${profile.username} wants you to be their guardian account. Please approve or reject in your settings.`,
      data: { requester_id: profile.id, requester_username: profile.username },
    });

    setLinkingGuardian(false);
    setGuardianInfo({ username: guardian.username, verified: false });
    setGuardianCode('');
    toast.success('Guardian account linked! They will receive a notification to approve.');
  };

  const handleChangeEmail = async () => {
    if (!newEmail || newEmail === user.email) {
      toast.error('Please enter a new email address');
      return;
    }

    setChangingEmail(true);

    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    setChangingEmail(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Verification email sent to your new address. Please check both inboxes.');
      setNewEmail('');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setChangingPassword(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleIdUpload = async (url: string) => {
    if (!url) return;

    setUploadingId(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        id_document_url: url,
        id_verification_status: 'pending',
        id_submitted_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    setUploadingId(false);

    if (error) {
      toast.error('Failed to submit ID for verification');
    } else {
      setIdVerification({ status: 'pending', documentUrl: url });
      toast.success('ID submitted for verification');
    }
  };

  const getVerificationBadge = () => {
    switch (idVerification.status) {
      case 'verified':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Pending Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Shield className="w-3 h-3 mr-1" />
            Not Verified
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to={`/profile/${profile.username}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Link>
          </Button>

          <h1 className="text-3xl font-serif font-bold mb-6">Settings</h1>

          <Tabs defaultValue="profile">
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger value="profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="account">
                <Settings2 className="w-4 h-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="verification">
                <Shield className="w-4 h-4 mr-2" />
                ID Verification
              </TabsTrigger>
              <TabsTrigger value="social">
                <LinkIcon className="w-4 h-4 mr-2" />
                Social Links
              </TabsTrigger>
              <TabsTrigger value="privacy">
                <Shield className="w-4 h-4 mr-2" />
                Privacy
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin">
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  Admin
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your public profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Profile Picture</Label>
                    <ImageUpload
                      bucket="avatars"
                      folder={user.id}
                      currentImage={formData.avatar_url}
                      onUpload={(url) => setFormData({ ...formData, avatar_url: url })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="Your display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell others about yourself..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.bio.length}/500 characters
                    </p>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <div className="space-y-6">
                {/* Username Change */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Change Username
                    </CardTitle>
                    <CardDescription>
                      You can change your username once every 14 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                        placeholder="yourname"
                        disabled={!canChangeUsername()}
                      />
                      {!canChangeUsername() && (
                        <p className="text-xs text-muted-foreground">
                          You can change your username again in {daysUntilUsernameChange()} days
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={handleChangeUsername} 
                      disabled={changingUsername || !canChangeUsername()}
                    >
                      {changingUsername ? 'Changing...' : 'Change Username'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Trade Matches Toggle */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowLeftRight className="w-5 h-5" />
                      Trade Matches
                    </CardTitle>
                    <CardDescription>
                      Get notified when someone wants a fragrance from your collection
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="trade-matches">Enable Trade Matches</Label>
                        <p className="text-sm text-muted-foreground">
                          We'll scan other users' wishlists and notify you of potential trades
                        </p>
                      </div>
                      <Switch
                        id="trade-matches"
                        checked={tradeMatchesEnabled}
                        onCheckedChange={handleToggleTradeMatches}
                        disabled={savingTradeMatches}
                      />
                    </div>
                    {tradeMatchesEnabled && (
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/trade-matches">
                          <ArrowLeftRight className="w-4 h-4 mr-2" />
                          View Trade Matches
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Birthday */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Birthday
                    </CardTitle>
                    <CardDescription>
                      Required for verification. Must be 13+ to join, 16+ for full access.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                      <Gift className="w-5 h-5 text-primary" />
                      <span className="text-sm">Get a <strong>$5 credit</strong> on your birthday (verified from your ID)!</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                      <p><strong>Age 13-15:</strong> Can join but need a guardian account (18+) to buy/trade</p>
                      <p><strong>Age 16+:</strong> Full access with no restrictions</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthday">Date of Birth</Label>
                      <Input
                        id="birthday"
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                      />
                    </div>
                    <Button onClick={handleSaveBirthday} disabled={savingBirthday}>
                      {savingBirthday ? 'Saving...' : 'Save Birthday'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Guardian Account - Show for users under 16 OR anyone with a guardian linked */}
                {(userAge !== null && userAge < 16) || guardianInfo ? (
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Guardian Account
                      </CardTitle>
                      <CardDescription>
                        {userAge !== null && userAge >= 16 
                          ? 'You no longer need a guardian since you are 16+' 
                          : 'Required for users under 16 to buy/trade'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {userAge !== null && userAge < 16 && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            Since you're under 16, you need a guardian account (18+) linked to buy or trade fragrances.
                          </p>
                        </div>
                      )}

                      {guardianInfo ? (
                        <div className="space-y-3">
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Linked Guardian: @{guardianInfo.username}</p>
                                <p className="text-sm text-muted-foreground">
                                  {guardianInfo.verified 
                                    ? 'Connection verified' 
                                    : 'Pending guardian verification'}
                                </p>
                              </div>
                              {guardianInfo.verified ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleRemoveGuardian}
                            className="text-destructive hover:text-destructive"
                          >
                            Remove Guardian Link
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="guardian-code">Guardian Username or Referral Code</Label>
                            <Input
                              id="guardian-code"
                              value={guardianCode}
                              onChange={(e) => setGuardianCode(e.target.value)}
                              placeholder="Enter guardian's username or referral code"
                            />
                          </div>
                          <Button onClick={handleLinkGuardian} disabled={linkingGuardian}>
                            {linkingGuardian ? 'Linking...' : 'Link Guardian Account'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                {/* Guardian Requests - For users 18+ to approve young users */}
                {pendingGuardianRequests.length > 0 && (
                  <Card className="border-border/50 border-primary/30 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Pending Guardian Requests
                      </CardTitle>
                      <CardDescription>
                        Young users want you to be their guardian account
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {pendingGuardianRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                          <div>
                            <p className="font-medium">@{request.username}</p>
                            <p className="text-sm text-muted-foreground">Wants you to be their guardian</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveGuardianRequest(request.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectGuardianRequest(request.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Change Email
                    </CardTitle>
                    <CardDescription>
                      Current email: {user.email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-email">New Email Address</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="newemail@example.com"
                      />
                    </div>
                    <Button onClick={handleChangeEmail} disabled={changingEmail}>
                      {changingEmail ? 'Sending...' : 'Change Email'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Password Change */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Change Password
                    </CardTitle>
                    <CardDescription>
                      Update your account password
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <Button onClick={handleChangePassword} disabled={changingPassword}>
                      {changingPassword ? 'Changing...' : 'Change Password'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationPreferences />
            </TabsContent>

            <TabsContent value="verification">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>ID Verification</CardTitle>
                      <CardDescription>
                        Verify your identity to unlock trading
                      </CardDescription>
                    </div>
                    {getVerificationBadge()}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Why verify?</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Required to complete trades on the platform</li>
                      <li>• Builds trust with other traders</li>
                      <li>• Protects against fraud and scams</li>
                      <li>• Verified badge on your profile</li>
                      <li>• Birthday credit verification</li>
                    </ul>
                  </div>

                  {idVerification.status === 'verified' ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-lg">You're Verified!</h3>
                      <p className="text-muted-foreground">
                        Your identity has been confirmed. You can now trade freely.
                      </p>
                    </div>
                  ) : idVerification.status === 'pending' ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                      <h3 className="font-semibold text-lg">Verification Pending</h3>
                      <p className="text-muted-foreground">
                        We're reviewing your ID. This usually takes 1-2 business days.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {idVerification.status === 'rejected' && (
                        <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 flex gap-3">
                          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-destructive">Verification rejected</p>
                            <p className="text-sm text-muted-foreground">
                              Your previous submission was not accepted. Please upload a new, clear photo of your government-issued ID below to resubmit.
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>{idVerification.status === 'rejected' ? 'Resubmit Government ID' : 'Upload Government ID'}</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Upload a clear photo of your government-issued ID (passport, driver's license, or national ID card).
                        </p>
                        <ImageUpload
                          bucket="id-verification"
                          folder={user.id}
                          onUpload={handleIdUpload}
                          accept="image/*"
                          maxSize={10}
                        />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Your ID will be securely stored and only used for verification purposes. 
                        We do not share your information with third parties.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Social Media Links</CardTitle>
                  <CardDescription>Connect your social accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <div className="flex items-center gap-2">
                      <Instagram className="w-5 h-5 text-muted-foreground" />
                      <Input
                        id="instagram"
                        value={formData.instagram_url}
                        onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                        placeholder="https://instagram.com/username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter / X</Label>
                    <div className="flex items-center gap-2">
                      <Twitter className="w-5 h-5 text-muted-foreground" />
                      <Input
                        id="twitter"
                        value={formData.twitter_url}
                        onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-muted-foreground" />
                      <Input
                        id="facebook"
                        value={formData.facebook_url}
                        onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                        placeholder="https://facebook.com/username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok</Label>
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-muted-foreground" />
                      <Input
                        id="tiktok"
                        value={formData.tiktok_url}
                        onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                        placeholder="https://tiktok.com/@username"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving} className="mt-4">
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Social Links'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <BlockedUsersManager />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin">
                <AdminAlertSettings />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Settings;