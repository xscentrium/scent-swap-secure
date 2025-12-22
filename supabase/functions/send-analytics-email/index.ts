import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  userId: string;
  type: 'monthly' | 'yearly';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured - email sending disabled');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email service not configured. Add RESEND_API_KEY to enable email summaries.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, type } = await req.json() as EmailPayload;

    // Get user profile and email
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    if (!user?.email) {
      return new Response(
        JSON.stringify({ success: false, message: 'User not found or no email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, username')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ success: false, message: 'Profile not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    let periodName: string;

    if (type === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      periodName = startDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else {
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      periodName = `${now.getFullYear() - 1}`;
    }

    const endDate = type === 'monthly' 
      ? new Date(now.getFullYear(), now.getMonth(), 0)
      : new Date(now.getFullYear() - 1, 11, 31);

    // Fetch analytics data
    const { data: scentLogs } = await supabase
      .from('scent_logs')
      .select('*')
      .eq('profile_id', profile.id)
      .gte('logged_date', startDate.toISOString().split('T')[0])
      .lte('logged_date', endDate.toISOString().split('T')[0]);

    const { count: collectionGrowth } = await supabase
      .from('collection_items')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profile.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { count: tradesCompleted } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .or(`initiator_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Calculate stats
    const uniqueFragrances = new Set(scentLogs?.map(l => `${l.fragrance_name}-${l.fragrance_brand}`)).size;
    const fragCounts = new Map<string, { name: string; brand: string; count: number }>();
    
    scentLogs?.forEach(log => {
      const key = `${log.fragrance_name}-${log.fragrance_brand}`;
      const existing = fragCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        fragCounts.set(key, { name: log.fragrance_name, brand: log.fragrance_brand, count: 1 });
      }
    });

    const topFragrances = Array.from(fragCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Calculate streak
    const sortedDates = [...new Set(scentLogs?.map(l => l.logged_date) || [])].sort();
    let longestStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const diff = (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i-1]).getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${type === 'monthly' ? 'Monthly' : 'Yearly'} Fragrance Summary</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f5f2; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Your ${periodName} Summary</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Hey ${profile.display_name || profile.username}! Here's your fragrance journey recap.</p>
    </div>
    
    <div style="padding: 32px;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
        <div style="background: #fef3c7; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #d97706;">${scentLogs?.length || 0}</div>
          <div style="font-size: 14px; color: #92400e;">Days Logged</div>
        </div>
        <div style="background: #fef3c7; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #d97706;">${uniqueFragrances}</div>
          <div style="font-size: 14px; color: #92400e;">Unique Fragrances</div>
        </div>
        <div style="background: #fef3c7; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #d97706;">${longestStreak}</div>
          <div style="font-size: 14px; color: #92400e;">Day Streak</div>
        </div>
        <div style="background: #fef3c7; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #d97706;">${collectionGrowth || 0}</div>
          <div style="font-size: 14px; color: #92400e;">Collection Additions</div>
        </div>
      </div>

      ${topFragrances.length > 0 ? `
      <h2 style="font-size: 18px; margin: 0 0 16px; color: #1f2937;">🏆 Your Top Fragrances</h2>
      <div style="margin-bottom: 24px;">
        ${topFragrances.map((frag, i) => `
          <div style="display: flex; align-items: center; padding: 12px; background: ${i === 0 ? '#fef3c7' : '#f9fafb'}; border-radius: 8px; margin-bottom: 8px;">
            <span style="font-size: 20px; margin-right: 12px;">${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
            <div>
              <div style="font-weight: 600; color: #1f2937;">${frag.name}</div>
              <div style="font-size: 13px; color: #6b7280;">${frag.brand} • ${frag.count} wears</div>
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${(tradesCompleted || 0) > 0 ? `
      <div style="background: #ecfdf5; padding: 16px; border-radius: 12px; text-align: center;">
        <div style="font-size: 14px; color: #065f46;">🤝 You completed <strong>${tradesCompleted}</strong> trades this ${type === 'monthly' ? 'month' : 'year'}!</div>
      </div>
      ` : ''}
    </div>

    <div style="background: #f9fafb; padding: 24px; text-align: center;">
      <a href="${Deno.env.get('SITE_URL') || 'https://scentswap.lovable.app'}/year-in-review" 
         style="display: inline-block; background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        View Full Year in Review
      </a>
    </div>
  </div>
</body>
</html>`;

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ScentSwap <noreply@resend.dev>',
        to: user.email,
        subject: `Your ${type === 'monthly' ? 'Monthly' : 'Yearly'} Fragrance Summary - ${periodName}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Resend error:', error);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to send email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Update last digest sent time
    await supabase
      .from('notification_preferences')
      .update({ last_digest_sent_at: new Date().toISOString() })
      .eq('profile_id', profile.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
