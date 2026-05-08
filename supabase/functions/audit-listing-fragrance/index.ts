import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { brand, name } = await req.json();
    if (!brand || !name) {
      return new Response(JSON.stringify({ error: 'brand and name required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!KEY) throw new Error('LOVABLE_API_KEY missing');

    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a fragrance database verifier. Given a brand and fragrance name, respond with strict JSON only:
{"exists": true|false, "canonical_brand": "...", "canonical_name": "...", "concentration": "EDP|EDT|Parfum|Cologne|EDC|Extrait|unknown", "confidence": 0-100, "notes": "short reason"}
exists=true only if the fragrance is a real released product. Correct minor spelling in canonical_*.`,
          },
          { role: 'user', content: `Brand: ${brand}\nName: ${name}` },
        ],
      }),
    });

    if (!r.ok) throw new Error(`AI ${r.status}`);
    const data = await r.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const m = content.match(/\{[\s\S]*\}/);
    const result = m ? JSON.parse(m[0]) : { exists: false, confidence: 0, notes: 'parse failure' };

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
