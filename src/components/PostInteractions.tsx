import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Heart, MessageCircle, Send, Loader2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface PostInteractionsProps {
  postId: string;
  postType: "sotd" | "collection";
}

interface Comment {
  id: string;
  profile_id: string;
  comment: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function PostInteractions({ postId, postType }: PostInteractionsProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Check if user has liked
  const { data: hasLiked } = useQuery({
    queryKey: ["post-liked", postType, postId, profile?.id],
    queryFn: async () => {
      if (!profile?.id) return false;
      const { data } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_type", postType)
        .eq("post_id", postId)
        .eq("profile_id", profile.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!profile?.id,
  });

  // Get like count
  const { data: likeCount } = useQuery({
    queryKey: ["post-likes-count", postType, postId],
    queryFn: async () => {
      const { count } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_type", postType)
        .eq("post_id", postId);
      return count || 0;
    },
  });

  // Get comments
  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["post-comments", postType, postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          id, profile_id, comment, created_at,
          profiles!post_comments_profile_id_fkey(username, display_name, avatar_url)
        `)
        .eq("post_type", postType)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Comment[];
    },
    enabled: showComments,
  });

  const toggleLike = async () => {
    if (!profile?.id) {
      toast.error("Please sign in to like posts");
      return;
    }

    setIsLiking(true);
    if (hasLiked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_type", postType)
        .eq("post_id", postId)
        .eq("profile_id", profile.id);
    } else {
      await supabase.from("post_likes").insert({
        post_type: postType,
        post_id: postId,
        profile_id: profile.id,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["post-liked", postType, postId] });
    queryClient.invalidateQueries({ queryKey: ["post-likes-count", postType, postId] });
    setIsLiking(false);
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !newComment.trim()) return;

    setIsCommenting(true);
    const { error } = await supabase.from("post_comments").insert({
      post_type: postType,
      post_id: postId,
      profile_id: profile.id,
      comment: newComment.trim(),
    });

    if (error) {
      toast.error("Failed to add comment");
    } else {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["post-comments", postType, postId] });
    }
    setIsCommenting(false);
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast.error("Failed to delete comment");
    } else {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postType, postId] });
    }
  };

  return (
    <div className="flex items-center gap-3 mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLike}
        disabled={isLiking || !user}
        className="gap-1.5 h-8 px-2"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            hasLiked ? "fill-red-500 text-red-500" : ""
          }`}
        />
        {likeCount !== undefined && likeCount > 0 && (
          <span className="text-xs">{likeCount}</span>
        )}
      </Button>

      <Popover open={showComments} onOpenChange={setShowComments}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2">
            <MessageCircle className="w-4 h-4" />
            {comments && comments.length > 0 && (
              <span className="text-xs">{comments.length}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm">Comments</h4>
          </div>
          <ScrollArea className="h-64 p-3">
            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 group">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {comment.profiles?.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/profile/${comment.profiles?.username}`}
                          className="text-xs font-medium hover:underline"
                        >
                          @{comment.profiles?.username}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        {profile?.id === comment.profile_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteComment(comment.id)}
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm break-words">{comment.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No comments yet
              </div>
            )}
          </ScrollArea>
          {user && (
            <form onSubmit={submitComment} className="p-3 border-t flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isCommenting}
                className="flex-1 h-8 text-sm"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isCommenting || !newComment.trim()}
                className="h-8 w-8 p-0"
              >
                {isCommenting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}