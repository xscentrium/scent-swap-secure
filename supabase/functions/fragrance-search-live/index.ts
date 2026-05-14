// Live, typo-tolerant fragrance search.
// 1) Queries the Fragrance API (Fragplace) for matches.
// 2) Upserts the top results into our DB so future loads are instant.
// 3) Returns the merged list for the client.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RAPID_HOST = "fragrance-api.p.rapidapi.com";
const RAPID_URL = `https://${RAPID_HOST}/multi-search`;

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function yearFromMs(ms: number | null | undefined): number | null {
  if (!ms || typeof ms !== "number") return null;
  const y = new Date(ms).getUTCFullYear();
  return y > 1800 && y < 2100 ? y : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 50);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
    if (!q) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = Deno.env.get("RAPIDAPI_KEY");
    if (!key) throw new Error("RAPIDAPI_KEY missing");
    const r = await fetch(RAPID_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": RAPID_HOST,
        "x-rapidapi-key": key,
      },
      body: JSON.stringify({
        queries: [{ indexUid: "fragrances", q, limit, offset: 0 }],
      }),
    });
    if (!r.ok) throw new Error(`RapidAPI ${r.status}: ${await r.text()}`);
    const data = await r.json();
    const hits: any[] = data.results?.[0]?.hits ?? [];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const rows = hits.map((h) => ({
      brand: h.brand?.name ?? "Unknown",
      name: h.name,
      year: yearFromMs(h.releasedAt),
      perfumer: Array.isArray(h.perfumers) && h.perfumers.length
        ? h.perfumers.map((p: any) => p.name).join(", ")
        : null,
      image_url: h.image?.url ?? null,
      slug: slugify(`${h.brand?.name ?? ""}-${h.name}-${yearFromMs(h.releasedAt) ?? ""}`),
      source: "fragplace",
      approved: true,
    }));

    let upserted: any[] = [];
    if (rows.length) {
      const { data: up, error } = await supabase
        .from("fragrances")
        .upsert(rows, { onConflict: "brand,name,year", ignoreDuplicates: false })
        .select("id, brand, name, year, image_url, gender");
      if (error) throw error;
      upserted = up ?? [];

      // Insert notes (best-effort)
      const idMap = new Map<string, string>();
      for (const r of upserted) idMap.set(`${r.brand}|${r.name}|${r.year ?? ""}`, r.id);
      const noteRows: any[] = [];
      for (const h of hits) {
        const k = `${h.brand?.name ?? "Unknown"}|${h.name}|${yearFromMs(h.releasedAt) ?? ""}`;
        const fid = idMap.get(k);
        if (!fid || !Array.isArray(h.notes)) continue;
        h.notes.forEach((n: any, i: number) => {
          if (n?.name) {
            noteRows.push({
              fragrance_id: fid,
              note: String(n.name).slice(0, 100),
              layer: "middle",
              position: i,
            });
          }
        });
      }
      if (noteRows.length) {
        await supabase.from("fragrance_notes").upsert(noteRows, {
          onConflict: "fragrance_id,note,layer",
          ignoreDuplicates: true,
        });
      }
    }

    return new Response(
      JSON.stringify({ results: upserted, count: upserted.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
