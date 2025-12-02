import { Shield, DollarSign, Package, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Shield,
    title: "Verify Your Identity",
    description: "Complete a simple ID verification to ensure trust and safety for all users"
  },
  {
    icon: Package,
    title: "List Your Fragrances",
    description: "Create listings for fragrances you want to trade with detailed photos and descriptions"
  },
  {
    icon: DollarSign,
    title: "Escrow Protection",
    description: "Both parties deposit half the trade value as collateral to ensure fair exchange"
  },
  {
    icon: CheckCircle,
    title: "Trade with Confidence",
    description: "Ship your items and release funds once both parties confirm receipt"
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-in fade-in duration-700">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trade fragrances securely in four simple steps
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index} 
                className="relative animate-in slide-in-from-bottom duration-700"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-accent flex items-center justify-center text-xl font-bold text-accent-foreground">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold pt-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-4 w-8 border-t-2 border-dashed border-border"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
