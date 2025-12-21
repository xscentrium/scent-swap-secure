import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Marketplace } from "@/components/Marketplace";
import { StatsDashboard } from "@/components/StatsDashboard";
import { NotificationPermissionBanner } from "@/components/NotificationPermissionBanner";
import { useTradeMatches } from "@/hooks/useTradeMatches";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { profile } = useAuth();
  // Check for trade matches on page load (triggers notification if matches found)
  useTradeMatches();

  return (
    <div className="min-h-screen">
      <NotificationPermissionBanner />
      <Navigation />
      <main className="pt-16">
        <Hero />
        {profile && <StatsDashboard />}
        <HowItWorks />
        <Marketplace />
      </main>
    </div>
  );
};

export default Index;
