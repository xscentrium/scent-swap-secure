import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateFragranceImage(name: string, brand: string, apiKey: string): Promise<string | null> {
  try {
    const prompt = `Professional product photography of ${name} by ${brand} perfume bottle. Luxury fragrance bottle on elegant marble surface, soft studio lighting, high-end cosmetics advertisement style, photorealistic, 4K quality.`;
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      console.error('Image generation failed:', response.status);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return imageUrl || null;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

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

    let systemPrompt = `You are a world-class fragrance expert and consultant. Your recommendations are based on extensive knowledge of perfumery, including notes, accords, performance, and how fragrances work in different contexts. Only recommend REAL fragrances that actually exist from real brands.`;

    let userPrompt = '';

    if (type === 'occasion') {
      userPrompt = `Based on the following criteria, recommend 5 REAL fragrances that would be perfect:
      
Occasion: ${occasion || 'any'}
Season: ${season || 'any'}
Preferred Notes: ${notes?.join(', ') || 'no preference'}
Style: ${style || 'versatile'}
Budget: ${budget || 'any'}

For each recommendation, provide:
1. Name and brand (must be real existing fragrances)
2. Why it's perfect for this occasion/season
3. Key notes
4. Estimated price range
5. Performance (longevity and sillage)

Return as JSON: { "recommendations": [{ "name": string, "brand": string, "reason": string, "keyNotes": string[], "priceRange": string, "longevity": string, "sillage": string }] }`;
    } else if (type === 'collection') {
      userPrompt = `Based on this user's fragrance collection: ${JSON.stringify(collection)}
      
Analyze their taste profile and recommend 5 REAL fragrances they would likely enjoy that they don't already own. Consider:
1. Common notes they seem to prefer
2. Brands they like
3. Gaps in their collection (e.g., seasons, occasions)
4. Similar fragrances from different houses

Return as JSON: { "recommendations": [{ "name": string, "brand": string, "reason": string, "keyNotes": string[], "similarity": string, "fillsGap": string }] }`;
    } else if (type === 'wishlist') {
      userPrompt = `Based on this user's wishlist: ${JSON.stringify(wishlist)}
      
Suggest 5 REAL alternatives or similar fragrances that might be:
1. More affordable alternatives to expensive wishlist items
2. Similar scents they might not know about
3. Limited editions or hard-to-find alternatives

Return as JSON: { "recommendations": [{ "name": string, "brand": string, "reason": string, "similarTo": string, "advantage": string, "priceRange": string }] }`;
    } else {
      userPrompt = `Recommend 5 popular, well-regarded REAL fragrances that are versatile and widely loved. Include a mix of designer and niche options.

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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

    // Generate images for each recommendation (in parallel, max 2 at a time to avoid rate limits)
    console.log('Generating images for recommendations...');
    
    type RecommendationType = {
      name: string;
      brand: string;
      reason: string;
      keyNotes?: string[];
      priceRange?: string;
      imageUrl?: string | null;
    };
    
    const recsWithImages: RecommendationType[] = [];
    
    for (let i = 0; i < recommendations.recommendations.length; i += 2) {
      const batch = recommendations.recommendations.slice(i, i + 2) as RecommendationType[];
      const imagePromises = batch.map((rec) => 
        generateFragranceImage(rec.name, rec.brand, LOVABLE_API_KEY)
      );
      
      const images = await Promise.all(imagePromises);
      
      batch.forEach((rec, idx) => {
        recsWithImages.push({
          ...rec,
          imageUrl: images[idx] || null,
        });
      });
    }

    return new Response(JSON.stringify({ recommendations: recsWithImages }), {
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
