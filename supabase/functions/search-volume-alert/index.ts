import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuration
const DAILY_THRESHOLD = 100; // Alert when daily searches exceed this
const HOURLY_SPIKE_THRESHOLD = 50; // Alert when hourly searches exceed this
const ADMIN_EMAILS = ["admin@xscentrium.com"]; // Add actual admin emails

interface SearchStats {
  total_today: number;
  total_yesterday: number;
  hourly_count: number;
  top_searches: { query: string; count: number }[];
  zero_results_queries: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get today's search count
    const { count: todayCount } = await supabase
      .from("search_analytics")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());

    // Get yesterday's search count for comparison
    const { count: yesterdayCount } = await supabase
      .from("search_analytics")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterdayStart.toISOString())
      .lt("created_at", todayStart.toISOString());

    // Get last hour's search count
    const { count: hourlyCount } = await supabase
      .from("search_analytics")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneHourAgo.toISOString());

    // Get top searches today
    const { data: todaySearches } = await supabase
      .from("search_analytics")
      .select("query")
      .gte("created_at", todayStart.toISOString());

    const queryCount = new Map<string, number>();
    todaySearches?.forEach((item) => {
      const q = item.query.toLowerCase();
      queryCount.set(q, (queryCount.get(q) || 0) + 1);
    });
    const topSearches = Array.from(queryCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get zero result queries
    const { data: zeroResultsData } = await supabase
      .from("search_analytics")
      .select("query")
      .gte("created_at", todayStart.toISOString())
      .eq("results_count", 0);

    const zeroResultsQueries = [...new Set(zeroResultsData?.map((d) => d.query) || [])].slice(0, 10);

    const stats: SearchStats = {
      total_today: todayCount || 0,
      total_yesterday: yesterdayCount || 0,
      hourly_count: hourlyCount || 0,
      top_searches: topSearches,
      zero_results_queries: zeroResultsQueries,
    };

    const alerts: string[] = [];

    // Check daily threshold
    if (stats.total_today >= DAILY_THRESHOLD) {
      alerts.push(`Daily search volume (${stats.total_today}) exceeded threshold (${DAILY_THRESHOLD})`);
    }

    // Check hourly spike
    if (stats.hourly_count >= HOURLY_SPIKE_THRESHOLD) {
      alerts.push(`Hourly search spike detected: ${stats.hourly_count} searches in the last hour`);
    }

    // Check significant increase from yesterday
    if (stats.total_yesterday > 0 && stats.total_today > stats.total_yesterday * 1.5) {
      const increase = Math.round(((stats.total_today - stats.total_yesterday) / stats.total_yesterday) * 100);
      alerts.push(`${increase}% increase in searches compared to yesterday`);
    }

    // If no alerts, return early
    if (alerts.length === 0) {
      console.log("No alerts triggered. Stats:", stats);
      return new Response(
        JSON.stringify({ message: "No alerts triggered", stats }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Filter out empty emails
    const recipientEmails = ADMIN_EMAILS.filter((email) => email && email.includes("@"));

    if (recipientEmails.length === 0) {
      console.log("No admin emails configured");
      return new Response(
        JSON.stringify({ message: "No admin emails configured", stats, alerts }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #d97706, #f59e0b); color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 24px; }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0; }
    .stat-card { background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #d97706; }
    .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .section { margin-top: 24px; }
    .section h3 { color: #374151; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    .list-item { padding: 8px 12px; background: #f9fafb; margin-bottom: 8px; border-radius: 6px; display: flex; justify-content: space-between; }
    .zero-results { color: #dc2626; font-size: 14px; }
    .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
    .button { display: inline-block; background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 Search Analytics Alert</h1>
      <p style="margin: 8px 0 0;">Xscentrium Admin Notification</p>
    </div>
    
    <div class="content">
      ${alerts.map((alert) => `<div class="alert-box">⚠️ ${alert}</div>`).join("")}
      
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.total_today.toLocaleString()}</div>
          <div class="stat-label">Searches Today</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.total_yesterday.toLocaleString()}</div>
          <div class="stat-label">Searches Yesterday</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.hourly_count.toLocaleString()}</div>
          <div class="stat-label">Last Hour</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.total_yesterday > 0 ? Math.round(((stats.total_today - stats.total_yesterday) / stats.total_yesterday) * 100) : 0}%</div>
          <div class="stat-label">Change from Yesterday</div>
        </div>
      </div>
      
      <div class="section">
        <h3>🔥 Top Searches Today</h3>
        ${stats.top_searches.length > 0 
          ? stats.top_searches.map((s) => `<div class="list-item"><span>${s.query}</span><span><strong>${s.count}</strong> searches</span></div>`).join("")
          : "<p>No searches recorded today</p>"
        }
      </div>
      
      ${stats.zero_results_queries.length > 0 ? `
      <div class="section">
        <h3>❌ Searches with No Results</h3>
        <p class="zero-results">These searches returned no results - consider adding content for:</p>
        ${stats.zero_results_queries.map((q) => `<div class="list-item">${q}</div>`).join("")}
      </div>
      ` : ""}
      
      <div style="text-align: center;">
        <a href="${Deno.env.get("SITE_URL") || "https://xscentrium.lovable.app"}/admin/search-analytics" class="button">
          View Full Analytics
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>This is an automated alert from Xscentrium Search Analytics</p>
      <p>Generated at ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Xscentrium <noreply@resend.dev>",
        to: recipientEmails,
        subject: `🔍 Search Alert: ${alerts[0]}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Alert email sent:", emailResult);

    return new Response(
      JSON.stringify({ 
        message: "Alert sent successfully", 
        stats, 
        alerts,
        recipients: recipientEmails 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in search-volume-alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
