import { motion } from "framer-motion";
import { Shield, Lock, Clock, BadgeCheck, Sparkles, TrendingUp } from "lucide-react";

const pillars = [
  {
    icon: Shield,
    title: "ID Verified",
    description: "Every trader submits government ID for identity confirmation",
  },
  {
    icon: Lock,
    title: "50% Escrow",
    description: "Half the trade value held in escrow until both parties confirm",
  },
  {
    icon: Clock,
    title: "24h Review",
    description: "New listings and IDs reviewed within one business day",
  },
  {
    icon: BadgeCheck,
    title: "Authenticity",
    description: "Batch-code verified bottles with community flagging",
  },
  {
    icon: Sparkles,
    title: "Curated",
    description: "Hand-selected community of fragrance collectors",
  },
  {
    icon: TrendingUp,
    title: "Live Market",
    description: "Real-time pricing trends and AI-estimated values",
  },
];

export const TrustStrip = () => {
  return (
    <section className="relative overflow-hidden border-y border-border/40 bg-muted/30">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[20rem] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 lg:px-10 py-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-[10px] tracking-[0.28em] uppercase text-primary mb-3 font-medium">
            Built for trust
          </p>
          <h2 className="text-2xl md:text-3xl font-serif font-medium tracking-tight">
            Why collectors choose Xscentrium
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-4">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group text-center"
            >
              <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-card border border-border/60 flex items-center justify-center group-hover:border-primary/40 group-hover:shadow-glow transition-all duration-300">
                <p.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">{p.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[160px] mx-auto">
                {p.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
