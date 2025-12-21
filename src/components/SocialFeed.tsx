import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Sparkles, 
  ArrowLeftRight, 
  Package,
  Calendar,
  Heart,
  MessageCircle,
  UserPlus
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface ScentLog {
  id: string;
  fragrance_name: string;
  fragrance_brand: string;
  logged_date: string;
  occasion: string | null;
  mood: string | null;
  rating: number | null;
  profile_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface CollectionItem {
  id: string;
  name: string;
  brand: string;
  created_at: string;
  profile_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface Trade {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  initiator_id: string;
  receiver_id: string;
  initiator_listing: {
    name: string;
    brand: string;
  };
  receiver_listing: {
    name: string;
    brand: string;
  } | null;
  initiator: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  receiver: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function SocialFeed() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  // Get followed users
  const { data: followedUsers } = useQuery({
    queryKey: ["followed-users", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", profile.id);
      if (error) throw error;
      return data.map(f => f.following_id);
    },
    enabled: !!profile?.id,
  });

  // Get friends' SOTD picks
  const { data: sotdPicks, isLoading: sotdLoading } = useQuery({
    queryKey: ["friends-sotd", followedUsers],
    queryFn: async () => {
      if (!followedUsers || followedUsers.length === 0) return [];
      const { data, error } = await supabase
        .from("scent_logs")
        .select(`
          id, fragrance_name, fragrance_brand, logged_date, occasion, mood, rating, profile_id,
          profiles!scent_logs_profile_id_fkey(username, display_name, avatar_url)
        `)
        .in("profile_id", followedUsers)
        .order("logged_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as unknown as ScentLog[];
    },
    enabled: !!followedUsers && followedUsers.length > 0,
  });

  // Get friends' collection additions
  const { data: collectionAdditions, isLoading: collectionLoading } = useQuery({
    queryKey: ["friends-collection", followedUsers],
    queryFn: async () => {
      if (!followedUsers || followedUsers.length === 0) return [];
      const { data, error } = await supabase
        .from("collection_items")
        .select(`
          id, name, brand, created_at, profile_id,
          profiles!collection_items_profile_id_fkey(username, display_name, avatar_url)
        `)
        .in("profile_id", followedUsers)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as unknown as CollectionItem[];
    },
    enabled: !!followedUsers && followedUsers.length > 0,
  });

  // Get friends' completed trades
  const { data: trades, isLoading: tradesLoading } = useQuery({
    queryKey: ["friends-trades", followedUsers],
    queryFn: async () => {
      if (!followedUsers || followedUsers.length === 0) return [];
      const { data, error } = await supabase
        .from("trades")
        .select(`
          id, status, created_at, updated_at, initiator_id, receiver_id,
          initiator_listing:listings!trades_initiator_listing_id_fkey(name, brand),
          receiver_listing:listings!trades_receiver_listing_id_fkey(name, brand),
          initiator:profiles!trades_initiator_id_fkey(username, display_name, avatar_url),
          receiver:profiles!trades_receiver_id_fkey(username, display_name, avatar_url)
        `)
        .eq("status", "completed")
        .or(`initiator_id.in.(${followedUsers.join(",")}),receiver_id.in.(${followedUsers.join(",")})`)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as unknown as Trade[];
    },
    enabled: !!followedUsers && followedUsers.length > 0,
  });

  const isLoading = sotdLoading || collectionLoading || tradesLoading;
  const hasFollowing = followedUsers && followedUsers.length > 0;

  // Combine all activities for the "all" tab
  const allActivities = [
    ...(sotdPicks?.map(s => ({ type: 'sotd' as const, data: s, date: new Date(s.logged_date) })) || []),
    ...(collectionAdditions?.map(c => ({ type: 'collection' as const, data: c, date: new Date(c.created_at) })) || []),
    ...(trades?.map(t => ({ type: 'trade' as const, data: t, date: new Date(t.updated_at) })) || []),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 30);

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Social Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Sign in to see your friends' activity</p>
            <Button className="mt-4" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasFollowing && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Social Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Follow other collectors to see their activity</p>
            <p className="text-sm mt-1">Discover SOTD picks, trades, and collection updates</p>
            <Button className="mt-4" variant="outline" asChild>
              <Link to="/leaderboard">Find Users to Follow</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Social Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sotd">SOTD</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="collection">Collection</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <TabsContent value="all" className="mt-0">
                  {allActivities.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <div className="space-y-4">
                      {allActivities.map((activity, idx) => (
                        <ActivityCard key={`${activity.type}-${idx}`} activity={activity} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="sotd" className="mt-0">
                  {!sotdPicks || sotdPicks.length === 0 ? (
                    <EmptyState message="No SOTD picks from friends yet" />
                  ) : (
                    <div className="space-y-4">
                      {sotdPicks.map((sotd) => (
                        <SOTDCard key={sotd.id} sotd={sotd} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="trades" className="mt-0">
                  {!trades || trades.length === 0 ? (
                    <EmptyState message="No completed trades from friends yet" />
                  ) : (
                    <div className="space-y-4">
                      {trades.map((trade) => (
                        <TradeCard key={trade.id} trade={trade} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="collection" className="mt-0">
                  {!collectionAdditions || collectionAdditions.length === 0 ? (
                    <EmptyState message="No new collection items from friends yet" />
                  ) : (
                    <div className="space-y-4">
                      {collectionAdditions.map((item) => (
                        <CollectionCard key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message = "No activity from friends yet" }: { message?: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ActivityCard({ activity }: { activity: { type: 'sotd' | 'collection' | 'trade'; data: unknown; date: Date } }) {
  if (activity.type === 'sotd') {
    return <SOTDCard sotd={activity.data as ScentLog} />;
  }
  if (activity.type === 'collection') {
    return <CollectionCard item={activity.data as CollectionItem} />;
  }
  if (activity.type === 'trade') {
    return <TradeCard trade={activity.data as Trade} />;
  }
  return null;
}

function SOTDCard({ sotd }: { sotd: ScentLog }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={sotd.profiles?.avatar_url || undefined} />
        <AvatarFallback>{sotd.profiles?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/profile/${sotd.profiles?.username}`} className="font-medium text-sm hover:underline">
            @{sotd.profiles?.username}
          </Link>
          <Badge variant="secondary" className="gap-1">
            <Calendar className="h-3 w-3" />
            SOTD
          </Badge>
        </div>
        <p className="text-sm font-medium mt-1">
          <span className="text-primary">{sotd.fragrance_name}</span>
          <span className="text-muted-foreground"> by {sotd.fragrance_brand}</span>
        </p>
        {sotd.occasion && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Occasion: {sotd.occasion}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(sotd.logged_date), { addSuffix: true })}
        </p>
      </div>
      {sotd.rating && (
        <div className="flex items-center gap-1 text-yellow-500">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">{sotd.rating}/5</span>
        </div>
      )}
    </div>
  );
}

function CollectionCard({ item }: { item: CollectionItem }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={item.profiles?.avatar_url || undefined} />
        <AvatarFallback>{item.profiles?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/profile/${item.profiles?.username}`} className="font-medium text-sm hover:underline">
            @{item.profiles?.username}
          </Link>
          <Badge variant="outline" className="gap-1">
            <Package className="h-3 w-3" />
            New Addition
          </Badge>
        </div>
        <p className="text-sm font-medium mt-1">
          Added <span className="text-primary">{item.name}</span>
          <span className="text-muted-foreground"> by {item.brand}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

function TradeCard({ trade }: { trade: Trade }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
        <ArrowLeftRight className="h-5 w-5 text-green-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/profile/${trade.initiator?.username}`} className="font-medium text-sm hover:underline">
            @{trade.initiator?.username}
          </Link>
          <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
          <Link to={`/profile/${trade.receiver?.username}`} className="font-medium text-sm hover:underline">
            @{trade.receiver?.username}
          </Link>
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            Completed
          </Badge>
        </div>
        <p className="text-sm mt-1">
          <span className="text-primary">{trade.initiator_listing?.name}</span>
          <span className="text-muted-foreground"> ↔ </span>
          <span className="text-primary">{trade.receiver_listing?.name || 'Item'}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(trade.updated_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
