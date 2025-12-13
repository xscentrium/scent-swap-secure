import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, MessageCircle, User, Search } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

interface Conversation {
  trade_id: string;
  other_user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  last_message: {
    message: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
  trade_status: string;
}

const Messages = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Get all trades the user is involved in
      const { data: trades, error: tradesError } = await supabase
        .from("trades")
        .select(`
          id,
          status,
          initiator_id,
          receiver_id,
          initiator:profiles!trades_initiator_id_fkey(id, username, display_name, avatar_url),
          receiver:profiles!trades_receiver_id_fkey(id, username, display_name, avatar_url)
        `)
        .or(`initiator_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order("updated_at", { ascending: false });

      if (tradesError) throw tradesError;

      // Get the last message for each trade
      const conversationsWithMessages: Conversation[] = [];

      for (const trade of trades || []) {
        const { data: messages } = await supabase
          .from("trade_messages")
          .select("message, created_at, sender_id")
          .eq("trade_id", trade.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const otherUser =
          trade.initiator_id === profile.id ? trade.receiver : trade.initiator;

        if (messages && messages.length > 0) {
          conversationsWithMessages.push({
            trade_id: trade.id,
            other_user: otherUser as Conversation["other_user"],
            last_message: messages[0],
            unread_count: 0, // Could be enhanced with unread tracking
            trade_status: trade.status,
          });
        }
      }

      return conversationsWithMessages;
    },
    enabled: !!profile?.id,
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trade_messages',
        },
        () => {
          // Refetch conversations when a new message arrives
          queryClient.invalidateQueries({ queryKey: ["conversations", profile.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  // Filter conversations based on search query
  const filteredConversations = conversations?.filter((conversation) => {
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();
    const displayName = conversation.other_user.display_name?.toLowerCase() || "";
    const username = conversation.other_user.username.toLowerCase();
    const message = conversation.last_message.message.toLowerCase();
    return displayName.includes(searchLower) || username.includes(searchLower) || message.includes(searchLower);
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-500";
      case "accepted":
        return "bg-blue-500/20 text-blue-500";
      case "completed":
        return "bg-green-500/20 text-green-500";
      case "declined":
      case "cancelled":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-serif font-bold">Messages</h1>
          </div>

          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredConversations && filteredConversations.length > 0 ? (
            <div className="space-y-3">
              {filteredConversations.map((conversation) => (
                <Link
                  key={conversation.trade_id}
                  to={`/trade/${conversation.trade_id}`}
                >
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={conversation.other_user.avatar_url || undefined}
                          />
                          <AvatarFallback>
                            <User className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold truncate">
                              {conversation.other_user.display_name ||
                                conversation.other_user.username}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getStatusColor(
                                conversation.trade_status
                              )}`}
                            >
                              {conversation.trade_status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message.sender_id === profile?.id
                              ? "You: "
                              : ""}
                            {conversation.last_message.message}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(
                            new Date(conversation.last_message.created_at),
                            { addSuffix: true }
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
                <p className="text-muted-foreground">
                  Start a trade to begin messaging with other users.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;
