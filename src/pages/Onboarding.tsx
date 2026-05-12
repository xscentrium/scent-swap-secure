import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, Camera, Sparkles, Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Step = 1 | 2 | 3;

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [idFile, setIdFile] = useState<File | null>(null);
  const [uploadingId, setUploadingId] = useState(false);

  // Step 2 state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Step 3 state
  const [listing, setListing] = useState({
    name: '', brand: '', size: '', condition: 'excellent',
    listing_type: 'both', price: '', description: '',
  });
  const [creatingListing, setCreatingListing] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || profile.username || '');
      setBio(profile.bio || '');
      // Skip step 1 if already submitted
      if ((profile as any).id_verification_status && (profile as any).id_verification_status !== 'none') {
        setStep((s) => (s === 1 ? 2 : s));
      }
    }
  }, [profile]);

  const progress = useMemo(() => (step === 1 ? 33 : step === 2 ? 66 : 100), [step]);

  if (loading) return null;
  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleIdUpload = async () => {
    if (!idFile || !profile) return;
    setUploadingId(true);
    try {
      const ext = idFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('id-verification').upload(path, idFile);
      if (upErr) throw upErr;
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ id_document_url: path, id_verification_status: 'pending', id_submitted_at: new Date().toISOString() })
        .eq('id', profile.id);
      if (profErr) throw profErr;
      toast.success('ID submitted for review');
      setStep(2);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingId(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from('profiles').update({ display_name: displayName, bio }).eq('id', profile.id);
      if (error) throw error;
      setStep(3);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateListing = async () => {
    if (!profile) return;
    if (!listing.name || !listing.brand || !listing.size) {
      toast.error('Name, brand, and size are required');
      return;
    }
    setCreatingListing(true);
    try {
      const { error } = await supabase.from('listings').insert({
        owner_id: profile.id,
        name: listing.name, brand: listing.brand, size: listing.size,
        condition: listing.condition as any,
        listing_type: listing.listing_type as any,
        price: listing.price ? Number(listing.price) : null,
        description: listing.description || null,
      });
      if (error) throw error;
      toast.success("You're all set 🎉");
      navigate('/marketplace');
    } catch (e: any) {
      const msg = e?.message || '';
      if (typeof msg === 'string' && msg.toLowerCase().includes('row-level security')) {
        toast.error('Please upload your ID to list your first fragrance.');
      } else {
        toast.error(msg || 'Please upload your ID to list your first fragrance.');
      }
    } finally {
      setCreatingListing(false);
    }
  };

  const stepMeta = [
    { n: 1, icon: ShieldCheck, label: 'Verify ID' },
    { n: 2, icon: Camera, label: 'Profile' },
    { n: 3, icon: Sparkles, label: 'First Listing' },
  ];

  return (
    <div className="min-h-screen mesh-bg grain">
      <Navigation />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-2">Welcome to <span className="gradient-text">Xscentrium</span></h1>
            <p className="text-muted-foreground">Three quick steps and you're trading.</p>
          </div>

          <div className="mb-8">
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between mt-3">
              {stepMeta.map((s) => {
                const active = step === s.n;
                const done = step > s.n;
                return (
                  <div key={s.n} className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      done ? 'bg-primary text-primary-foreground' :
                      active ? 'bg-primary/15 text-primary ring-2 ring-primary animate-glow-pulse' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {done ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-xs ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card p-6 md:p-8"
            >
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-serif font-semibold mb-1">Verify your identity</h2>
                    <p className="text-sm text-muted-foreground">Upload a clear photo of a government-issued ID. Trading unlocks once approved.</p>
                  </div>
                  <div className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center hover:border-primary/40 transition">
                    <input id="id-upload" type="file" accept="image/*,.pdf" onChange={(e) => setIdFile(e.target.files?.[0] ?? null)} className="hidden" />
                    <label htmlFor="id-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Camera className="w-8 h-8 text-primary" />
                      <span className="text-sm font-medium">{idFile ? idFile.name : 'Click to choose a photo or PDF'}</span>
                      <span className="text-xs text-muted-foreground">JPG, PNG, or PDF · Max 10 MB</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setStep(2)}>Skip for now</Button>
                    <Button onClick={handleIdUpload} disabled={!idFile || uploadingId} className="bg-primary text-primary-foreground">
                      {uploadingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Submit ID <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-serif font-semibold mb-1">Set up your profile</h2>
                    <p className="text-sm text-muted-foreground">A complete profile builds trust with traders.</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label>Display name</Label>
                      <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} />
                    </div>
                    <div>
                      <Label>Short bio</Label>
                      <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} placeholder="What scents do you collect? Favorite houses?" />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
                    <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-primary text-primary-foreground">
                      {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-serif font-semibold mb-1">List your first fragrance</h2>
                    <p className="text-sm text-muted-foreground">Quick draft — you can edit details later.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label>Brand</Label>
                      <Input value={listing.brand} onChange={(e) => setListing({ ...listing, brand: e.target.value })} placeholder="e.g. Maison Francis Kurkdjian" />
                    </div>
                    <div className="col-span-2"><Label>Fragrance name</Label>
                      <Input value={listing.name} onChange={(e) => setListing({ ...listing, name: e.target.value })} placeholder="e.g. Baccarat Rouge 540" />
                    </div>
                    <div><Label>Size</Label>
                      <Input value={listing.size} onChange={(e) => setListing({ ...listing, size: e.target.value })} placeholder="70ml" />
                    </div>
                    <div><Label>Condition</Label>
                      <Select value={listing.condition} onValueChange={(v) => setListing({ ...listing, condition: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New / sealed</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Listing type</Label>
                      <Select value={listing.listing_type} onValueChange={(v) => setListing({ ...listing, listing_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sale">Sale only</SelectItem>
                          <SelectItem value="trade">Trade only</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Asking price (USD)</Label>
                      <Input type="number" min="0" value={listing.price} onChange={(e) => setListing({ ...listing, price: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => navigate('/marketplace')} disabled={creatingListing}>
                        Skip for now
                      </Button>
                      <Button onClick={handleCreateListing} disabled={creatingListing} className="bg-primary text-primary-foreground shadow-luxury">
                        {creatingListing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Publish & finish
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
};

export default Onboarding;
