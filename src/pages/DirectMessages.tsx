import { useState, useEffect, useRef } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, ArrowLeft, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const DirectMessages = () => {
  const { recipientId } = useParams<{ recipientId: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch recipient profile
  const { data: recipient, isLoading: recipientLoading } = useQuery({
    queryKey: ["profile-by-id", recipientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", recipientId)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!recipientId,
  });

  // Fetch messages between the two users
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["direct-messages", profile?.id, recipientId],
    queryFn: async () => {
      if (!profile?.id || !recipientId) return [];
      
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${profile.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${profile.id})`
        )
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!profile?.id && !!recipientId,
  });

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      if (!profile?.id || !recipientId) return;
      
      await supabase
        .from("direct_messages")
        .update({ read: true })
        .eq("sender_id", recipientId)
        .eq("receiver_id", profile.id)
        .eq("read", false);
    };
    
    if (messages && messages.length > 0) {
      markAsRead();
    }
  }, [messages, profile?.id, recipientId]);

  // Realtime subscription
  useEffect(() => {
    if (!profile?.id || !recipientId) return;

    const channel = supabase
      .channel(`dm-${profile.id}-${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === profile.id && newMsg.receiver_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.receiver_id === profile.id)
          ) {
            queryClient.invalidateQueries({ queryKey: ["direct-messages", profile.id, recipientId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, recipientId, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile?.id || !recipientId) return;

    setIsSending(true);
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: profile.id,
      receiver_id: recipientId,
      message: newMessage.trim(),
    });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
    setIsSending(false);
  };

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

  if (recipientLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!recipient) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center pt-32">
          <h1 className="text-2xl font-serif font-bold mb-2">User not found</h1>
          <Button asChild>
            <Link to="/messages">Back to Messages</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <Card className="h-[calc(100vh-180px)] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/messages">
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                </Button>
                <Avatar>
                  <AvatarImage src={recipient.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">
                    {recipient.display_name || recipient.username}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">@{recipient.username}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === profile?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                )}
              </ScrollArea>

              <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isSending}
                  className="flex-1"
                />
                <Button type="submit" disabled={isSending || !newMessage.trim()}>
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DirectMessages;