import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-serif font-bold">ScentSwap</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#marketplace" className="text-sm font-medium hover:text-primary transition-colors">
              Marketplace
            </a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </a>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button size="sm" variant="default">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
