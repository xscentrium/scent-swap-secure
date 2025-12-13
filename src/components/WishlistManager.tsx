import { useState } from 'react';
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
import { Plus, Loader2, Trash2, Heart, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

type WishlistItem = {
  id: string;
  profile_id: string;
  name: string;
  brand: string;
  notes: string | null;
  priority: string;
  created_at: string;
};

interface WishlistManagerProps {
  profileId: string;
  profileUsername: string;
  isOwnProfile: boolean;
  currentUserProfile?: { id: string } | null;
}

export const WishlistManager = ({ profileId, profileUsername, isOwnProfile, currentUserProfile }: WishlistManagerProps) => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
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
      {isOwnProfile && (
        <div className="flex justify-end">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wish-name">Name *</Label>
                    <Input
                      id="wish-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Aventus"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wish-brand">Brand *</Label>
                    <Input
                      id="wish-brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g., Creed"
                      required
                    />
                  </div>
                </div>
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

      {items && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
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
      ) : (
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
