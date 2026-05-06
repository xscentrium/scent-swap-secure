// Verifies a fragrance batch code via Lovable AI Gateway.
// Returns: { plausibility_score: 0..100, verdict, year?, factory?, explanation }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface Req {
  brand: string;
  fragrance_name?: string;
  batch_code: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Req;
    if (!body?.brand || !body?.batch_code) {
      return new Response(JSON.stringify({ error: 'brand and batch_code are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanCode = String(body.batch_code).trim().toUpperCase().slice(0, 32);
    const cleanBrand = String(body.brand).trim().slice(0, 80);
    const cleanName = (body.fragrance_name ?? '').toString().trim().slice(0, 120);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY missing');

    const sys = `You are a fragrance batch-code verifier. Given a brand and a batch code printed on a bottle, judge whether the format is plausible for that brand. Common batch code patterns vary by manufacturer (e.g. L'Oréal group, Coty, Estée Lauder, Procter & Gamble, niche houses). Respond ONLY with JSON.`;
    const user = `Brand: ${cleanBrand}\nFragrance: ${cleanName}\nBatch code: ${cleanCode}\n\nReturn JSON: { "plausibility_score": <int 0-100>, "verdict": "plausible"|"questionable"|"unknown", "year": <int|null>, "factory": <string|null>, "explanation": "<one short sentence>" }`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: 'AI gateway error', detail: t }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? '{}';
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    const score = Math.max(0, Math.min(100, Number(parsed.plausibility_score ?? 0)));
    const verdict = ['plausible', 'questionable', 'unknown'].includes(String(parsed.verdict))
      ? String(parsed.verdict) : 'unknown';

    return new Response(JSON.stringify({
      plausibility_score: score,
      verdict,
      year: parsed.year ?? null,
      factory: parsed.factory ?? null,
      explanation: String(parsed.explanation ?? '').slice(0, 280),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
