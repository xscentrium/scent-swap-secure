import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Marketplace } from "@/components/Marketplace";
import { useTradeMatches } from "@/hooks/useTradeMatches";

const Index = () => {
  // Check for trade matches on page load (triggers notification if matches found)
  useTradeMatches();

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16">
        <Hero />
        <HowItWorks />
        <Marketplace />
      </main>
    </div>
  );
};

export default Index;
