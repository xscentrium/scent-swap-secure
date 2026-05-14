import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { SEO } from "@/components/SEO";
import { TrustStrip } from "@/components/TrustStrip";
import { HowItWorks } from "@/components/HowItWorks";
import { Marketplace } from "@/components/Marketplace";
import { FeaturedListings } from "@/components/FeaturedListings";
import { StatsDashboard } from "@/components/StatsDashboard";
import { StatsCharts } from "@/components/StatsCharts";
import { CollectionValueDashboard } from "@/components/CollectionValueDashboard";
import { UsagePatterns } from "@/components/UsagePatterns";
import { NotificationPermissionBanner } from "@/components/NotificationPermissionBanner";
import { SocialFeed } from "@/components/SocialFeed";
import { AIRecommendations } from "@/components/AIRecommendations";
import { useTradeMatches } from "@/hooks/useTradeMatches";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { profile } = useAuth();
  // Check for trade matches on page load (triggers notification if matches found)
  useTradeMatches();

  const { data: collection } = useQuery({
    queryKey: ['collection', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('collection_items')
        .select('name, brand')
        .eq('profile_id', profile.id);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('wishlist_items')
        .select('name, brand')
        .eq('profile_id', profile.id);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  return (
    <div className="min-h-screen">
      <NotificationPermissionBanner />
      <SEO
        title="Xscentrium — Trade Rare Fragrances Securely"
        description="A members-only marketplace for collectors. Trade rare colognes, perfumes & oils — ID-verified, escrow-backed, curated."
        path="/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Xscentrium",
            url: "https://xscentrium.com/",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://xscentrium.com/marketplace?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Xscentrium",
            url: "https://xscentrium.com/",
            logo: "https://xscentrium.com/favicon.png",
            sameAs: ["https://twitter.com/Xscentrium"],
          },
        ]}
      />
      <main>
        <Hero />
        <TrustStrip />
        {profile && (
          <>
            <StatsDashboard />
            
            {/* Analytics Dashboard Section */}
            <section className="py-12 bg-background">
              <div className="container mx-auto px-4 max-w-7xl">
                <h2 className="text-3xl font-serif font-bold text-center mb-8">Your Analytics</h2>
                <div className="grid gap-6 lg:grid-cols-2">
                  <StatsCharts />
                  <div className="space-y-6">
                    <CollectionValueDashboard />
                    <UsagePatterns />
                  </div>
                </div>
              </div>
            </section>

            {/* Social & Recommendations Section */}
            <section className="py-12 bg-muted/30">
              <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid gap-6 lg:grid-cols-2">
                  <SocialFeed />
                  <AIRecommendations collection={collection} wishlist={wishlist} />
                </div>
              </div>
            </section>
          </>
        )}
        <FeaturedListings />
        <HowItWorks />
        <Marketplace />
      </main>
    </div>
  );
};

export default Index;
