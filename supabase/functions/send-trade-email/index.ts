import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EventType =
  | 'trade_proposal'
  | 'trade_accepted'
  | 'trade_message'
  | 'escrow_held'
  | 'escrow_released'
  | 'escrow_refunded'
  | 'escrow_disputed'
  | 'id_verification_approved'
  | 'id_verification_rejected'
  | 'receipt_confirmed';

const SUBJECTS: Record<EventType, string> = {
  trade_proposal: 'New trade proposal on Xscentrium',
  trade_accepted: 'Your trade was accepted',
  trade_message: 'New message in your trade',
  escrow_held: 'Escrow funds held for your trade',
  escrow_released: 'Escrow released — trade complete',
  escrow_refunded: 'Escrow refunded',
  escrow_disputed: 'A dispute was opened on your trade',
  id_verification_approved: 'Your ID has been verified',
  id_verification_rejected: 'ID verification needs another look',
  receipt_confirmed: 'The other party confirmed receipt',
};

const wrap = (title: string, body: string, ctaUrl?: string, ctaLabel?: string) => `
<!doctype html><html><body style="margin:0;padding:0;background:#F5F2EC;font-family:Inter,Arial,sans-serif;color:#231f1c">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2EC;padding:32px 0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e3ddd0">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #ece6d8">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;letter-spacing:.04em">XSCENTRIUM</div>
        </td></tr>
        <tr><td style="padding:36px 40px">
          <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:28px;margin:0 0 16px">${title}</h1>
          <div style="font-size:15px;line-height:1.65;color:#3d3a36">${body}</div>
          ${ctaUrl ? `<div style="margin-top:28px"><a href="${ctaUrl}" style="display:inline-block;background:#231f1c;color:#F5F2EC;padding:12px 22px;text-decoration:none;font-size:13px;letter-spacing:.08em;text-transform:uppercase">${ctaLabel ?? 'View'}</a></div>` : ''}
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #ece6d8;font-size:11px;color:#8a857d;letter-spacing:.06em;text-transform:uppercase">
          You can manage notifications in your account settings.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ ok: false, skipped: 'no_resend_key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    const body = await req.json();
    const { event, profile_id, data } = body as {
      event: EventType; profile_id: string; data?: Record<string, unknown>;
    };
    if (!event || !profile_id) {
      return new Response(JSON.stringify({ error: 'event and profile_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: prof } = await supabase
      .from('profiles')
      .select('user_id, display_name, username')
      .eq('id', profile_id)
      .maybeSingle();
    if (!prof) return new Response(JSON.stringify({ ok: false, error: 'profile_not_found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: { user } } = await supabase.auth.admin.getUserById(prof.user_id);
    const to = user?.email;
    if (!to) return new Response(JSON.stringify({ ok: false, skipped: 'no_email' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Respect notification prefs (best-effort)
    const { data: prefs } = await supabase
      .from('notification_preferences').select('*').eq('profile_id', profile_id).maybeSingle();
    if (prefs && prefs.email_digest_enabled === false &&
      ['trade_message','escrow_held','escrow_released','escrow_refunded'].includes(event)) {
      // user opted out of granular email — fall through silently
    }

    const name = prof.display_name || prof.username || 'there';
    const tradeId = (data?.trade_id as string) ?? '';
    const origin = (data?.origin as string) ?? 'https://xscentrium.com';
    const tradeUrl = tradeId ? `${origin}/trades/${tradeId}` : `${origin}/my-trades`;

    const COPY: Record<EventType, { title: string; body: string; cta?: string; ctaLabel?: string }> = {
      trade_proposal: { title: `Hi ${name}, you have a new trade proposal`, body: 'Someone wants to trade with you. Open the request to review the offer and message the other party.', cta: tradeUrl, ctaLabel: 'Review trade' },
      trade_accepted: { title: 'Your trade was accepted', body: 'Escrow has been initiated. Ship your fragrance and confirm receipt when it arrives.', cta: tradeUrl, ctaLabel: 'Open trade' },
      trade_message: { title: 'New message in your trade', body: 'You have a new message from the other party.', cta: tradeUrl, ctaLabel: 'View thread' },
      escrow_held: { title: 'Escrow funds held', body: '50% of the trade value is now safely held. Funds release after both parties confirm receipt.', cta: tradeUrl, ctaLabel: 'View trade' },
      escrow_released: { title: 'Escrow released — trade complete', body: 'Both parties confirmed receipt. The trade is complete and escrow has been released.', cta: tradeUrl, ctaLabel: 'View trade' },
      escrow_refunded: { title: 'Escrow refunded', body: 'The trade was cancelled or resolved in your favour. Escrow has been refunded.', cta: tradeUrl, ctaLabel: 'View trade' },
      escrow_disputed: { title: 'A dispute was opened on your trade', body: 'Our team has been notified. Please upload any evidence (photos, tracking) in the trade thread.', cta: tradeUrl, ctaLabel: 'Open dispute' },
      id_verification_approved: { title: 'Your ID has been verified', body: 'You can now create trade listings and accept trades.', cta: `${origin}/profile`, ctaLabel: 'Go to profile' },
      id_verification_rejected: { title: 'ID verification needs another look', body: 'We couldn\u2019t verify your ID. Please re-submit a clearer photo.', cta: `${origin}/onboarding`, ctaLabel: 'Re-submit ID' },
      receipt_confirmed: { title: 'The other party confirmed receipt', body: 'Once you confirm receipt as well, escrow will release automatically.', cta: tradeUrl, ctaLabel: 'Confirm receipt' },
    };
    const copy = COPY[event];

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Xscentrium <onboarding@resend.dev>',
        to: [to],
        subject: SUBJECTS[event],
        html: wrap(copy.title, copy.body, copy.cta, copy.ctaLabel),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      console.error('Resend error', json);
      return new Response(JSON.stringify({ ok: false, error: json }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, id: json.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-trade-email error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
