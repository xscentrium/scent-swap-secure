import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { FragranceDetailsModal } from '@/components/FragranceDetailsModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Package, Loader2, ArrowLeft, User } from 'lucide-react';

const SharedCollection = () => {
  const { username } = useParams<{ username: string }>();
  const [selectedItem, setSelectedItem] = useState<{ name: string; brand: string; imageUrl?: string | null } | null>(null);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('username', username)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['collection', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_items')
        .select('*')
        .eq('profile_id', profile!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

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
          <p className="text-muted-foreground mb-4">This collection doesn't exist.</p>
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
                {profile.display_name || profile.username}'s Collection
              </h1>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
          </div>

          {/* Collection Grid */}
          {items && items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedItem({ name: item.name, brand: item.brand, imageUrl: item.image_url })}
                >
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
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No fragrances in this collection yet</p>
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
          imageUrl={selectedItem.imageUrl}
        />
      )}
    </div>
  );
};

export default SharedCollection;
