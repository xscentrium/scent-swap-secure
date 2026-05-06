import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const SellerPayouts = () => {
  const { profile } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('trades')
        .select('id, escrow_status, escrow_amount_initiator, escrow_amount_receiver, locked_initiator_value, locked_receiver_value, initiator_id, receiver_id, released_at, refunded_at, created_at, updated_at')
        .or(`initiator_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('updated_at', { ascending: false });
      setTrades(data ?? []);
      setLoading(false);
    })();
  }, [profile]);

  const myAmount = (t: any) => Number(t.initiator_id === profile?.id ? t.locked_initiator_value : t.locked_receiver_value) || 0;

  const released = trades.filter((t) => t.escrow_status === 'released').reduce((a, t) => a + myAmount(t), 0);
  const pending  = trades.filter((t) => t.escrow_status === 'held').reduce((a, t) => a + myAmount(t), 0);
  const refunded = trades.filter((t) => t.escrow_status === 'refunded').reduce((a, t) => a + myAmount(t), 0);
  const lifetime = released + pending;

  // Chart: monthly released earnings
  const byMonth: Record<string, number> = {};
  trades.filter((t) => t.escrow_status === 'released' && t.released_at).forEach((t) => {
    const k = new Date(t.released_at).toISOString().slice(0, 7);
    byMonth[k] = (byMonth[k] ?? 0) + myAmount(t);
  });
  const chartData = Object.entries(byMonth).sort().map(([month, value]) => ({ month, value: Number(value.toFixed(2)) }));

  const stats = [
    { label: 'Lifetime earnings', value: lifetime, icon: TrendingUp, tone: 'text-primary' },
    { label: 'Released',          value: released, icon: CheckCircle2, tone: 'text-green-600' },
    { label: 'Pending escrow',    value: pending,  icon: Clock,        tone: 'text-info' },
    { label: 'Refunded',          value: refunded, icon: XCircle,      tone: 'text-muted-foreground' },
  ];

  return (
    <div className="min-h-screen mesh-bg grain">
      <Navigation />
      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-serif font-semibold mb-2">Payouts</h1>
          <p className="text-muted-foreground mb-8">Your escrow activity at a glance.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="glass-card">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</span>
                      <s.icon className={`w-4 h-4 ${s.tone}`} />
                    </div>
                    <p className={`text-2xl font-serif font-semibold ${s.tone === 'text-primary' ? 'gold-text-glow' : ''}`}>
                      ${s.value.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-xl font-serif">Released earnings over time</CardTitle></CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                  <DollarSign className="w-4 h-4 mr-2" /> No released payouts yet.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#goldFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {loading && <p className="mt-4 text-xs text-muted-foreground">Loading…</p>}
        </motion.div>
      </main>
    </div>
  );
};

export default SellerPayouts;
