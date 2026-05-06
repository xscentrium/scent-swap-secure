import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  listingId: string;
  ownerProfileId: string;
  brand: string;
  fragranceName?: string;
}

type Flag = { id: string; voter_profile_id: string; vote: 'authentic' | 'suspicious'; reason: string | null };
type BatchCode = {
  id: string; batch_code: string; ai_plausibility_score: number | null;
  ai_verdict: string | null; ai_explanation: string | null;
  decoded_year: number | null; decoded_factory: string | null;
};

export const AuthenticityFlags = ({ listingId, ownerProfileId, brand, fragranceName }: Props) => {
  const { profile } = useAuth();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [batch, setBatch] = useState<BatchCode | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [voting, setVoting] = useState<'authentic' | 'suspicious' | null>(null);

  const refetch = async () => {
    const [{ data: f }, { data: b }] = await Promise.all([
      supabase.from('listing_authenticity_flags').select('*').eq('listing_id', listingId),
      supabase.from('listing_batch_codes').select('*').eq('listing_id', listingId).maybeSingle(),
    ]);
    setFlags((f as Flag[]) ?? []);
    setBatch((b as BatchCode) ?? null);
    if (b?.batch_code) setCode(b.batch_code);
  };

  useEffect(() => { refetch(); }, [listingId]);

  const authenticCount = flags.filter((f) => f.vote === 'authentic').length;
  const suspiciousCount = flags.filter((f) => f.vote === 'suspicious').length;
  const myVote = flags.find((f) => f.voter_profile_id === profile?.id)?.vote;
  const isOwner = profile?.id === ownerProfileId;

  const vote = async (v: 'authentic' | 'suspicious') => {
    if (!profile) { toast.error('Sign in to vote'); return; }
    setVoting(v);
    try {
      const { error } = await supabase.from('listing_authenticity_flags')
        .upsert({ listing_id: listingId, voter_profile_id: profile.id, vote: v },
          { onConflict: 'listing_id,voter_profile_id' });
      if (error) throw error;
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Vote failed');
    } finally { setVoting(null); }
  };

  const verifyBatch = async () => {
    if (!profile || !isOwner) return;
    if (!code.trim()) { toast.error('Enter a batch code'); return; }
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-batch-code', {
        body: { brand, fragrance_name: fragranceName, batch_code: code.trim() },
      });
      if (error) throw error;
      const { error: upErr } = await supabase.from('listing_batch_codes').upsert({
        listing_id: listingId,
        owner_profile_id: profile.id,
        batch_code: code.trim().toUpperCase(),
        ai_plausibility_score: data.plausibility_score,
        ai_verdict: data.verdict,
        ai_explanation: data.explanation,
        decoded_year: data.year,
        decoded_factory: data.factory,
        verified_at: new Date().toISOString(),
      }, { onConflict: 'listing_id' });
      if (upErr) throw upErr;
      await refetch();
      toast.success('Batch code verified');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Verification failed');
    } finally { setVerifying(false); }
  };

  const verdictTone = batch?.ai_verdict === 'plausible'
    ? 'bg-green-500/10 text-green-600 border-green-500/30'
    : batch?.ai_verdict === 'questionable'
    ? 'bg-destructive/10 text-destructive border-destructive/30'
    : 'bg-muted text-muted-foreground border-border';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Community authenticity
        </p>
        <div className="flex gap-1.5">
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[11px]">
            <ShieldCheck className="w-3 h-3 mr-1" />{authenticCount}
          </Badge>
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[11px]">
            <ShieldAlert className="w-3 h-3 mr-1" />{suspiciousCount}
          </Badge>
        </div>
      </div>

      {!isOwner && (
        <div className="flex gap-2">
          <Button size="sm" variant={myVote === 'authentic' ? 'default' : 'outline'}
            onClick={() => vote('authentic')} disabled={!!voting}
            className={myVote === 'authentic' ? 'bg-green-600 text-white' : ''}>
            {voting === 'authentic' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ShieldCheck className="w-3 h-3 mr-1" />}
            Authentic
          </Button>
          <Button size="sm" variant={myVote === 'suspicious' ? 'default' : 'outline'}
            onClick={() => vote('suspicious')} disabled={!!voting}
            className={myVote === 'suspicious' ? 'bg-destructive text-destructive-foreground' : ''}>
            {voting === 'suspicious' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ShieldAlert className="w-3 h-3 mr-1" />}
            Suspicious
          </Button>
        </div>
      )}

      <div className="border-t border-border/50 pt-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs flex items-center gap-1"><Sparkles className="w-3 h-3 text-primary" /> Batch code</Label>
          {batch?.ai_verdict && (
            <Badge variant="outline" className={`text-[11px] ${verdictTone}`}>
              {batch.ai_verdict} · {batch.ai_plausibility_score ?? 0}/100
            </Badge>
          )}
        </div>
        {isOwner ? (
          <div className="flex gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 9ABC123" className="h-8 text-xs" />
            <Button size="sm" onClick={verifyBatch} disabled={verifying} className="bg-primary text-primary-foreground">
              {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Verify'}
            </Button>
          </div>
        ) : batch ? (
          <p className="text-xs font-mono text-muted-foreground">{batch.batch_code}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">Owner has not added a batch code.</p>
        )}
        {batch?.ai_explanation && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">{batch.ai_explanation}</p>
        )}
      </div>
    </motion.div>
  );
};
