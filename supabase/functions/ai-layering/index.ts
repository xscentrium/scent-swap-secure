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
    const { fragrances, goal } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert fragrance consultant specializing in fragrance layering. You understand how different notes, accords, and fragrance families interact when layered together.`;

    let userPrompt = '';

    if (fragrances && fragrances.length > 0) {
      userPrompt = `Analyze these fragrances for layering compatibility: ${JSON.stringify(fragrances)}

For each possible combination, provide:
1. Compatibility score (1-10)
2. What the combined scent profile would be like
3. Tips for layering (which to apply first, ratios, etc.)
4. Occasions this combo would work for

Return as JSON: { "combinations": [{ "fragrances": string[], "compatibilityScore": number, "resultProfile": string, "layeringTips": string, "bestFor": string[] }] }`;
    } else if (goal) {
      userPrompt = `A user wants to create a layered fragrance that achieves this goal: "${goal}"

Suggest 5 fragrance combinations that would achieve this. For each:
1. The fragrances to combine (name and brand)
2. Why they work together
3. How to layer them
4. The resulting scent profile

Return as JSON: { "suggestions": [{ "fragrances": [{ "name": string, "brand": string }], "reason": string, "layeringMethod": string, "resultProfile": string, "priceRange": string }] }`;
    } else {
      userPrompt = `Provide 5 classic fragrance layering combinations that are universally loved. Include:
1. Popular layering pairs
2. Why they work
3. Layering tips
4. Best occasions

Return as JSON: { "suggestions": [{ "fragrances": [{ "name": string, "brand": string }], "reason": string, "layeringMethod": string, "resultProfile": string, "popularity": string }] }`;
    }

    console.log('Fetching AI layering suggestions:', { fragranceCount: fragrances?.length, goal });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse layering JSON:', content);
      throw new Error('Failed to parse layering suggestions');
    }

    const layering = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(layering), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in ai-layering:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
