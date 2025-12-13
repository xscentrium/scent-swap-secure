import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ImageUpload';
import { Plus, Loader2, Trash2, Package, Search, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

type CollectionItem = {
  id: string;
  profile_id: string;
  name: string;
  brand: string;
  size: string | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
};

interface CollectionManagerProps {
  profileId: string;
  userId: string;
  isOwnProfile: boolean;
}

export const CollectionManager = ({ profileId, userId, isOwnProfile }: CollectionManagerProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    size: '',
    notes: '',
    image_url: '',
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['collection', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_items')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CollectionItem[];
    },
  });

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.brand.toLowerCase().includes(query) ||
      item.size?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const addItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('collection_items')
        .insert({
          profile_id: profileId,
          name: formData.name,
          brand: formData.brand,
          size: formData.size || null,
          notes: formData.notes || null,
          image_url: formData.image_url || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection', profileId] });
      setDialogOpen(false);
      setFormData({ name: '', brand: '', size: '', notes: '', image_url: '' });
      toast.success('Added to collection!');
    },
    onError: () => {
      toast.error('Failed to add item');
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('collection_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection', profileId] });
      toast.success('Removed from collection');
    },
    onError: () => {
      toast.error('Failed to remove item');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.brand) {
      toast.error('Name and brand are required');
      return;
    }
    addItem.mutate();
  };

  const handleConvertToListing = (item: CollectionItem) => {
    // Navigate to create listing with pre-filled data
    const params = new URLSearchParams({
      name: item.name,
      brand: item.brand,
      size: item.size || '',
      image_url: item.image_url || '',
      notes: item.notes || '',
    });
    navigate(`/create-listing?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {isOwnProfile && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add to Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Your Collection</DialogTitle>
                <DialogDescription>
                  Add a fragrance you already own to showcase in your collection
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Photo</Label>
                  <ImageUpload
                    bucket="listing-images"
                    folder={userId}
                    currentImage={formData.image_url}
                    onUpload={(url) => setFormData({ ...formData, image_url: url })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Bleu de Chanel"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g., Chanel"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g., 100ml"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any notes about this fragrance..."
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={addItem.isPending}>
                  {addItem.isPending ? 'Adding...' : 'Add to Collection'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {items && items.length > 0 && searchQuery && filteredItems.length === 0 && (
        <p className="text-center text-muted-foreground py-4">
          No items match "{searchQuery}"
        </p>
      )}

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden group relative">
              <div className="aspect-square bg-muted">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                <p className="text-xs text-muted-foreground truncate">{item.brand}</p>
                {item.size && <p className="text-xs text-muted-foreground">{item.size}</p>}
              </CardContent>
              {isOwnProfile && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleConvertToListing(item)}
                    title="Convert to Listing"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteItem.mutate(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : !searchQuery && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No fragrances in collection yet</p>
          {isOwnProfile && (
            <p className="text-sm mt-2">Add fragrances you own to showcase them!</p>
          )}
        </div>
      )}
    </div>
  );
};
