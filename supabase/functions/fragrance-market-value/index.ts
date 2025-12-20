import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, brand, size } = await req.json();

    if (!name || !brand) {
      return new Response(
        JSON.stringify({ error: 'Name and brand are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get market value estimate from AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a fragrance market expert. Provide estimated market values for fragrances based on current market trends. Return JSON only:
{
  "retailPrice": 150,
  "marketValueNew": 140,
  "marketValueUsed": 100,
  "priceRange": { "low": 80, "high": 160 },
  "pricePerMl": 1.5,
  "valueTrend": "stable",
  "lastUpdated": "2024-01",
  "notes": "Brief market insight"
}
Values in USD. valueTrend can be: rising, stable, falling, volatile.`
          },
          {
            role: 'user',
            content: `Get market value for: "${name}" by "${brand}"${size ? `, size: ${size}` : ''}`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status, await response.text());
      throw new Error('Failed to get market value');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    let marketData = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        marketData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse market data:', e);
    }

    return new Response(
      JSON.stringify({ marketData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Market value error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, marketData: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
