import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -12,
  },
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.4, 0, 0.2, 1] as const,
  duration: 0.25,
};

const PageSkeleton = () => (
  <div className="min-h-screen pt-20 px-4">
    <div className="container mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="h-10 w-64 rounded-lg skeleton-shimmer" />
        <div className="h-4 w-96 rounded skeleton-shimmer" />
      </div>
      
      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden">
            <div className="h-48 skeleton-shimmer" />
            <div className="p-4 bg-card space-y-3">
              <div className="h-5 w-3/4 rounded skeleton-shimmer" />
              <div className="h-4 w-1/2 rounded skeleton-shimmer" />
              <div className="h-4 w-full rounded skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <PageSkeleton />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
