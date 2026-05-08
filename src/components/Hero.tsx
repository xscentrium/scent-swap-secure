import { Button } from "@/components/ui/button";
import { Shield, Sparkles, ArrowRight, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type HeroListing = { id: string; name: string; brand: string; image_url: string | null };

const prefersReducedMotion = typeof window !== "undefined"
  && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const Hero = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yText = useTransform(scrollYProgress, [0, 1], ["0%", prefersReducedMotion ? "0%" : "-8%"]);
  const yStack = useTransform(scrollYProgress, [0, 1], ["0%", prefersReducedMotion ? "0%" : "-14%"]);
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
        .limit(6);
      return (data ?? []) as HeroListing[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["hero-stats"],
    queryFn: async () => {
      const [{ count: listingsCount }, { count: tradersCount }] = await Promise.all([
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("id_verified", true),
      ]);
      return { listingsCount: listingsCount ?? 0, tradersCount: tradersCount ?? 0 };
    },
  });

  const slides = listings && listings.length > 0 ? listings : [];

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  const current = slides[index];

  return (
    <section
      ref={ref}
      className="relative min-h-[100vh] flex items-center overflow-hidden bg-background"
    >
      {/* Layered ambient backdrop */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.22),transparent_60%)]" />
        {/* Grain */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
      </div>

      {/* Floating ambient orbs */}
      <motion.div
        className="absolute top-[10%] left-[12%] w-[32rem] h-[32rem] rounded-full bg-primary/8 blur-3xl z-0"
        animate={prefersReducedMotion ? undefined : { y: [0, -30, 0], x: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[15%] right-[10%] w-[28rem] h-[28rem] rounded-full bg-accent/15 blur-3xl z-0"
        animate={prefersReducedMotion ? undefined : { y: [0, 30, 0], x: [0, -25, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-6 lg:px-10 relative z-10 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center pt-24 pb-32">
        {/* LEFT — Editorial copy */}
        <motion.div style={{ y: yText, opacity }} className="space-y-8 max-w-xl">
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
            className="font-serif font-medium tracking-tight leading-[0.98] text-[3.25rem] md:text-7xl lg:text-[5.5rem] text-foreground"
          >
            The art of
            <span className="block italic font-normal text-primary mt-1">
              scent, traded.
            </span>
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="h-px w-24 bg-gradient-to-r from-primary to-transparent origin-left"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-base md:text-lg text-muted-foreground max-w-lg leading-[1.75] font-light"
          >
            A members-only marketplace for collectors. Discover rare colognes,
            perfumes and oils — verified, escrow-backed, exchanged with intention.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 pt-2"
          >
            <Button
              size="lg"
              className="group h-12 px-7 rounded-full bg-gradient-to-b from-primary to-[hsl(35_38%_42%)] text-primary-foreground shadow-[0_10px_30px_-10px_hsl(35_38%_48%/0.55)] hover:shadow-[0_18px_40px_-10px_hsl(35_38%_48%/0.7)] transition-all"
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

          {/* Live stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="grid grid-cols-3 gap-4 pt-8 border-t border-border/40"
          >
            <Stat value={stats?.listingsCount ?? 0} label="Active listings" />
            <Stat value={stats?.tradersCount ?? 0} label="Verified traders" />
            <Stat value={50} suffix="%" label="Escrow held" />
          </motion.div>
        </motion.div>

        {/* RIGHT — Stacked bottle showcase */}
        <motion.div style={{ y: yStack }} className="relative h-[520px] hidden lg:block">
          {slides.length === 0 ? (
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-muted/40 to-card/40 border border-border/40 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-primary/30" />
            </div>
          ) : (
            <>
              {/* Main feature card */}
              {current && (
                <motion.div
                  key={`hero-main-${current.id}`}
                  initial={{ opacity: 0, scale: 0.96, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute top-0 right-0 w-[78%] h-[88%] rounded-3xl overflow-hidden shadow-2xl border border-border/40 bg-card"
                >
                  <img
                    src={current.image_url ?? ""}
                    alt={`${current.brand} ${current.name}`}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-primary mb-2 font-medium">
                      Featured
                    </p>
                    <h3 className="font-serif text-2xl text-foreground leading-tight mb-1">
                      {current.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{current.brand}</p>
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border/40">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    <span className="text-[11px] font-medium">Editor's pick</span>
                  </div>
                </motion.div>
              )}

              {/* Secondary thumbnail stack */}
              <div className="absolute bottom-0 left-0 w-[42%] space-y-3">
                {slides.slice(0, 3).filter(s => s.id !== current?.id).slice(0, 2).map((s, i) => (
                  <motion.button
                    key={s.id}
                    onClick={() => setIndex(slides.findIndex(x => x.id === s.id))}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="block w-full aspect-[4/3] rounded-xl overflow-hidden border border-border/40 bg-card shadow-xl hover:border-primary/60 transition-colors group relative"
                  >
                    <img
                      src={s.image_url ?? ""}
                      alt={`${s.brand} ${s.name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/85 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                      <p className="font-serif text-sm text-foreground truncate">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{s.brand}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Floating live ticker */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                className="absolute top-6 left-0 px-4 py-3 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/60 shadow-xl flex items-center gap-3"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Live</p>
                  <p className="text-xs font-medium text-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    {stats?.listingsCount ?? 0} listings trading
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>

      {/* Trust strip */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-border/40 bg-background/70 backdrop-blur-md">
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

function Stat({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  return (
    <div>
      <p className="font-serif text-2xl md:text-3xl text-foreground leading-none">
        {value.toLocaleString()}{suffix}
      </p>
      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-2">{label}</p>
    </div>
  );
}
