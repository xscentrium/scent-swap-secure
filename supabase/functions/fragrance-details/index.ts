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
    const { name, brand } = await req.json();

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

    // Get fragrance details from AI
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
            content: `You are a fragrance expert database. Return detailed fragrance information in JSON format only. No other text.
Format:
{
  "name": "Full fragrance name",
  "brand": "Brand name",
  "concentration": "EDP/EDT/Parfum/etc",
  "releaseYear": 2020,
  "perfumer": "Perfumer name(s)",
  "topNotes": ["note1", "note2"],
  "heartNotes": ["note1", "note2"],
  "baseNotes": ["note1", "note2"],
  "mainAccords": ["accord1", "accord2"],
  "longevity": "Moderate/Long Lasting/Very Long Lasting",
  "sillage": "Soft/Moderate/Strong/Enormous",
  "seasonRating": { "spring": 3, "summer": 2, "fall": 4, "winter": 5 },
  "dayNightRating": { "day": 3, "night": 5 },
  "averageRating": 4.2,
  "description": "Brief 2-3 sentence description of the fragrance",
  "similarFragrances": [
    { "name": "Similar Fragrance 1", "brand": "Brand" },
    { "name": "Similar Fragrance 2", "brand": "Brand" },
    { "name": "Similar Fragrance 3", "brand": "Brand" }
  ]
}
Season/Day ratings are 1-5. Be accurate with known fragrance data.`
          },
          {
            role: 'user',
            content: `Get detailed information for: "${name}" by "${brand}"`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status, await response.text());
      throw new Error('Failed to get fragrance details');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    // Parse the JSON response
    let details = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        details = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse fragrance details:', e);
    }

    // Add placeholder image
    if (details) {
      details.imageUrl = `https://picsum.photos/seed/${encodeURIComponent(name + brand)}/400/400`;
    }

    return new Response(
      JSON.stringify({ details }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fragrance details error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, details: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
