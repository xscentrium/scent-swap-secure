import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCanTrade } from '@/hooks/useCanTrade';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { ImageUpload } from '@/components/ImageUpload';
import { FragranceSearch } from '@/components/FragranceSearch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Users, Sparkles, Info, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const listingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  brand: z.string().min(1, 'Brand is required').max(100),
  size: z.string().min(1, 'Size is required'),
  condition: z.enum(['new', 'like_new', 'excellent', 'good', 'fair']),
  listing_type: z.enum(['sale', 'trade', 'both']),
  price: z.number().min(0).optional().nullable(),
  estimated_value: z.number().min(0).optional().nullable(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  image_url: z.string().url('Image is required'),
});

const CreateListing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading } = useAuth();
  const { canTrade, reason: tradeBlockReason, loading: tradeCheckLoading } = useCanTrade();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [fragranceDetails, setFragranceDetails] = useState<{
    topNotes?: string[];
    heartNotes?: string[];
    baseNotes?: string[];
    mainAccords?: string[];
    concentration?: string;
    commonSizes?: string[];
  } | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedSource, setVerifiedSource] = useState<string>('');
  
  const [formData, setFormData] = useState<{
    name: string;
    brand: string;
    size: string;
    condition: 'new' | 'like_new' | 'excellent' | 'good' | 'fair';
    listing_type: 'sale' | 'trade' | 'both';
    price: string;
    estimated_value: string;
    description: string;
    image_url: string;
  }>({
    name: '',
    brand: '',
    size: '',
    condition: 'excellent',
    listing_type: 'both',
    price: '',
    estimated_value: '',
    description: '',
    image_url: '',
  });

  const [batchCode, setBatchCode] = useState('');
  const [batchVerifying, setBatchVerifying] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    plausibility_score: number;
    verdict: string;
    year?: number | null;
    factory?: string | null;
    explanation?: string;
  } | null>(null);

  const verifyBatchCode = async () => {
    if (!batchCode.trim() || !formData.brand) {
      toast.error('Enter a brand and batch code first');
      return;
    }
    setBatchVerifying(true);
    setBatchResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('verify-batch-code', {
        body: { brand: formData.brand, fragrance_name: formData.name, batch_code: batchCode.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBatchResult(data);
      toast.success('Batch code verified');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Batch verification failed');
    } finally {
      setBatchVerifying(false);
    }
  };

  // Fetch fragrance details when name and brand are selected
  const fetchFragranceDetails = async (name: string, brand: string) => {
    if (!name || !brand) return;
    
    setIsLoadingDetails(true);
    try {
      const { data, error } = await supabase.functions.invoke('fragrance-details', {
        body: { name, brand },
      });
      
      if (error) throw error;
      
      if (data?.details) {
        setFragranceDetails(data.details);
        const details = data.details;

        // Auto-populate size from common sizes (prefer 100ml, else first)
        const sizes: string[] = Array.isArray(details.commonSizes) ? details.commonSizes : [];
        const preferredSize = sizes.find((s) => /100\s*ml/i.test(s)) || sizes[0] || '';

        // Build auto-generated description
        let autoDescription = `${name} by ${brand}`;
        if (details.concentration) autoDescription += ` (${details.concentration})`;
        autoDescription += '.';
        if (details.mainAccords?.length) {
          autoDescription += ` Main accords: ${details.mainAccords.slice(0, 3).join(', ')}.`;
        }
        if (details.topNotes?.length) {
          autoDescription += ` Top notes include ${details.topNotes.slice(0, 3).join(', ')}.`;
        }

        setFormData((prev) => ({
          ...prev,
          name,
          brand,
          size: prev.size || preferredSize,
          description: prev.description || autoDescription,
        }));

        // Lock verified fields
        setIsVerified(true);
        setVerifiedSource('Fragrance database (AI-verified)');
        toast.success('Fragrance details verified and locked');
      }
    } catch (e) {
      console.error('Failed to fetch fragrance details:', e);
      toast.error('Could not verify fragrance details — fields stay editable');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleFragranceSelect = (fragrance: { name: string; brand: string }) => {
    setFormData(prev => ({ ...prev, name: fragrance.name, brand: fragrance.brand }));
    fetchFragranceDetails(fragrance.name, fragrance.brand);
  };

  const unlockFields = () => {
    setIsVerified(false);
    setFragranceDetails(null);
    setVerifiedSource('');
    toast.info('Fields unlocked — re-search to re-verify');
  };

  // Pre-fill from URL params (when converting from collection)
  useEffect(() => {
    const name = searchParams.get('name');
    const brand = searchParams.get('brand');
    const size = searchParams.get('size');
    const image_url = searchParams.get('image_url');
    const notes = searchParams.get('notes');
    
    if (name || brand || size || image_url || notes) {
      setFormData(prev => ({
        ...prev,
        name: name || prev.name,
        brand: brand || prev.brand,
        size: size || prev.size,
        image_url: image_url || prev.image_url,
        description: notes || prev.description,
      }));
      
      if (name || brand) {
        toast.info('Collection item details pre-filled');
      }
    }
  }, [searchParams]);

  if (loading || tradeCheckLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Check trading eligibility for trade/both listings
  if (!canTrade) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center pt-32 px-4 text-center">
          <Users className="w-16 h-16 text-amber-500 mb-4" />
          <h1 className="text-2xl font-serif font-bold mb-2">Listing Restricted</h1>
          <p className="text-muted-foreground mb-4 max-w-md">{tradeBlockReason}</p>
          <Button asChild>
            <Link to="/settings">Go to Settings</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center pt-32">
          <h1 className="text-2xl font-serif font-bold mb-2">Sign in Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to create a listing.</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      brand: formData.brand,
      size: formData.size,
      condition: formData.condition,
      listing_type: formData.listing_type,
      price: formData.price ? parseFloat(formData.price) : null,
      estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
      description: formData.description || null,
      image_url: formData.image_url || null,
    };

    try {
      listingSchema.parse(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    // Validation: image is required AND must come from an approved source
    if (!data.image_url) {
      toast.error('Fragrance photo is required');
      return;
    }
    const { isImageAllowed, getImageVerification } = await import('@/lib/imageVerification');
    if (!isImageAllowed(data.image_url)) {
      const { label } = getImageVerification(data.image_url);
      toast.error(`Image not accepted: ${label}. Upload a real product photo or use an approved source (Fragrantica, Sephora, Notino, Ulta).`);
      return;
    }

    // Validation: description is required
    if (!data.description || data.description.length < 10) {
      toast.error('Description is required (at least 10 characters)');
      return;
    }

    // Validation: sale requires price
    if ((data.listing_type === 'sale' || data.listing_type === 'both') && !data.price) {
      toast.error('Price is required for sale listings');
      return;
    }

    // Validation: trade requires estimated value
    if ((data.listing_type === 'trade' || data.listing_type === 'both') && !data.estimated_value) {
      toast.error('Estimated value is required for trade listings');
      return;
    }

    // Authenticity: trade-eligible listings must include a verified batch code before escrow can start
    const tradeEligible = data.listing_type === 'trade' || data.listing_type === 'both';
    if (tradeEligible) {
      if (!batchCode.trim()) {
        toast.error('Batch code required for trade-eligible listings (used for escrow start).');
        return;
      }
      if (!batchResult) {
        toast.error('Run AI batch-code verification before submitting.');
        return;
      }
    }

    setIsSubmitting(true);

    const { data: inserted, error } = await supabase
      .from('listings')
      .insert({
        ...data,
        owner_id: profile.id,
      })
      .select('id')
      .single();

    if (!error && inserted && batchCode.trim() && batchResult) {
      await supabase.from('listing_batch_codes').insert({
        listing_id: inserted.id,
        owner_profile_id: profile.id,
        batch_code: batchCode.trim().toUpperCase(),
        decoded_year: batchResult.year ?? null,
        decoded_factory: batchResult.factory ?? null,
        ai_plausibility_score: batchResult.plausibility_score ?? null,
        ai_verdict: batchResult.verdict ?? null,
        ai_explanation: batchResult.explanation ?? null,
        verified_at: new Date().toISOString(),
      });
    }

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to create listing');
    } else {
      toast.success('Listing created successfully!');
      navigate(`/profile/${profile.username}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/marketplace">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
          </Button>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Create Listing</CardTitle>
              <CardDescription>List your fragrance for sale, trade, or both</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Fragrance Photo *</Label>
                  <ImageUpload
                    bucket="listing-images"
                    folder={user.id}
                    currentImage={formData.image_url}
                    onUpload={(url) => setFormData({ ...formData, image_url: url })}
                  />
                  <p className="text-xs text-muted-foreground">Required: Upload a clear photo of your fragrance</p>
                </div>

                {/* Fragrance Search with Auto-populate */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Search Fragrance</Label>
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Auto-fill details
                    </Badge>
                  </div>
                  <FragranceSearch
                    nameValue={formData.name}
                    brandValue={formData.brand}
                    onNameChange={(value) => setFormData({ ...formData, name: value })}
                    onBrandChange={(value) => setFormData({ ...formData, brand: value })}
                    onSelect={handleFragranceSelect}
                    nameId="listing-name"
                    brandId="listing-brand"
                    required
                  />
                  {isLoadingDetails && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading fragrance details...
                    </div>
                  )}
                </div>

                {/* Show fetched fragrance details */}
                {fragranceDetails && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Info className="w-4 h-4" />
                      Fragrance Information
                    </div>
                    {fragranceDetails.concentration && (
                      <Badge variant="outline">{fragranceDetails.concentration}</Badge>
                    )}
                    {fragranceDetails.mainAccords && fragranceDetails.mainAccords.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Main Accords: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {fragranceDetails.mainAccords.map((accord) => (
                            <Badge key={accord} variant="secondary" className="text-xs capitalize">
                              {accord}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {fragranceDetails.topNotes && fragranceDetails.topNotes.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Top Notes: </span>
                        <span className="text-xs">{fragranceDetails.topNotes.join(', ')}</span>
                      </div>
                    )}
                    {fragranceDetails.heartNotes && fragranceDetails.heartNotes.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Heart Notes: </span>
                        <span className="text-xs">{fragranceDetails.heartNotes.join(', ')}</span>
                      </div>
                    )}
                    {fragranceDetails.baseNotes && fragranceDetails.baseNotes.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Base Notes: </span>
                        <span className="text-xs">{fragranceDetails.baseNotes.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="size">Size *</Label>
                    <Input
                      id="size"
                      placeholder="e.g., 100ml"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition *</Label>
                    <Select 
                      value={formData.condition} 
                      onValueChange={(value: 'new' | 'like_new' | 'excellent' | 'good' | 'fair') => 
                        setFormData({ ...formData, condition: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New (Sealed in Box)</SelectItem>
                        <SelectItem value="like_new">Like New (Opened, 99%+ full)</SelectItem>
                        <SelectItem value="excellent">Excellent (95-99% full)</SelectItem>
                        <SelectItem value="good">Good (85-95% full)</SelectItem>
                        <SelectItem value="fair">Fair (Less than 85% full)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Listing Type */}
                <div className="space-y-3">
                  <Label>Listing Type *</Label>
                  <RadioGroup
                    value={formData.listing_type}
                    onValueChange={(value: 'sale' | 'trade' | 'both') => 
                      setFormData({ ...formData, listing_type: value })
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sale" id="sale" />
                      <Label htmlFor="sale" className="cursor-pointer">For Sale</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="trade" id="trade" />
                      <Label htmlFor="trade" className="cursor-pointer">For Trade</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both" className="cursor-pointer">Both</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(formData.listing_type === 'sale' || formData.listing_type === 'both') && (
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required={formData.listing_type === 'sale' || formData.listing_type === 'both'}
                      />
                    </div>
                  )}
                  {(formData.listing_type === 'trade' || formData.listing_type === 'both') && (
                    <div className="space-y-2">
                      <Label htmlFor="estimated_value">Estimated Value ($) *</Label>
                      <Input
                        id="estimated_value"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.estimated_value}
                        onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                        required={formData.listing_type === 'trade' || formData.listing_type === 'both'}
                      />
                      <p className="text-xs text-muted-foreground">
                        Used to calculate escrow (50% of this value)
                      </p>
                    </div>
                  )}
                </div>

                {/* Batch Code (required for trade-eligible listings) */}
                {(formData.listing_type === 'trade' || formData.listing_type === 'both') && (
                  <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <Label htmlFor="batch_code" className="m-0">Batch Code *</Label>
                      <Badge variant="secondary" className="text-xs">AI verify</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required to start escrow on trades. We'll plausibility-check the code with AI.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        id="batch_code"
                        value={batchCode}
                        onChange={(e) => { setBatchCode(e.target.value); setBatchResult(null); }}
                        placeholder="e.g. 2L01"
                        maxLength={32}
                      />
                      <Button type="button" variant="outline" onClick={verifyBatchCode} disabled={batchVerifying || !batchCode.trim() || !formData.brand}>
                        {batchVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                      </Button>
                    </div>
                    {batchResult && (
                      <div className={`rounded-md border p-2 text-xs ${
                        batchResult.verdict === 'plausible'
                          ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400'
                          : batchResult.verdict === 'questionable'
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : 'border-border bg-background text-muted-foreground'
                      }`}>
                        <div className="flex items-center gap-1.5 font-medium capitalize">
                          {batchResult.verdict === 'plausible'
                            ? <CheckCircle2 className="w-3.5 h-3.5" />
                            : <AlertTriangle className="w-3.5 h-3.5" />}
                          {batchResult.verdict} · {batchResult.plausibility_score}/100
                        </div>
                        {batchResult.explanation && <p className="mt-1">{batchResult.explanation}</p>}
                        {(batchResult.year || batchResult.factory) && (
                          <p className="mt-1">
                            {batchResult.year && <>Year: {batchResult.year} </>}
                            {batchResult.factory && <>· Factory: {batchResult.factory}</>}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your fragrance, batch code, purchase date, where you bought it, etc."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/1000 characters (minimum 10)
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Listing'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateListing;
