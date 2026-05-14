import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { FollowButton } from "@/components/FollowButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/SEO";
import { 
  Compass, 
  Users, 
  Sparkles, 
  Package, 
  Star,
  TrendingUp,
  Heart
} from "lucide-react";

interface DiscoveryUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_influencer: boolean;
  collection_count: number;
  matching_fragrances: string[];
}

const DiscoverUsers = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("similar");

  // Get current user's collection
  const { data: myCollection } = useQuery({
    queryKey: ["my-collection-names", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from("collection_items")
        .select("name, brand")
        .eq("profile_id", profile.id);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Discover users with similar collections
  const { data: similarUsers, isLoading: loadingSimilar } = useQuery({
    queryKey: ["discover-similar", profile?.id, myCollection],
    queryFn: async () => {
      if (!profile?.id || !myCollection || myCollection.length === 0) return [];

      // Get all collection items
      const { data: allCollections } = await supabase
        .from("collection_items")
        .select(`
          name, brand, profile_id,
          profiles:public_profiles!collection_items_profile_id_fkey(id, username, display_name, avatar_url, bio, is_influencer)
        `)
        .neq("profile_id", profile.id);

      if (!allCollections) return [];

      // Calculate similarity scores
      const userScores = new Map<string, {
        profile: any;
        matchingFragrances: string[];
        totalItems: number;
      }>();

      const myFragranceSet = new Set(
        myCollection.map(f => `${f.brand}|${f.name}`.toLowerCase())
      );

      allCollections.forEach(item => {
        const key = `${item.brand}|${item.name}`.toLowerCase();
        const profileData = item.profiles;
        if (!profileData) return;

        if (!userScores.has(item.profile_id)) {
          userScores.set(item.profile_id, {
            profile: profileData,
            matchingFragrances: [],
            totalItems: 0,
          });
        }

        const userData = userScores.get(item.profile_id)!;
        userData.totalItems++;

        if (myFragranceSet.has(key)) {
          userData.matchingFragrances.push(`${item.brand} ${item.name}`);
        }
      });

      // Filter users with at least 1 matching fragrance and sort by matches
      return Array.from(userScores.entries())
        .filter(([_, data]) => data.matchingFragrances.length > 0)
        .sort((a, b) => b[1].matchingFragrances.length - a[1].matchingFragrances.length)
        .slice(0, 20)
        .map(([id, data]) => ({
          id: data.profile.id,
          username: data.profile.username,
          display_name: data.profile.display_name,
          avatar_url: data.profile.avatar_url,
          bio: data.profile.bio,
          is_influencer: data.profile.is_influencer,
          collection_count: data.totalItems,
          matching_fragrances: data.matchingFragrances.slice(0, 3),
        })) as DiscoveryUser[];
    },
    enabled: !!profile?.id && !!myCollection && myCollection.length > 0,
  });

  // Get popular users (most followers)
  const { data: popularUsers, isLoading: loadingPopular } = useQuery({
    queryKey: ["discover-popular", profile?.id],
    queryFn: async () => {
      // Get follow counts
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id");

      if (!follows) return [];

      const followerCounts = new Map<string, number>();
      follows.forEach(f => {
        followerCounts.set(f.following_id, (followerCounts.get(f.following_id) || 0) + 1);
      });

      // Get top followed users
      const topIds = Array.from(followerCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([id]) => id);

      if (topIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("id, username, display_name, avatar_url, bio, is_influencer")
        .in("id", topIds)
        .neq("id", profile?.id || "");

      if (!profiles) return [];

      return profiles.map(p => ({
        ...p,
        collection_count: 0,
        matching_fragrances: [],
        follower_count: followerCounts.get(p.id) || 0,
      })).sort((a, b) => b.follower_count - a.follower_count);
    },
    enabled: !!profile?.id,
  });

  // Get new users
  const { data: newUsers, isLoading: loadingNew } = useQuery({
    queryKey: ["discover-new", profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("public_profiles")
        .select("id, username, display_name, avatar_url, bio, is_influencer, created_at")
        .neq("id", profile?.id || "")
        .order("created_at", { ascending: false })
        .limit(20);

      return data || [];
    },
    enabled: !!profile?.id,
  });

  const UserCard = ({ user, showMatches = false }: { user: any; showMatches?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Link to={`/profile/${user.username}`}>
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/profile/${user.username}`} className="font-medium hover:underline">
                {user.display_name || user.username}
              </Link>
              {user.is_influencer && (
                <Badge className="bg-primary text-primary-foreground text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Influencer
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            {user.bio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
            )}
            {showMatches && user.matching_fragrances?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Shared:</span>
                {user.matching_fragrances.map((f: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {f}
                  </Badge>
                ))}
              </div>
            )}
            {user.follower_count !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                {user.follower_count} followers
              </p>
            )}
          </div>
          <FollowButton
            targetProfileId={user.id}
            targetUsername={user.username}
            size="sm"
            showIcon={false}
          />
        </div>
      </CardContent>
    </Card>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 text-center">
          <Compass className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-serif font-bold mb-2">Discover Users</h1>
          <p className="text-muted-foreground mb-4">Sign in to discover collectors with similar tastes</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Discover Collectors & Influencers | Xscentrium"
        description="Find verified fragrance collectors and influencers to follow. Connect with traders who share your taste in colognes, perfumes and oils."
        path="/discover/users"
      />
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <Compass className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-serif font-bold mb-2">Discover</h1>
            <p className="text-muted-foreground">
              Find and follow collectors with similar tastes
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="similar" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Similar
              </TabsTrigger>
              <TabsTrigger value="popular" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Popular
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2">
                <Users className="w-4 h-4" />
                New
              </TabsTrigger>
            </TabsList>

            <TabsContent value="similar">
              {loadingSimilar ? (
                <LoadingSkeleton />
              ) : similarUsers && similarUsers.length > 0 ? (
                <div className="space-y-4">
                  {similarUsers.map(user => (
                    <UserCard key={user.id} user={user} showMatches />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium mb-2">No similar collectors found</h3>
                    <p className="text-sm text-muted-foreground">
                      Add fragrances to your collection to find users with similar tastes
                    </p>
                    <Button className="mt-4" asChild>
                      <Link to={`/profile/${profile.username}`}>Go to Collection</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="popular">
              {loadingPopular ? (
                <LoadingSkeleton />
              ) : popularUsers && popularUsers.length > 0 ? (
                <div className="space-y-4">
                  {popularUsers.map(user => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No users found</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="new">
              {loadingNew ? (
                <LoadingSkeleton />
              ) : newUsers && newUsers.length > 0 ? (
                <div className="space-y-4">
                  {newUsers.map(user => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No new users</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DiscoverUsers;