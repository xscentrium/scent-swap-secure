import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { FragranceDetailsModal } from '@/components/FragranceDetailsModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Loader2, ArrowLeft } from 'lucide-react';

const SharedWishlist = () => {
  const { username } = useParams<{ username: string }>();
  const [selectedItem, setSelectedItem] = useState<{ name: string; brand: string } | null>(null);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, username, display_name, avatar_url')
        .eq('username', username)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['wishlist', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('profile_id', profile!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

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

  if (profileLoading || itemsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center pt-32">
          <h1 className="text-2xl font-serif font-bold mb-2">User not found</h1>
          <p className="text-muted-foreground mb-4">This wishlist doesn't exist.</p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to={`/profile/${username}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              View Full Profile
            </Link>
          </Button>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-serif font-bold">
                {profile.display_name || profile.username}'s Wishlist
              </h1>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
          </div>

          {/* Wishlist Items */}
          {items && items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedItem({ name: item.name, brand: item.brand })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">{item.name}</h4>
                          <Badge className={getPriorityColor(item.priority || 'medium')}>
                            {item.priority || 'medium'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.brand}</p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No items on this wishlist yet</p>
            </div>
          )}
        </div>
      </main>

      {selectedItem && (
        <FragranceDetailsModal
          open={!!selectedItem}
          onOpenChange={() => setSelectedItem(null)}
          name={selectedItem.name}
          brand={selectedItem.brand}
        />
      )}
    </div>
  );
};

export default SharedWishlist;
