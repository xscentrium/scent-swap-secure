import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Truck, Package, CheckCircle2, AlertTriangle, ExternalLink, Upload, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

type Shipment = {
  id: string;
  trade_id: string;
  sender_profile_id: string;
  recipient_profile_id: string;
  carrier: string;
  tracking_number: string;
  tracking_url: string | null;
  label_url: string | null;
  status: string;
  shipped_at: string | null;
  delivered_at: string | null;
  notes: string | null;
};

interface Props {
  tradeId: string;
  initiatorProfileId: string;
  receiverProfileId: string;
  /** When true, render compact (e.g. inside a timeline). */
  compact?: boolean;
  /** Fired once when both shipments reach 'delivered'. */
  onBothDelivered?: () => void;
}

const CARRIERS: Record<string, (n: string) => string> = {
  USPS:  (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
  UPS:   (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  FedEx: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  DHL:   (n) => `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(n)}`,
  Other: () => '',
};

const STATUSES = [
  { v: 'pending',        label: 'Pending',        icon: Package,        tone: 'bg-muted text-muted-foreground' },
  { v: 'label_created',  label: 'Label created',  icon: FileText,       tone: 'bg-info/10 text-info' },
  { v: 'in_transit',     label: 'In transit',     icon: Truck,          tone: 'bg-primary/10 text-primary' },
  { v: 'delivered',      label: 'Delivered',      icon: CheckCircle2,   tone: 'bg-green-500/10 text-green-600' },
  { v: 'exception',      label: 'Exception',      icon: AlertTriangle,  tone: 'bg-destructive/10 text-destructive' },
  { v: 'returned',       label: 'Returned',       icon: AlertTriangle,  tone: 'bg-destructive/10 text-destructive' },
];

const ShipmentRow = ({ s, mine, onUpdate }: { s: Shipment | null; mine: boolean; onUpdate: () => void }) => {
  const [editing, setEditing] = useState(!s);
  const [carrier, setCarrier] = useState(s?.carrier ?? 'USPS');
  const [tracking, setTracking] = useState(s?.tracking_number ?? '');
  const [status, setStatus] = useState(s?.status ?? 'label_created');
  const [labelFile, setLabelFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const trackUrl = s?.tracking_url || (s ? CARRIERS[s.carrier]?.(s.tracking_number) : '');
  const meta = STATUSES.find((x) => x.v === (s?.status ?? 'pending')) ?? STATUSES[0];
  const Icon = meta.icon;

  const handleSave = async () => {
    if (!tracking || !carrier) { toast.error('Carrier and tracking number required'); return; }
    setSaving(true);
    try {
      let labelUrl = s?.label_url ?? null;
      if (labelFile && user) {
        const ext = labelFile.name.split('.').pop();
        const path = `${user.id}/${s?.trade_id ?? 'new'}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('shipping-labels').upload(path, labelFile);
        if (upErr) throw upErr;
        labelUrl = path;
      }
      const url = CARRIERS[carrier]?.(tracking) || null;

      if (s) {
        const { error } = await supabase.from('trade_shipments')
          .update({ carrier, tracking_number: tracking, tracking_url: url, label_url: labelUrl, status, shipped_at: status !== 'pending' && !s.shipped_at ? new Date().toISOString() : s.shipped_at, delivered_at: status === 'delivered' ? (s.delivered_at ?? new Date().toISOString()) : s.delivered_at })
          .eq('id', s.id);
        if (error) throw error;
      }
      setEditing(false);
      setLabelFile(null);
      onUpdate();
      toast.success('Shipment updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!s && !mine) {
    return <div className="text-xs text-muted-foreground italic">No shipment yet.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm p-3 space-y-2"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ${meta.tone}`}>
            <Icon className="w-3 h-3" /> {meta.label}
          </span>
          {s && <span className="text-xs text-muted-foreground">{s.carrier} · {s.tracking_number}</span>}
        </div>
        {s && trackUrl && (
          <a href={trackUrl} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
            Track <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {mine && editing ? (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Carrier</Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(CARRIERS).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tracking #</Label>
              <Input className="h-8 text-xs" value={tracking} onChange={(e) => setTracking(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((st) => <SelectItem key={st.v} value={st.v}>{st.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Label (optional)</Label>
              <Input type="file" accept="image/*,application/pdf" className="h-8 text-xs file:text-xs"
                onChange={(e) => setLabelFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            {s && <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>}
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}Save
            </Button>
          </div>
        </div>
      ) : (
        mine && s && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-xs h-7">Update</Button>
          </div>
        )
      )}
    </motion.div>
  );
};

export const ShippingTracker = ({ tradeId, initiatorProfileId, receiverProfileId, compact, onBothDelivered }: Props) => {
  const { profile } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchShipments = async () => {
    const { data } = await supabase.from('trade_shipments').select('*').eq('trade_id', tradeId);
    setShipments((data as Shipment[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchShipments(); }, [tradeId]);

  const myProfileId = profile?.id;
  const isInitiator = myProfileId === initiatorProfileId;
  const myShipment = shipments.find((s) => s.sender_profile_id === myProfileId) ?? null;
  const otherShipment = shipments.find((s) => s.sender_profile_id !== myProfileId) ?? null;
  const otherSenderId = isInitiator ? receiverProfileId : initiatorProfileId;

  const startMyShipment = async () => {
    if (!myProfileId) return;
    setCreating(true);
    try {
      const otherId = isInitiator ? receiverProfileId : initiatorProfileId;
      const { error } = await supabase.from('trade_shipments').insert({
        trade_id: tradeId, sender_profile_id: myProfileId, recipient_profile_id: otherId,
        carrier: 'USPS', tracking_number: '', status: 'pending',
      });
      if (error) throw error;
      await fetchShipments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create shipment');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Shipping</p>
        {bothDelivered(shipments) && (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Ready for escrow release
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">Your shipment to them</p>
          {myShipment ? (
            <ShipmentRow s={myShipment} mine onUpdate={fetchShipments} />
          ) : (
            <Button size="sm" variant="outline" onClick={startMyShipment} disabled={creating} className="w-full">
              {creating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Truck className="w-3 h-3 mr-1" />}
              Add tracking
            </Button>
          )}
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">Their shipment to you</p>
          <ShipmentRow s={otherShipment} mine={false} onUpdate={fetchShipments} />
        </div>
      </div>
    </div>
  );
};

const bothDelivered = (s: Shipment[]) => s.length >= 2 && s.every((x) => x.status === 'delivered');
