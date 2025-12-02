import { Button } from "@/components/ui/button";
import { Shield, Sparkles, ArrowRight } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4 animate-in slide-in-from-top duration-700">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent-foreground">Secure Fragrance Trading</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight animate-in slide-in-from-bottom duration-700 delay-100">
            Trade Your Signature{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Scents
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom duration-700 delay-200">
            Connect with fragrance enthusiasts worldwide. Trade colognes, perfumes, and rare oils with confidence through our secure escrow system.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in slide-in-from-bottom duration-700 delay-300">
            <Button size="lg" variant="hero" className="group">
              Start Trading
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline">
              Learn How It Works
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-in slide-in-from-bottom duration-700 delay-500">
            <div className="p-6 rounded-xl bg-card border border-border shadow-lg hover:shadow-luxury transition-smooth">
              <Shield className="w-8 h-8 text-primary mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">ID Verified</h3>
              <p className="text-sm text-muted-foreground">All users verify their identity for secure trading</p>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border shadow-lg hover:shadow-luxury transition-smooth">
              <div className="w-8 h-8 text-primary mb-3 mx-auto font-bold text-2xl">$</div>
              <h3 className="font-semibold mb-2">Escrow Protected</h3>
              <p className="text-sm text-muted-foreground">Hold deposits ensure fair trades for both parties</p>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border shadow-lg hover:shadow-luxury transition-smooth">
              <Sparkles className="w-8 h-8 text-primary mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Premium Selection</h3>
              <p className="text-sm text-muted-foreground">Discover rare and exclusive fragrances</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
