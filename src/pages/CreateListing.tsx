import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { ImageUpload } from '@/components/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2 } from 'lucide-react';
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
  const { user, profile, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

    // Validation: image is required
    if (!data.image_url) {
      toast.error('Fragrance photo is required');
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

    setIsSubmitting(true);

    const { error } = await supabase
      .from('listings')
      .insert({
        ...data,
        owner_id: profile.id,
      });

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

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Fragrance Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Bleu de Chanel"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      placeholder="e.g., Chanel"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      required
                    />
                  </div>
                </div>

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
