// Bulk imports fragrances from the Fragrance API (RapidAPI / Fragplace) into our DB.
// Iterates brands and pulls up to 1000 fragrances per brand (the API hard cap).
// Designed to be called repeatedly with brand_offset to chunk work under the edge timeout.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RAPID_HOST = "fragrance-api.p.rapidapi.com";
const RAPID_URL = `https://${RAPID_HOST}/multi-search`;

async function rapid(body: unknown) {
  const key = Deno.env.get("RAPIDAPI_KEY");
  if (!key) throw new Error("RAPIDAPI_KEY missing");
  const r = await fetch(RAPID_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": RAPID_HOST,
      "x-rapidapi-key": key,
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`RapidAPI ${r.status}: ${await r.text()}`);
  return r.json();
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function yearFromMs(ms: number | null | undefined): number | null {
  if (!ms || typeof ms !== "number") return null;
  const y = new Date(ms).getUTCFullYear();
  return y > 1800 && y < 2100 ? y : null;
}

async function fetchBrands(offset: number, limit: number) {
  const data = await rapid({
    queries: [{ indexUid: "brands", q: "", limit, offset }],
  });
  return data.results[0].hits as Array<{ id: number; name: string }>;
}

async function fetchFragrancesByBrand(brand: string) {
  const all: any[] = [];
  let offset = 0;
  const limit = 200;
  while (true) {
    const data = await rapid({
      queries: [{
        indexUid: "fragrances",
        q: "",
        filter: [`brand.name="${brand.replace(/"/g, '\\"')}"`],
        limit,
        offset,
      }],
    });
    const hits = data.results[0].hits as any[];
    all.push(...hits);
    if (hits.length < limit) break;
    offset += limit;
    if (offset >= 1000) break; // API cap
  }
  return all;
}

async function upsertFragrances(supabase: any, hits: any[]) {
  if (!hits.length) return { inserted: 0, notes: 0 };
  // Dedupe by (brand|name|year) — API can return same triple twice
  const seen = new Set<string>();
  const dedupedHits: any[] = [];
  for (const h of hits) {
    const k = `${h.brand?.name ?? "Unknown"}|${h.name}|${yearFromMs(h.releasedAt) ?? ""}`;
    if (seen.has(k)) continue;
    seen.add(k);
    dedupedHits.push(h);
  }
  const rows = dedupedHits.map((h) => ({
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

  const { data: upserted, error } = await supabase
    .from("fragrances")
    .upsert(rows, { onConflict: "brand,name,year", ignoreDuplicates: false })
    .select("id, brand, name, year");
  if (error) throw error;

  // Build a key -> id map for note insertion
  const idMap = new Map<string, string>();
  for (const r of upserted ?? []) {
    idMap.set(`${r.brand}|${r.name}|${r.year ?? ""}`, r.id);
  }

  const noteRows: any[] = [];
  for (const h of hits) {
    const key = `${h.brand?.name ?? "Unknown"}|${h.name}|${yearFromMs(h.releasedAt) ?? ""}`;
    const fid = idMap.get(key);
    if (!fid || !Array.isArray(h.notes)) continue;
    for (let i = 0; i < h.notes.length; i++) {
      const n = h.notes[i];
      if (!n?.name) continue;
      noteRows.push({
        fragrance_id: fid,
        note: String(n.name).slice(0, 100),
        layer: "middle", // API doesn't expose layer; bucket as middle
        position: i,
      });
    }
  }

  if (noteRows.length) {
    const { error: nerr } = await supabase
      .from("fragrance_notes")
      .upsert(noteRows, { onConflict: "fragrance_id,note,layer", ignoreDuplicates: true });
    if (nerr) console.error("notes upsert error", nerr);
  }

  return { inserted: rows.length, notes: noteRows.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const brandOffset: number = Number(body.brand_offset ?? 0);
    const brandBatch: number = Math.min(Number(body.brand_batch ?? 10), 25);

    const brands = await fetchBrands(brandOffset, brandBatch);
    let totalFrags = 0;
    let totalNotes = 0;
    const processed: string[] = [];

    for (const b of brands) {
      try {
        const hits = await fetchFragrancesByBrand(b.name);
        const res = await upsertFragrances(supabase, hits);
        totalFrags += res.inserted;
        totalNotes += res.notes;
        processed.push(`${b.name} (${hits.length})`);
      } catch (e) {
        console.error("brand failed", b.name, e);
        processed.push(`${b.name} FAILED`);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        brand_offset: brandOffset,
        brands_processed: brands.length,
        next_offset: brandOffset + brands.length,
        done: brands.length < brandBatch,
        fragrances_upserted: totalFrags,
        notes_upserted: totalNotes,
        processed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
