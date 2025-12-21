import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { CollectionManager } from '@/components/CollectionManager';
import { WishlistManager } from '@/components/WishlistManager';
import { FavoritesManager } from '@/components/FavoritesManager';
import { UserBadges } from '@/components/UserBadges';
import { SampleDecantTracker } from '@/components/SampleDecantTracker';
import { SOTDTracker } from '@/components/SOTDTracker';
import { CollectionValueDashboard } from '@/components/CollectionValueDashboard';
import { FragranceCalendar } from '@/components/FragranceCalendar';
import { StatsCharts } from '@/components/StatsCharts';
import { AchievementsMilestones } from '@/components/AchievementsMilestones';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, Shield, Star, Instagram, Twitter, Facebook, 
  ExternalLink, Copy, CheckCircle, Loader2, Settings, Plus, Package, Heart,
  CalendarDays, TrendingUp, Sparkles, Award
} from 'lucide-react';
import { toast } from 'sonner';

type ProfileData = {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_influencer: boolean;
  referral_code: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  instagram_verified: boolean;
  twitter_verified: boolean;
  facebook_verified: boolean;
  tiktok_verified: boolean;
  created_at: string;
};

type Listing = {
  id: string;
  name: string;
  brand: string;
  price: number | null;
  listing_type: string;
  image_url: string | null;
  condition: string;
};

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { user, profile: currentUserProfile } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwnProfile = currentUserProfile?.username === username;

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      
      if (error) throw error;
      return data as ProfileData | null;
    },
    enabled: !!username,
  });

  const { data: listings } = useQuery({
    queryKey: ['profile-listings', profileData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('owner_id', profileData!.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as Listing[];
    },
    enabled: !!profileData?.id,
  });

  const { data: followersCount } = useQuery({
    queryKey: ['followers-count', profileData?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileData!.id);
      
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profileData?.id,
  });

  const { data: followingCount } = useQuery({
    queryKey: ['following-count', profileData?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileData!.id);
      
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profileData?.id,
  });

  // Check if current user follows this profile
  useEffect(() => {
    const checkFollowing = async () => {
      if (!currentUserProfile?.id || !profileData?.id || isOwnProfile) return;
      
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserProfile.id)
        .eq('following_id', profileData.id)
        .maybeSingle();
      
      setIsFollowing(!!data);
    };
    
    checkFollowing();
  }, [currentUserProfile?.id, profileData?.id, isOwnProfile]);

  const handleFollow = async () => {
    if (!currentUserProfile?.id || !profileData?.id) {
      toast.error('Please sign in to follow users');
      return;
    }

    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserProfile.id)
        .eq('following_id', profileData.id);
      
      if (error) {
        toast.error('Failed to unfollow');
      } else {
        setIsFollowing(false);
        toast.success('Unfollowed');
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUserProfile.id,
          following_id: profileData.id,
        });
      
      if (error) {
        toast.error('Failed to follow');
      } else {
        setIsFollowing(true);
        toast.success('Following');
      }
    }
  };

  const copyReferralLink = () => {
    if (profileData?.referral_code) {
      navigator.clipboard.writeText(`${window.location.origin}?ref=${profileData.referral_code}`);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center pt-32">
          <h1 className="text-2xl font-serif font-bold mb-2">User not found</h1>
          <p className="text-muted-foreground mb-4">This profile doesn't exist.</p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Profile Header */}
          <Card className="mb-8 overflow-hidden border-border/50">
            <div className="h-32 gradient-primary" />
            <CardContent className="relative pt-0 pb-6">
              <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
                <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                  <AvatarImage src={profileData.avatar_url ?? undefined} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {profileData.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-serif font-bold">
                      {profileData.display_name || profileData.username}
                    </h1>
                    {profileData.is_influencer && (
                      <Badge className="bg-primary text-primary-foreground">
                        <Star className="w-3 h-3 mr-1" />
                        Influencer
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">@{profileData.username}</p>
                </div>
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <>
                      <Button variant="outline" asChild>
                        <Link to="/settings">
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link to="/create-listing">
                          <Plus className="w-4 h-4 mr-2" />
                          New Listing
                        </Link>
                      </Button>
                    </>
                  ) : user ? (
                    <Button onClick={handleFollow} variant={isFollowing ? 'outline' : 'default'}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link to="/auth">Sign in to Follow</Link>
                    </Button>
                  )}
                </div>
              </div>

              {profileData.bio && (
                <p className="mt-4 text-foreground">{profileData.bio}</p>
              )}

              {/* Stats */}
              <div className="flex gap-6 mt-4">
                <div>
                  <span className="font-bold">{listings?.length ?? 0}</span>
                  <span className="text-muted-foreground ml-1">Listings</span>
                </div>
                <div>
                  <span className="font-bold">{followersCount ?? 0}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-bold">{followingCount ?? 0}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-3 mt-4">
                {profileData.instagram_url && (
                  <a 
                    href={profileData.instagram_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                    {profileData.instagram_verified && <CheckCircle className="w-3 h-3 text-primary" />}
                  </a>
                )}
                {profileData.twitter_url && (
                  <a 
                    href={profileData.twitter_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    {profileData.twitter_verified && <CheckCircle className="w-3 h-3 text-primary" />}
                  </a>
                )}
                {profileData.facebook_url && (
                  <a 
                    href={profileData.facebook_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                    {profileData.facebook_verified && <CheckCircle className="w-3 h-3 text-primary" />}
                  </a>
                )}
              </div>

              {/* Referral Link */}
              {isOwnProfile && profileData.referral_code && (
                <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Your Referral Link</p>
                    <p className="text-xs text-muted-foreground">
                      {window.location.origin}?ref={profileData.referral_code}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={copyReferralLink}>
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Listings */}
          <Tabs defaultValue="listings">
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger value="listings">Listings</TabsTrigger>
              <TabsTrigger value="collection">
                <Package className="w-4 h-4 mr-1" />
                Collection
              </TabsTrigger>
              <TabsTrigger value="wishlist">
                <Heart className="w-4 h-4 mr-1" />
                Wishlist
              </TabsTrigger>
              {isOwnProfile && (
                <TabsTrigger value="favorites">
                  <Heart className="w-4 h-4 mr-1 fill-current" />
                  Favorites
                </TabsTrigger>
              )}
              {isOwnProfile && (
                <>
                  <TabsTrigger value="calendar">
                    <CalendarDays className="w-4 h-4 mr-1" />
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger value="sotd">
                    <Sparkles className="w-4 h-4 mr-1" />
                    SOTD
                  </TabsTrigger>
                  <TabsTrigger value="value">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Value
                  </TabsTrigger>
                  <TabsTrigger value="stats">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Stats
                  </TabsTrigger>
                  <TabsTrigger value="achievements">
                    <Award className="w-4 h-4 mr-1" />
                    Achievements
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="samples">Samples</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="trades">Trade History</TabsTrigger>
            </TabsList>

            <TabsContent value="listings">
              {listings && listings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listings.map((listing) => (
                    <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-square bg-muted">
                        {listing.image_url ? (
                          <img
                            src={listing.image_url}
                            alt={listing.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No Image
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-semibold">{listing.name}</h3>
                        <p className="text-sm text-muted-foreground">{listing.brand}</p>
                        <div className="flex items-center justify-between mt-2">
                          {listing.price && (
                            <span className="font-bold text-primary">${listing.price}</span>
                          )}
                          <Badge variant="outline" className="text-xs">{listing.listing_type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No listings yet</p>
                  {isOwnProfile && (
                    <Button className="mt-4" asChild>
                      <Link to="/create-listing">Create Your First Listing</Link>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="collection">
              <CollectionManager
                profileId={profileData.id}
                userId={profileData.user_id}
                isOwnProfile={isOwnProfile}
                profileUsername={profileData.username}
              />
            </TabsContent>

            <TabsContent value="wishlist">
              <WishlistManager
                profileId={profileData.id}
                profileUsername={profileData.username}
                isOwnProfile={isOwnProfile}
                currentUserProfile={currentUserProfile}
              />
            </TabsContent>

            {isOwnProfile && (
              <TabsContent value="favorites">
                <FavoritesManager showCompareButton={true} />
              </TabsContent>
            )}

            {isOwnProfile && (
              <>
                <TabsContent value="calendar">
                  <FragranceCalendar />
                </TabsContent>

                <TabsContent value="sotd">
                  <SOTDTracker />
                </TabsContent>

                <TabsContent value="value">
                  <CollectionValueDashboard />
                </TabsContent>

                <TabsContent value="stats">
                  <StatsCharts />
                </TabsContent>

                <TabsContent value="achievements">
                  <AchievementsMilestones />
                </TabsContent>
              </>
            )}

            <TabsContent value="samples">
              <SampleDecantTracker />
            </TabsContent>

            <TabsContent value="badges">
              <UserBadges profileId={profileData.id} />
            </TabsContent>

            <TabsContent value="trades">
              <div className="text-center py-12 text-muted-foreground">
                <p>Trade history will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
