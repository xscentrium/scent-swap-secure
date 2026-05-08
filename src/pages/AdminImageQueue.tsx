import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Shield, Check, X, RotateCcw, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ListingImage } from '@/components/ListingImage';

type Status = 'pending' | 'verified' | 'rejected' | 'needs_reupload';

const AdminImageQueue = () => {
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Status>('pending');

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      return !!data;
    },
    enabled: !!user?.id,
  });

  const { data: rows, isLoading, refetch } = useQuery({
    queryKey: ['image-queue', tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listing_image_verifications')
        .select('id, listing_id, image_url, status, source, reason, last_checked_at, listing:listings(id, brand, name, size, owner_id, is_active)')
        .eq('status', tab)
        .order('last_checked_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!isAdmin,
  });

  const counts = useQuery({
    queryKey: ['image-queue-counts'],
    queryFn: async () => {
      const out: Record<string, number> = {};
      for (const s of ['pending', 'verified', 'rejected', 'needs_reupload'] as Status[]) {
        const { count } = await supabase
          .from('listing_image_verifications')
          .select('*', { count: 'exact', head: true })
          .eq('status', s);
        out[s] = count ?? 0;
      }
      return out;
    },
    enabled: !!isAdmin,
  });

  const review = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: Status; reason: string }) => {
      const { error } = await supabase
        .from('listing_image_verifications')
        .update({
          status,
          reason,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Verification updated');
      qc.invalidateQueries({ queryKey: ['image-queue'] });
      qc.invalidateQueries({ queryKey: ['image-queue-counts'] });
    },
    onError: (e: any) => toast.error(e.message || 'Update failed'),
  });

  const runDailyJob = async () => {
    const { error } = await supabase.functions.invoke('verify-listing-images', { body: {} });
    if (error) toast.error(error.message);
    else {
      toast.success('Re-verification job triggered');
      refetch();
      counts.refetch();
    }
  };

  if (authLoading || adminLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="pt-20 max-w-2xl mx-auto px-4 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-serif">Admin access required</h1>
          <Link to="/" className="text-primary underline mt-4 inline-block">Back to home</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-20 pb-16 max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <h1 className="text-3xl font-serif mt-2">Image Verification Queue</h1>
            <p className="text-muted-foreground text-sm">Approve, reject, or request re-uploads for listing photos.</p>
          </div>
          <Button variant="outline" onClick={runDailyJob}>
            <RefreshCw className="w-4 h-4 mr-2" /> Run batch verify now
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
          <TabsList>
            {(['pending', 'verified', 'rejected', 'needs_reupload'] as Status[]).map((s) => (
              <TabsTrigger key={s} value={s}>
                {s.replace('_', ' ')} ({counts.data?.[s] ?? 0})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-6 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : rows && rows.length > 0 ? (
            rows.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4 flex gap-4">
                  <div className="w-28 h-28 flex-shrink-0 bg-muted rounded overflow-hidden">
                    <ListingImage url={r.image_url} alt={r.listing?.name || 'listing'} verification={{ status: r.status, reason: r.reason, source: r.source }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{r.listing?.brand} — {r.listing?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {r.listing?.size || '—'} · source: {r.source || 'unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">{r.reason || '—'}</div>
                        {r.image_url && (
                          <a href={r.image_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate block max-w-md mt-1">
                            {r.image_url}
                          </a>
                        )}
                      </div>
                      <Badge variant="outline" className="capitalize">{r.status.replace('_', ' ')}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => review.mutate({ id: r.id, status: 'verified', reason: 'Approved by admin' })} disabled={review.isPending}>
                        <Check className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => review.mutate({ id: r.id, status: 'rejected', reason: 'Rejected — image does not match listing' })} disabled={review.isPending}>
                        <X className="w-3 h-3 mr-1" /> Reject
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => review.mutate({ id: r.id, status: 'needs_reupload', reason: 'Please upload a clearer photo of the actual bottle' })} disabled={review.isPending}>
                        <RotateCcw className="w-3 h-3 mr-1" /> Request re-upload
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nothing in this queue. ✨</CardContent></Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminImageQueue;
