import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, PackagePlus, Search, ArrowRightLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "Create Listing",
    icon: PackagePlus,
    to: "/create-listing",
    color: "bg-primary",
  },
  {
    label: "Find Trades",
    icon: ArrowRightLeft,
    to: "/trade-matches",
    color: "bg-accent",
  },
  {
    label: "Discover",
    icon: Search,
    to: "/discover",
    color: "bg-secondary",
  },
  {
    label: "Take Quiz",
    icon: Sparkles,
    to: "/scent-quiz",
    color: "bg-primary/80",
  },
];

export const FloatingActionButton = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Only show for authenticated users
  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <>
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.3, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.3, y: 20 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  delay: index * 0.05,
                }}
              >
                <Link
                  to={action.to}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 group"
                >
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                    className="px-3 py-1.5 rounded-lg bg-card border border-border shadow-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {action.label}
                  </motion.span>
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110",
                      action.color,
                      "text-primary-foreground"
                    )}
                  >
                    <action.icon className="w-5 h-5" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-luxury transition-all duration-300",
          "bg-gradient-to-r from-primary to-accent text-primary-foreground",
          "hover:shadow-xl hover:scale-105 active:scale-95",
          isOpen && "rotate-45"
        )}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
