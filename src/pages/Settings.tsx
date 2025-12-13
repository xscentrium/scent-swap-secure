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
  ArrowLeft, Loader2, User, Shield, Link as LinkIcon, 
  Instagram, Twitter, CheckCircle, AlertCircle, Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const profileSchema = z.object({
  display_name: z.string().min(1).max(50),
  bio: z.string().max(500).optional(),
  instagram_url: z.string().url().optional().or(z.literal('')),
  twitter_url: z.string().url().optional().or(z.literal('')),
  facebook_url: z.string().url().optional().or(z.literal('')),
  tiktok_url: z.string().url().optional().or(z.literal('')),
});

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

      // Fetch ID verification status
      fetchIdStatus();
    }
  }, [profile]);

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
            <TabsList className="mb-6">
              <TabsTrigger value="profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="verification">
                <Shield className="w-4 h-4 mr-2" />
                ID Verification
              </TabsTrigger>
              <TabsTrigger value="social">
                <LinkIcon className="w-4 h-4 mr-2" />
                Social Links
              </TabsTrigger>
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
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Username cannot be changed
                    </p>
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
                      <div className="space-y-2">
                        <Label>Upload Government ID</Label>
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
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Settings;
