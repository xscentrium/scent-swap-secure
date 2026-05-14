import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Pin, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { SEO } from "@/components/SEO";

export default function ForumThread() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [thread, setThread] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data: t } = await supabase.from("forum_threads")
      .select("*, profiles:profile_id(username, display_name)")
      .eq("id", id).single();
    setThread(t);
    const { data: r } = await supabase.from("forum_replies")
      .select("*, profiles:profile_id(username, display_name)")
      .eq("thread_id", id).order("created_at", { ascending: true });
    setReplies(r ?? []);
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id").eq("user_id", user.id).single().then(({ data }) => setProfileId(data?.id ?? null));
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const vote = async (target_type: "thread" | "reply", target_id: string, value: 1 | -1) => {
    if (!profileId) return toast.error("Sign in to vote");
    await supabase.from("forum_votes").upsert(
      { profile_id: profileId, target_type, target_id, value },
      { onConflict: "profile_id,target_type,target_id" }
    );
    load();
  };

  const post = async () => {
    if (!profileId || !id || !reply.trim()) return;
    const { error } = await supabase.from("forum_replies").insert({ thread_id: id, profile_id: profileId, body: reply.trim() });
    if (error) return toast.error(error.message);
    setReply(""); load();
  };

  const togglePin = async () => {
    if (!thread) return;
    await supabase.from("forum_threads").update({ is_pinned: !thread.is_pinned }).eq("id", thread.id);
    load();
  };
  const toggleLock = async () => {
    if (!thread) return;
    await supabase.from("forum_threads").update({ is_locked: !thread.is_locked }).eq("id", thread.id);
    load();
  };

  if (!thread) return <div className="container py-8">Loading…</div>;

  const threadTitle = `${thread.title} | Xscentrium Forum`;
  const threadDesc = (thread.body || `Community discussion on Xscentrium: ${thread.title}`).slice(0, 160);
  const forumLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: thread.title,
    text: thread.body || undefined,
    datePublished: thread.created_at,
    author: thread.profiles?.display_name || thread.profiles?.username || "Xscentrium member",
  };

  return (
    <div className="container max-w-3xl py-8 space-y-4">
      <SEO title={threadTitle} description={threadDesc} path={`/forum/thread/${thread.id}`} type="article" jsonLd={forumLd} />
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <button onClick={() => vote("thread", thread.id, 1)}><ArrowUp className="h-5 w-5" /></button>
            <span className="font-semibold">{thread.upvotes}</span>
            <button onClick={() => vote("thread", thread.id, -1)}><ArrowDown className="h-5 w-5" /></button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {thread.is_pinned && <Pin className="h-4 w-4 text-primary" />}
              {thread.is_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
              <h1 className="text-2xl font-serif">{thread.title}</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              by @{thread.profiles?.username} · {format(new Date(thread.created_at), "PPp")}
            </p>
            <p className="mt-4 whitespace-pre-wrap">{thread.body}</p>
            {isAdmin && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={togglePin}>{thread.is_pinned ? "Unpin" : "Pin"}</Button>
                <Button size="sm" variant="outline" onClick={toggleLock}>{thread.is_locked ? "Unlock" : "Lock"}</Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <h2 className="font-semibold">{replies.length} repl{replies.length === 1 ? "y" : "ies"}</h2>
      {replies.map(r => (
        <Card key={r.id} className="p-4">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <button onClick={() => vote("reply", r.id, 1)}><ArrowUp className="h-4 w-4" /></button>
              <span className="text-sm">{r.upvotes}</span>
              <button onClick={() => vote("reply", r.id, -1)}><ArrowDown className="h-4 w-4" /></button>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">@{r.profiles?.username} · {format(new Date(r.created_at), "PPp")}</p>
              <p className="mt-2 whitespace-pre-wrap">{r.body}</p>
            </div>
          </div>
        </Card>
      ))}

      {!thread.is_locked && profileId && (
        <Card className="p-4">
          <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Add a reply…" rows={4} />
          <Button onClick={post} className="mt-2" disabled={!reply.trim()}>Reply</Button>
        </Card>
      )}
      {thread.is_locked && <p className="text-sm text-muted-foreground">This thread is locked.</p>}
    </div>
  );
}
