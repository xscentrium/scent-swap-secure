import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2, Trash2, Heart, MessageSquare, Search, Filter, ArrowUpDown, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { FragranceSearch } from './FragranceSearch';

type WishlistItem = {
  id: string;
  profile_id: string;
  name: string;
  brand: string;
  notes: string | null;
  priority: string;
  created_at: string;
};

type SortOption = 'newest' | 'oldest' | 'name' | 'brand' | 'priority';

interface WishlistManagerProps {
  profileId: string;
  profileUsername: string;
  isOwnProfile: boolean;
  currentUserProfile?: { id: string } | null;
}

export const WishlistManager = ({ profileId, profileUsername, isOwnProfile, currentUserProfile }: WishlistManagerProps) => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    notes: '',
    priority: 'medium',
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['wishlist', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WishlistItem[];
    },
  });

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  const filteredAndSortedItems = useMemo(() => {
    if (!items) return [];
    
    let filtered = items;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query)
      );
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === priorityFilter);
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
        case 'priority':
          return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1) - 
                 (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1);
        default:
          return 0;
      }
    });
  }, [items, searchQuery, priorityFilter, sortBy]);

  const addItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('wishlist_items')
        .insert({
          profile_id: profileId,
          name: formData.name,
          brand: formData.brand,
          notes: formData.notes || null,
          priority: formData.priority,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', profileId] });
      setDialogOpen(false);
      setFormData({ name: '', brand: '', notes: '', priority: 'medium' });
      toast.success('Added to wishlist!');
    },
    onError: () => {
      toast.error('Failed to add item');
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', profileId] });
      toast.success('Removed from wishlist');
    },
    onError: () => {
      toast.error('Failed to remove item');
    },
  });

  const bulkImport = useMutation({
    mutationFn: async (items: { name: string; brand: string; priority?: string }[]) => {
      const { error } = await supabase
        .from('wishlist_items')
        .insert(
          items.map(item => ({
            profile_id: profileId,
            name: item.name.trim(),
            brand: item.brand.trim(),
            priority: item.priority?.trim() || 'medium',
          }))
        );
      
      if (error) throw error;
      return items.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', profileId] });
      setBulkDialogOpen(false);
      setBulkInput('');
      toast.success(`Imported ${count} fragrances to wishlist!`);
    },
    onError: () => {
      toast.error('Failed to import items');
    },
  });

  const parseBulkInput = (input: string): { name: string; brand: string; priority?: string }[] => {
    const lines = input.trim().split('\n').filter(line => line.trim());
    const items: { name: string; brand: string; priority?: string }[] = [];
    
    for (const line of lines) {
      const csvParts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (csvParts.length >= 2) {
        items.push({
          name: csvParts[0],
          brand: csvParts[1],
          priority: csvParts[2] || 'medium',
        });
      }
    }
    
    return items;
  };

  const handleBulkImport = () => {
    const items = parseBulkInput(bulkInput);
    if (items.length === 0) {
      toast.error('No valid items found. Use format: Name, Brand, Priority (one per line)');
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'low':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
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
        {/* Search, Filter, and Sort */}
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search wishlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[130px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="brand">Brand A-Z</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
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
                  <DialogTitle>Bulk Import to Wishlist</DialogTitle>
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
                      placeholder="Name, Brand, Priority (one per line)&#10;Aventus, Creed, high&#10;Sauvage, Dior, medium&#10;Bleu de Chanel, Chanel, low"
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: Name, Brand, Priority (priority is optional: high/medium/low)
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
                  Add to Wishlist
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Your Wishlist</DialogTitle>
                <DialogDescription>
                  Add a fragrance you're looking for so others can offer trades
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FragranceSearch
                  onSelect={(fragrance) => setFormData({ ...formData, name: fragrance.name, brand: fragrance.brand })}
                  nameValue={formData.name}
                  brandValue={formData.brand}
                  onNameChange={(value) => setFormData({ ...formData, name: value })}
                  onBrandChange={(value) => setFormData({ ...formData, brand: value })}
                  nameId="wish-name"
                  brandId="wish-brand"
                  required
                />
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wish-notes">Notes</Label>
                  <Textarea
                    id="wish-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Preferred size, batch, condition, etc..."
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={addItem.isPending}>
                  {addItem.isPending ? 'Adding...' : 'Add to Wishlist'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      {items && items.length > 0 && (searchQuery || priorityFilter !== 'all') && filteredAndSortedItems.length === 0 && (
        <p className="text-center text-muted-foreground py-4">
          No items match your filters
        </p>
      )}

      {filteredAndSortedItems.length > 0 ? (
        <div className="space-y-3">
          {filteredAndSortedItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate">{item.name}</h4>
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.brand}</p>
                  {item.notes && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!isOwnProfile && currentUserProfile && (
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/messages?to=${profileUsername}&about=wishlist:${item.name}`}>
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Offer
                      </Link>
                    </Button>
                  )}
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteItem.mutate(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !(searchQuery || priorityFilter !== 'all') && (
        <div className="text-center py-12 text-muted-foreground">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No items on wishlist yet</p>
          {isOwnProfile && (
            <p className="text-sm mt-2">Add fragrances you're looking for!</p>
          )}
        </div>
      )}
    </div>
  );
};
