import { Button } from "@/components/ui/button";
import { Shield, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMarketplace = () => {
    const element = document.getElementById('marketplace');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Subtle ambient glow */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl"></div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-4 animate-in slide-in-from-top duration-700">
            <Shield className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-foreground">Secure Fragrance Trading</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight animate-in slide-in-from-bottom duration-700 delay-100 text-foreground">
            Trade Your Signature{" "}
            <span className="text-foreground">Scents</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom duration-700 delay-200">
            Connect with fragrance enthusiasts worldwide. Trade colognes, perfumes, and rare oils with confidence through our secure escrow system.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in slide-in-from-bottom duration-700 delay-300">
            {/* Gold CTA - this IS a money action */}
            <Button size="lg" className="group bg-primary hover:bg-accent text-primary-foreground shadow-luxury transition-all duration-300" asChild>
              <Link to="/marketplace">
                Start Trading
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" onClick={scrollToHowItWorks} className="border-border text-foreground hover:bg-card">
              Learn How It Works
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-in slide-in-from-bottom duration-700 delay-500">
            <div className="p-6 rounded-xl bg-card border border-border hover:border-border/80 transition-all duration-300 group">
              {/* Gold for "Verified" - premium feature */}
              <Shield className="w-8 h-8 text-primary mb-3 mx-auto transition-transform duration-300 group-hover:scale-110" />
              <h3 className="font-semibold mb-2 text-foreground">ID Verified</h3>
              <p className="text-sm text-muted-foreground">All users verify their identity for secure trading</p>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border hover:border-border/80 transition-all duration-300 group">
              {/* Gold for money protection */}
              <div className="w-8 h-8 text-primary mb-3 mx-auto font-bold text-2xl transition-transform duration-300 group-hover:scale-110">$</div>
              <h3 className="font-semibold mb-2 text-foreground">Escrow Protected</h3>
              <p className="text-sm text-muted-foreground">Hold deposits ensure fair trades for both parties</p>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border hover:border-border/80 transition-all duration-300 group">
              {/* Regular icon - not gold since not premium/money */}
              <Sparkles className="w-8 h-8 text-foreground mb-3 mx-auto transition-transform duration-300 group-hover:scale-110" />
              <h3 className="font-semibold mb-2 text-foreground">Premium Selection</h3>
              <p className="text-sm text-muted-foreground">Discover rare and exclusive fragrances</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
