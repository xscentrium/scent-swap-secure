import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Shield, AlertTriangle, ImageOff, Copy, FileWarning, Sparkles, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getImageVerification, isImageAllowed } from '@/lib/imageVerification';

type Listing = {
  id: string;
  owner_id: string;
  brand: string;
  name: string;
  size: string | null;
  condition: string | null;
  image_url: string | null;
  price: number | null;
  estimated_value: number | null;
  listing_type: string;
  is_active: boolean;
  created_at: string | null;
};

type IssueType = 'wrong_image' | 'missing_image' | 'missing_metadata' | 'duplicate' | 'ai_unverified';

type Flagged = Listing & {
  issues: IssueType[];
  duplicateOf?: string[];
  ai?: { exists: boolean; confidence: number; canonical_brand?: string; canonical_name?: string; notes?: string };
};

const issueLabels: Record<IssueType, { label: string; icon: typeof AlertTriangle; tone: string }> = {
  wrong_image: { label: 'Unverified image source', icon: ImageOff, tone: 'bg-amber-100 text-amber-900 border-amber-200' },
  missing_image: { label: 'No image', icon: ImageOff, tone: 'bg-red-100 text-red-900 border-red-200' },
  missing_metadata: { label: 'Missing metadata', icon: FileWarning, tone: 'bg-amber-100 text-amber-900 border-amber-200' },
  duplicate: { label: 'Possible duplicate', icon: Copy, tone: 'bg-blue-100 text-blue-900 border-blue-200' },
  ai_unverified: { label: 'AI: not a known fragrance', icon: AlertTriangle, tone: 'bg-red-100 text-red-900 border-red-200' },
};

const AdminListingsAudit = () => {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<'all' | IssueType>('all');
  const [aiResults, setAiResults] = useState<Record<string, Flagged['ai']>>({});
  const [editing, setEditing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState<Partial<Listing>>({});
  const [aiBusy, setAiBusy] = useState<string | null>(null);

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      return !!data;
    },
    enabled: !!user?.id,
  });

  const { data: listings, isLoading, refetch } = useQuery({
    queryKey: ['audit-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, owner_id, brand, name, size, condition, image_url, price, estimated_value, listing_type, is_active, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as Listing[];
    },
    enabled: !!isAdmin,
  });

  const flagged: Flagged[] = useMemo(() => {
    if (!listings) return [];
    // Build duplicate map
    const dupMap = new Map<string, string[]>();
    for (const l of listings) {
      const key = `${l.owner_id}|${(l.brand || '').toLowerCase().trim()}|${(l.name || '').toLowerCase().trim()}|${(l.size || '').toLowerCase().trim()}`;
      if (!dupMap.has(key)) dupMap.set(key, []);
      dupMap.get(key)!.push(l.id);
    }

    const result: Flagged[] = [];
    for (const l of listings) {
      const issues: IssueType[] = [];
      if (!l.image_url) issues.push('missing_image');
      else if (!isImageAllowed(l.image_url)) issues.push('wrong_image');

      if (!l.brand?.trim() || !l.name?.trim() || !l.size?.trim() || (!l.price && !l.estimated_value)) {
        issues.push('missing_metadata');
      }

      const key = `${l.owner_id}|${(l.brand || '').toLowerCase().trim()}|${(l.name || '').toLowerCase().trim()}|${(l.size || '').toLowerCase().trim()}`;
      const dups = dupMap.get(key) || [];
      let duplicateOf: string[] | undefined;
      if (dups.length > 1) {
        issues.push('duplicate');
        duplicateOf = dups.filter((id) => id !== l.id);
      }

      const ai = aiResults[l.id];
      if (ai && (!ai.exists || (ai.confidence ?? 0) < 50)) issues.push('ai_unverified');

      if (issues.length) result.push({ ...l, issues, duplicateOf, ai });
    }
    return result;
  }, [listings, aiResults]);

  const visible = useMemo(
    () => (filter === 'all' ? flagged : flagged.filter((f) => f.issues.includes(filter))),
    [flagged, filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: flagged.length };
    (Object.keys(issueLabels) as IssueType[]).forEach((k) => {
      c[k] = flagged.filter((f) => f.issues.includes(k)).length;
    });
    return c;
  }, [flagged]);

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; patch: Partial<Listing> }) => {
      const { error } = await supabase.from('listings').update(payload.patch).eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Listing updated');
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['audit-listings'] });
    },
    onError: (e: any) => toast.error(e.message || 'Update failed'),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('listings').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Listing deactivated');
      queryClient.invalidateQueries({ queryKey: ['audit-listings'] });
    },
  });

  const runAiCheck = async (l: Listing) => {
    setAiBusy(l.id);
    try {
      const { data, error } = await supabase.functions.invoke('audit-listing-fragrance', {
        body: { brand: l.brand, name: l.name },
      });
      if (error) throw error;
      setAiResults((prev) => ({ ...prev, [l.id]: data.result }));
    } catch (e: any) {
      toast.error(e.message || 'AI check failed');
    } finally {
      setAiBusy(null);
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
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
      <main className="pt-20 pb-16 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <h1 className="text-3xl font-serif mt-2">Listings Audit</h1>
            <p className="text-muted-foreground text-sm">
              Flagged listings with wrong photos, missing metadata, or duplicates. Fix in one place.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Re-scan
          </Button>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">All flagged ({counts.all})</TabsTrigger>
            {(Object.keys(issueLabels) as IssueType[]).map((k) => (
              <TabsTrigger key={k} value={k}>
                {issueLabels[k].label} ({counts[k] || 0})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : visible.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                No issues. Catalog is clean. ✨
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {visible.map((l) => (
                  <Card key={l.id}>
                    <CardContent className="p-4 flex gap-4">
                      <div className="w-24 h-24 flex-shrink-0 bg-muted rounded overflow-hidden flex items-center justify-center">
                        {l.image_url ? (
                          <img src={l.image_url} alt={l.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageOff className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{l.brand} — {l.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {l.size || '—'} • {l.condition || '—'} •{' '}
                              {l.price ? `$${l.price}` : l.estimated_value ? `~$${l.estimated_value}` : 'no price'}
                              {!l.is_active && ' • inactive'}
                            </div>
                            {l.image_url && (
                              <div className="text-xs text-muted-foreground mt-1 truncate">
                                Image: {getImageVerification(l.image_url).label}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {l.issues.map((i) => {
                              const I = issueLabels[i];
                              return (
                                <Badge key={i} variant="outline" className={I.tone}>
                                  <I.icon className="w-3 h-3 mr-1" />
                                  {I.label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>

                        {l.ai && (
                          <div className="mt-2 text-xs px-2 py-1.5 rounded bg-muted/50 border">
                            AI: {l.ai.exists ? '✓ exists' : '✗ not found'} ({l.ai.confidence}% conf)
                            {l.ai.canonical_brand && ` — canonical: ${l.ai.canonical_brand} ${l.ai.canonical_name}`}
                            {l.ai.notes && ` — ${l.ai.notes}`}
                          </div>
                        )}

                        {l.duplicateOf?.length ? (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Duplicates: {l.duplicateOf.join(', ')}
                          </div>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditing(l); setEditForm(l); }}>
                            <Save className="w-3 h-3 mr-1" /> Fix
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => runAiCheck(l)} disabled={aiBusy === l.id}>
                            {aiBusy === l.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                            Verify with AI
                          </Button>
                          {l.ai?.canonical_brand && l.ai.canonical_name &&
                            (l.ai.canonical_brand !== l.brand || l.ai.canonical_name !== l.name) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: l.id,
                                    patch: { brand: l.ai!.canonical_brand!, name: l.ai!.canonical_name! },
                                  })
                                }
                              >
                                Apply canonical name
                              </Button>
                            )}
                          {l.is_active && (
                            <Button size="sm" variant="ghost" onClick={() => deactivateMutation.mutate(l.id)}>
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Fix listing</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Brand</Label>
                  <Input value={editForm.brand ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, brand: e.target.value }))} />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={editForm.name ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Size</Label>
                  <Input value={editForm.size ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, size: e.target.value }))} />
                </div>
                <div>
                  <Label>Price ($)</Label>
                  <Input type="number" value={editForm.price ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value ? Number(e.target.value) : null }))} />
                </div>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={editForm.image_url ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, image_url: e.target.value }))} />
                {editForm.image_url && (
                  <div className="text-xs mt-1 text-muted-foreground">
                    {getImageVerification(editForm.image_url).label}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={() => editing && updateMutation.mutate({ id: editing.id, patch: editForm })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminListingsAudit;
