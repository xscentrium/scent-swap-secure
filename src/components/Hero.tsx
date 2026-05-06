import { Button } from "@/components/ui/button";
import { Shield, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const Hero = () => {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: Shield, title: "ID Verified", desc: "Every trader's identity confirmed before trading begins." },
    { icon: () => <span className="text-2xl font-serif font-bold text-primary">$</span>, title: "Escrow Protected", desc: "50% deposits held until both sides confirm delivery." },
    { icon: Sparkles, title: "Curated Rarity", desc: "Hand-picked discoveries from a community of collectors." },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden mesh-bg grain">
      {/* Floating gold orbs */}
      <motion.div
        className="absolute top-1/4 left-1/5 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl"
        animate={{ y: [0, -30, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/5 w-[22rem] h-[22rem] rounded-full bg-accent/10 blur-3xl"
        animate={{ y: [0, 25, 0], scale: [1.05, 1, 1.05] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-primary/20"
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium tracking-wide uppercase text-foreground/80">Secure Fragrance Trading</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif font-semibold tracking-tight leading-[1.05]"
          >
            Trade Your Signature{" "}
            <span className="gradient-text">Scents</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Connect with collectors worldwide. Trade colognes, perfumes, and rare oils with confidence through our escrow-backed marketplace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Button size="lg" className="group bg-primary text-primary-foreground shadow-luxury hover:shadow-glow hover-lift" asChild>
              <Link to="/marketplace">
                Start Trading
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" onClick={scrollToHowItWorks} className="glass border-border/60 hover:border-primary/40">
              How It Works
            </Button>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } } }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }}
                className="glass-card p-6 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 ring-1 ring-primary/20">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
