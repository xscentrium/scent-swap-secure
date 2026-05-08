import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Pull last 7 days of news
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase.from("news_articles")
    .select("title, summary, source").gte("published_at", since).order("published_at", { ascending: false }).limit(40);

  if (!recent || recent.length === 0) {
    return new Response(JSON.stringify({ skipped: "no-news" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  const prompt = `You are a fragrance industry analyst. Read these ${recent.length} news headlines from this past week and write a single 200-word weekly highlights digest in plain text. Identify the 3-5 most important themes (releases, brand changes, perfumer news, trends). End with one sentence on what to watch next week.\n\n${recent.map((r,i) => `${i+1}. [${r.source}] ${r.title}${r.summary ? ' — '+r.summary.slice(0,160) : ''}`).join("\n")}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    return new Response(JSON.stringify({ error: await resp.text() }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const json = await resp.json();
  const content = json.choices?.[0]?.message?.content ?? "";
  const week = new Date().toISOString().slice(0, 10);
  const url = `xscentrium://digest/${week}`;

  await supabase.from("news_articles").upsert({
    title: `Weekly Fragrance Digest — ${week}`,
    summary: content.slice(0, 280),
    content,
    source: "Xscentrium AI",
    source_url: url,
    is_ai_curated: true,
    published_at: new Date().toISOString(),
    tags: ["digest", "ai"],
  }, { onConflict: "source_url" });

  return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
