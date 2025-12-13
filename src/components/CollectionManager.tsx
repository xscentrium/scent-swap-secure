import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ImageUpload';
import { Plus, Loader2, Trash2, Package, Search, ArrowRight, ArrowUpDown, Upload, FileText } from 'lucide-react';
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

type SortOption = 'newest' | 'oldest' | 'name' | 'brand';

interface CollectionManagerProps {
  profileId: string;
  userId: string;
  isOwnProfile: boolean;
}

export const CollectionManager = ({ profileId, userId, isOwnProfile }: CollectionManagerProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const filteredAndSortedItems = useMemo(() => {
    if (!items) return [];
    
    let filtered = items;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.size?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'brand':
          return a.brand.localeCompare(b.brand);
        default:
          return 0;
      }
    });
  }, [items, searchQuery, sortBy]);

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

  const bulkImport = useMutation({
    mutationFn: async (items: { name: string; brand: string; size?: string }[]) => {
      const { error } = await supabase
        .from('collection_items')
        .insert(
          items.map(item => ({
            profile_id: profileId,
            name: item.name.trim(),
            brand: item.brand.trim(),
            size: item.size?.trim() || null,
          }))
        );
      
      if (error) throw error;
      return items.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['collection', profileId] });
      setBulkDialogOpen(false);
      setBulkInput('');
      toast.success(`Imported ${count} fragrances!`);
    },
    onError: () => {
      toast.error('Failed to import items');
    },
  });

  const parseBulkInput = (input: string): { name: string; brand: string; size?: string }[] => {
    const lines = input.trim().split('\n').filter(line => line.trim());
    const items: { name: string; brand: string; size?: string }[] = [];
    
    for (const line of lines) {
      // Try CSV format first (Name, Brand, Size)
      const csvParts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (csvParts.length >= 2) {
        items.push({
          name: csvParts[0],
          brand: csvParts[1],
          size: csvParts[2] || undefined,
        });
      }
    }
    
    return items;
  };

  const handleBulkImport = () => {
    const items = parseBulkInput(bulkInput);
    if (items.length === 0) {
      toast.error('No valid items found. Use format: Name, Brand, Size (one per line)');
      return;
    }
    bulkImport.mutate(items);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBulkInput(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.brand) {
      toast.error('Name and brand are required');
      return;
    }
    addItem.mutate();
  };

  const handleConvertToListing = (item: CollectionItem) => {
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
        {/* Search and Sort */}
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="brand">Brand A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isOwnProfile && (
          <div className="flex gap-2">
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Bulk Import Fragrances</DialogTitle>
                  <DialogDescription>
                    Import multiple fragrances at once from a CSV file or paste a list
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".csv,.txt"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Upload CSV
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Or paste your list below</Label>
                    <Textarea
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      placeholder="Name, Brand, Size (one per line)&#10;Bleu de Chanel, Chanel, 100ml&#10;Sauvage, Dior, 50ml&#10;Aventus, Creed, 120ml"
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: Name, Brand, Size (size is optional)
                    </p>
                  </div>
                  {bulkInput && (
                    <p className="text-sm text-muted-foreground">
                      {parseBulkInput(bulkInput).length} fragrances detected
                    </p>
                  )}
                  <Button 
                    onClick={handleBulkImport} 
                    className="w-full" 
                    disabled={bulkImport.isPending || !bulkInput.trim()}
                  >
                    {bulkImport.isPending ? 'Importing...' : 'Import All'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
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
          </div>
        )}
      </div>

      {items && items.length > 0 && searchQuery && filteredAndSortedItems.length === 0 && (
        <p className="text-center text-muted-foreground py-4">
          No items match "{searchQuery}"
        </p>
      )}

      {filteredAndSortedItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedItems.map((item) => (
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
