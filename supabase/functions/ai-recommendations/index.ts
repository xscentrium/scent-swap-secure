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
    const { occasion, season, notes, style, budget, collection, wishlist, type } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = `You are a world-class fragrance expert and consultant. Your recommendations are based on extensive knowledge of perfumery, including notes, accords, performance, and how fragrances work in different contexts.`;

    let userPrompt = '';

    if (type === 'occasion') {
      userPrompt = `Based on the following criteria, recommend 5 fragrances that would be perfect:
      
Occasion: ${occasion || 'any'}
Season: ${season || 'any'}
Preferred Notes: ${notes?.join(', ') || 'no preference'}
Style: ${style || 'versatile'}
Budget: ${budget || 'any'}

For each recommendation, provide:
1. Name and brand
2. Why it's perfect for this occasion/season
3. Key notes
4. Estimated price range
5. Performance (longevity and sillage)

Return as JSON: { "recommendations": [{ "name": string, "brand": string, "reason": string, "keyNotes": string[], "priceRange": string, "longevity": string, "sillage": string }] }`;
    } else if (type === 'collection') {
      userPrompt = `Based on this user's fragrance collection: ${JSON.stringify(collection)}
      
Analyze their taste profile and recommend 5 fragrances they would likely enjoy that they don't already own. Consider:
1. Common notes they seem to prefer
2. Brands they like
3. Gaps in their collection (e.g., seasons, occasions)
4. Similar fragrances from different houses

Return as JSON: { "recommendations": [{ "name": string, "brand": string, "reason": string, "keyNotes": string[], "similarity": string, "fillsGap": string }] }`;
    } else if (type === 'wishlist') {
      userPrompt = `Based on this user's wishlist: ${JSON.stringify(wishlist)}
      
Suggest 5 alternatives or similar fragrances that might be:
1. More affordable alternatives to expensive wishlist items
2. Similar scents they might not know about
3. Limited editions or hard-to-find alternatives

Return as JSON: { "recommendations": [{ "name": string, "brand": string, "reason": string, "similarTo": string, "advantage": string, "priceRange": string }] }`;
    } else {
      userPrompt = `Recommend 5 popular, well-regarded fragrances that are versatile and widely loved. Include a mix of designer and niche options.

Return as JSON: { "recommendations": [{ "name": string, "brand": string, "reason": string, "keyNotes": string[], "priceRange": string, "versatility": string }] }`;
    }

    console.log('Fetching AI recommendations:', { type, occasion, season });

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
    
    // Parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse recommendations JSON:', content);
      throw new Error('Failed to parse recommendations');
    }

    const recommendations = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in ai-recommendations:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
