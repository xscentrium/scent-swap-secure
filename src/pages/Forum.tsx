import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin, Lock, MessageSquare, ArrowUp } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export default function Forum() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("forum_categories").select("*").order("position").then(({ data }) => {
      setCategories(data ?? []);
      if (data?.length && !activeCat) setActiveCat(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!activeCat) return;
    supabase.from("forum_threads")
      .select("*, profiles:profile_id(username, display_name, avatar_url)")
      .eq("category_id", activeCat)
      .order("is_pinned", { ascending: false })
      .order("last_activity_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setThreads(data ?? []));
  }, [activeCat]);

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-serif">Forum</h1>
          <p className="text-muted-foreground">Discuss fragrances with the community.</p>
        </div>
        {user && <Button asChild><Link to="/forum/new">New thread</Link></Button>}
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        <aside className="space-y-1">
          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${activeCat === c.id ? 'bg-muted font-semibold' : 'hover:bg-muted'}`}>
              {c.name}
            </button>
          ))}
        </aside>

        <div className="space-y-2">
          {threads.length === 0 && <Card className="p-6 text-sm text-muted-foreground">No threads yet — be the first.</Card>}
          {threads.map(t => (
            <Link key={t.id} to={`/forum/thread/${t.id}`}>
              <Card className="p-4 hover:border-primary transition flex gap-4">
                <div className="flex flex-col items-center gap-1 text-muted-foreground min-w-[50px]">
                  <ArrowUp className="h-4 w-4" />
                  <span className="text-sm font-semibold">{t.upvotes}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {t.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                    {t.is_locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <h3 className="font-semibold truncate">{t.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    by @{t.profiles?.username ?? "unknown"} · {format(new Date(t.last_activity_at), "MMM d")}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <MessageSquare className="h-3 w-3" /> {t.reply_count}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
