// Daily batch verification of listing images. Iterates over every active
// listing, computes the trust verdict from the URL, and writes the result
// into public.listing_image_verifications.
//
// Admin-reviewed verdicts (status = 'verified' or 'rejected' with a
// reviewed_by) are NEVER overwritten — only auto/pending rows are updated.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APPROVED_HOSTS = new Set([
  'fimgs.net',
  'www.fragrantica.com',
  'images.fragrantica.com',
  'cdn.shopify.com',
  'images.sephora.com',
  'www.sephora.com',
  'www.notino.com',
  'cdn.notino.com',
  'images.ulta.com',
  'www.ulta.com',
  'www.fragranceshop.com',
  'm.media-amazon.com',
  'images-na.ssl-images-amazon.com',
]);
const BANNED = ['picsum.photos', 'placehold', 'placeholder', 'unsplash.com/random'];

function classify(url: string | null): { status: 'verified' | 'pending' | 'rejected'; source: string; reason: string } {
  if (!url) return { status: 'pending', source: 'none', reason: 'No image uploaded yet' };
  const lower = url.toLowerCase();
  if (BANNED.some((b) => lower.includes(b))) {
    return { status: 'rejected', source: 'banned', reason: 'Placeholder image source not allowed' };
  }
  if (lower.includes('supabase.co/storage')) {
    return { status: 'verified', source: 'uploaded', reason: 'Uploaded by seller to verified storage' };
  }
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return { status: 'rejected', source: 'invalid', reason: 'Invalid image URL' };
  }
  for (const h of APPROVED_HOSTS) {
    if (host === h || host.endsWith('.' + h)) {
      return { status: 'verified', source: host, reason: 'Verified product image source' };
    }
  }
  return { status: 'pending', source: host, reason: 'Unknown image source — needs admin review' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, image_url')
      .eq('is_active', true);
    if (error) throw error;

    let updated = 0;
    let skipped = 0;

    for (const l of listings ?? []) {
      const verdict = classify(l.image_url as string | null);

      const { data: existing } = await supabase
        .from('listing_image_verifications')
        .select('id, status, reviewed_by')
        .eq('listing_id', l.id)
        .maybeSingle();

      // Don't overwrite admin-reviewed rows (other than re-running auto-verify when image stayed the same).
      if (existing?.reviewed_by) {
        skipped++;
        continue;
      }

      const payload = {
        listing_id: l.id,
        image_url: l.image_url,
        status: verdict.status,
        source: verdict.source,
        reason: verdict.reason,
        last_checked_at: new Date().toISOString(),
      };

      const { error: upErr } = await supabase
        .from('listing_image_verifications')
        .upsert(payload, { onConflict: 'listing_id' });
      if (upErr) {
        console.error('upsert failed', l.id, upErr);
        continue;
      }
      updated++;
    }

    return new Response(
      JSON.stringify({ ok: true, scanned: listings?.length ?? 0, updated, skipped }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
