import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { StatsDashboard } from "@/components/StatsDashboard";
import { StatsCharts } from "@/components/StatsCharts";
import { CollectionValueDashboard } from "@/components/CollectionValueDashboard";
import { UsagePatterns } from "@/components/UsagePatterns";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const Performance = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Your Performance & Analytics | Xscentrium"
        description="Track your trading performance, collection value, and usage patterns."
        path="/performance"
      />
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-7xl space-y-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Your Performance</h1>
            <p className="text-muted-foreground">Stats, analytics, and usage insights for your collection.</p>
          </div>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Your Stats</h2>
            <StatsDashboard />
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Your Analytics</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <StatsCharts />
              <div className="space-y-6">
                <CollectionValueDashboard />
                <UsagePatterns />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Performance;
