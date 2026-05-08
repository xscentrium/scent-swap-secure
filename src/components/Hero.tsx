import { Button } from "@/components/ui/button";
import { Shield, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type HeroListing = { id: string; name: string; brand: string; image_url: string | null };

// Respect users who prefer reduced motion: disable parallax & long fades.
const prefersReducedMotion = typeof window !== "undefined"
  && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const Hero = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Smaller parallax distance + GPU-friendly transform-only animation
  const yImg = useTransform(scrollYProgress, [0, 1], ["0%", prefersReducedMotion ? "0%" : "12%"]);
  const yText = useTransform(scrollYProgress, [0, 1], ["0%", prefersReducedMotion ? "0%" : "-6%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  const [index, setIndex] = useState(0);

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  const { data: listings } = useQuery({
    queryKey: ["hero-listings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, name, brand, image_url")
        .eq("is_active", true)
        .not("image_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(8);
      return (data ?? []) as HeroListing[];
    },
  });

  const slides = listings && listings.length > 0 ? listings : [];

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const current = slides[index];

  return (
    <section
      ref={ref}
      className="relative min-h-[92vh] flex items-center overflow-hidden"
    >
      {/* Background carousel with parallax */}
      <motion.div className="absolute inset-0 z-0" style={{ y: yImg }}>
        {slides.map((s, i) => (
          <motion.div
            key={s.id}
            initial={false}
            animate={{ opacity: i === index ? 1 : 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src={s.image_url ?? ""}
              alt={`${s.brand} ${s.name}`}
              className="w-full h-full object-cover scale-110"
              loading={i === 0 ? "eager" : "lazy"}
            />
          </motion.div>
        ))}
        {/* Soft warm gradient veils for legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </motion.div>

      {/* Subtle ambient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/5 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl z-0"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="container mx-auto px-6 lg:px-10 relative z-10"
        style={{ y: yText, opacity }}
      >
        <div className="max-w-2xl space-y-7">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/70 backdrop-blur-md border border-border/60"
          >
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-foreground/70">
              Curated · Escrow Protected
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif font-medium tracking-tight leading-[1.02] text-5xl md:text-6xl lg:text-7xl text-foreground"
          >
            Trade your
            <span className="block italic font-normal text-primary">signature scent</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base md:text-lg text-muted-foreground max-w-xl leading-[1.7] font-light"
          >
            A members-only marketplace for collectors. Discover rare colognes, perfumes
            and oils — verified, escrow-backed, exchanged with intention.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 pt-2"
          >
            <Button
              size="lg"
              className="group h-12 px-7 rounded-full bg-gradient-to-b from-primary to-[hsl(35_38%_42%)] text-primary-foreground shadow-[0_10px_30px_-10px_hsl(35_38%_48%/0.55)] hover:shadow-[0_14px_36px_-10px_hsl(35_38%_48%/0.65)] transition-all"
              asChild
            >
              <Link to="/marketplace">
                Explore the Marketplace
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={scrollToHowItWorks}
              className="h-12 px-6 rounded-full border border-border/60 bg-card/50 backdrop-blur-md hover:bg-card/80 text-foreground"
            >
              How It Works
            </Button>
          </motion.div>

          {/* Currently showing */}
          {current && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="pt-8 flex items-center gap-4"
            >
              <div className="h-14 w-14 rounded-md overflow-hidden border border-border/60 shadow-sm bg-card">
                <img
                  src={current.image_url ?? ""}
                  alt={current.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground mb-0.5">
                  Now featured
                </p>
                <p className="font-serif text-base text-foreground leading-tight">
                  {current.name}
                </p>
                <p className="text-xs text-muted-foreground">{current.brand}</p>
              </div>
            </motion.div>
          )}

          {/* Slide indicators */}
          {slides.length > 1 && (
            <div className="flex items-center gap-2 pt-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Show ${s.name}`}
                  className={`h-[3px] rounded-full transition-all ${
                    i === index ? "w-8 bg-primary" : "w-3 bg-foreground/20 hover:bg-foreground/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Trust strip */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-border/40 bg-background/60 backdrop-blur-md">
        <div className="container mx-auto px-6 lg:px-10 py-4 grid grid-cols-3 gap-6 text-center">
          {[
            { icon: Shield, label: "ID Verified Traders" },
            { icon: () => <span className="font-serif text-lg text-primary">$</span>, label: "50% Escrow Hold" },
            { icon: Sparkles, label: "Curated by Collectors" },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-center gap-2 text-xs md:text-sm text-muted-foreground">
              <f.icon className="w-4 h-4 text-primary" />
              <span className="tracking-wide">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
