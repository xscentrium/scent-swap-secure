import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function ForumNewThread() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [cats, setCats] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { supabase.from("forum_categories").select("*").order("position").then(({ data }) => setCats(data ?? [])); }, []);

  const submit = async () => {
    if (!user) return toast.error("Sign in required");
    if (!categoryId || !title.trim() || !body.trim()) return toast.error("Fill all fields");
    setBusy(true);
    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    const { data: thread, error } = await supabase.from("forum_threads")
      .insert({ category_id: categoryId, profile_id: profile!.id, title: title.trim(), body: body.trim() })
      .select("id").single();
    if (error) { toast.error(error.message); setBusy(false); return; }
    if (tags.trim()) {
      const slugs = tags.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
      for (const slug of slugs) {
        const { data: tag } = await supabase.from("forum_tags").upsert({ slug, name: slug }, { onConflict: "slug" }).select("id").single();
        if (tag) await supabase.from("thread_tags").insert({ thread_id: thread.id, tag_id: tag.id });
      }
    }
    toast.success("Thread posted");
    nav(`/forum/thread/${thread.id}`);
  };

  return (
    <div className="container max-w-2xl py-8 space-y-4">
      <h1 className="text-2xl font-serif">New thread</h1>
      <Select value={categoryId} onValueChange={setCategoryId}>
        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>{cats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
      </Select>
      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Body — markdown supported" rows={10} />
      <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma separated)" />
      <Button onClick={submit} disabled={busy} className="w-full">{busy ? "Posting…" : "Post thread"}</Button>
    </div>
  );
}
