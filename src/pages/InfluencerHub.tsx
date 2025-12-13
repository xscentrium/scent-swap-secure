import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, Instagram, Twitter, Facebook, ExternalLink, 
  Loader2, Play, CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Influencer = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  instagram_verified: boolean;
  twitter_verified: boolean;
  facebook_verified: boolean;
  tiktok_verified: boolean;
};

type InfluencerContent = {
  id: string;
  profile_id: string;
  embed_url: string;
  platform: string;
  title: string | null;
  thumbnail_url: string | null;
};

type AffiliateLink = {
  id: string;
  profile_id: string;
  fragrance_name: string;
  brand: string;
  affiliate_url: string;
  description: string | null;
};

const InfluencerHub = () => {
  const { data: influencers, isLoading } = useQuery({
    queryKey: ['influencers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_influencer', true);
      
      if (error) throw error;
      return data as Influencer[];
    },
  });

  const { data: allContent } = useQuery({
    queryKey: ['influencer-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('influencer_content')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12);
      
      if (error) throw error;
      return data as InfluencerContent[];
    },
  });

  const { data: allAffiliateLinks } = useQuery({
    queryKey: ['affiliate-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as AffiliateLink[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Star className="w-3 h-3 mr-1" />
              Featured Creators
            </Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Influencer Hub
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover trusted fragrance reviewers, watch their latest content, 
              and shop their curated recommendations.
            </p>
          </div>

          {/* Influencers Grid */}
          <section className="mb-16">
            <h2 className="text-2xl font-serif font-bold mb-6">Featured Influencers</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : influencers && influencers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {influencers.map((influencer) => (
                  <Card key={influencer.id} className="group hover:shadow-luxury transition-all duration-300 border-border/50">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="w-20 h-20 mb-4 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                          <AvatarImage src={influencer.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                            {influencer.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-lg mb-1">
                          {influencer.display_name || influencer.username}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          @{influencer.username}
                        </p>
                        
                        {/* Social Links */}
                        <div className="flex gap-2 mb-4">
                          {influencer.instagram_url && (
                            <a 
                              href={influencer.instagram_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 rounded-full bg-muted hover:bg-primary/10 transition-colors"
                            >
                              <Instagram className="w-4 h-4" />
                              {influencer.instagram_verified && (
                                <CheckCircle className="w-2 h-2 absolute -top-0.5 -right-0.5 text-primary" />
                              )}
                            </a>
                          )}
                          {influencer.twitter_url && (
                            <a 
                              href={influencer.twitter_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 rounded-full bg-muted hover:bg-primary/10 transition-colors"
                            >
                              <Twitter className="w-4 h-4" />
                            </a>
                          )}
                          {influencer.facebook_url && (
                            <a 
                              href={influencer.facebook_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 rounded-full bg-muted hover:bg-primary/10 transition-colors"
                            >
                              <Facebook className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        {influencer.bio && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {influencer.bio}
                          </p>
                        )}

                        <Button variant="outline" className="w-full" asChild>
                          <Link to={`/profile/${influencer.username}`}>
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No featured influencers yet</p>
                <p className="text-sm">Check back soon for curated fragrance experts!</p>
              </div>
            )}
          </section>

          {/* Latest Content */}
          {allContent && allContent.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl font-serif font-bold mb-6">Latest Reviews</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {allContent.map((content) => (
                  <Card key={content.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <a 
                      href={content.embed_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className="aspect-video bg-muted relative">
                        {content.thumbnail_url ? (
                          <img
                            src={content.thumbnail_url}
                            alt={content.title || 'Video thumbnail'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-foreground/0 hover:bg-foreground/10 transition-colors flex items-center justify-center">
                          <Play className="w-12 h-12 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <Badge className="absolute top-2 right-2 capitalize">
                          {content.platform}
                        </Badge>
                      </div>
                      {content.title && (
                        <CardContent className="p-4">
                          <p className="font-medium line-clamp-2">{content.title}</p>
                        </CardContent>
                      )}
                    </a>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Affiliate Links */}
          {allAffiliateLinks && allAffiliateLinks.length > 0 && (
            <section>
              <h2 className="text-2xl font-serif font-bold mb-6">Shop Recommendations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {allAffiliateLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{link.fragrance_name}</h3>
                            <p className="text-sm text-muted-foreground">{link.brand}</p>
                            {link.description && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                {link.description}
                              </p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default InfluencerHub;
