import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "@supabase/supabase-js";

const FEEDS = [
  { name: "Fragrantica", url: "https://www.fragrantica.com/rss/news.xml" },
  { name: "NowSmellThis", url: "https://nstperfume.com/feed/" },
  { name: "Basenotes", url: "https://basenotes.com/feeds/news" },
  { name: "Cafleurebon", url: "https://www.cafleurebon.com/feed/" },
];

function parseRss(xml: string) {
  const items: any[] = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  for (const b of blocks) {
    const get = (tag: string) => {
      const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
      return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : null;
    };
    const title = get("title");
    const link = get("link");
    const pubDate = get("pubDate") ?? get("dc:date") ?? get("published");
    const description = get("description") ?? get("summary") ?? "";
    const imgMatch = b.match(/<media:content[^>]+url="([^"]+)"/i) ?? description.match(/<img[^>]+src="([^"]+)"/i);
    if (title && link) {
      items.push({
        title: title.replace(/<[^>]+>/g, "").trim(),
        source_url: link,
        published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        summary: description.replace(/<[^>]+>/g, "").trim().slice(0, 500),
        image_url: imgMatch ? imgMatch[1] : null,
      });
    }
  }
  return items;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let inserted = 0;
  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, { headers: { "User-Agent": "Xscentrium-NewsBot/1.0" } });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = parseRss(xml).slice(0, 25);
      for (const item of items) {
        const { error } = await supabase.from("news_articles").upsert({
          ...item, source: feed.name, is_ai_curated: false, tags: []
        }, { onConflict: "source_url", ignoreDuplicates: true });
        if (!error) inserted++;
      }
    } catch (e) {
      console.error(`Feed ${feed.name} failed:`, e);
    }
  }
  return new Response(JSON.stringify({ ok: true, inserted }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
