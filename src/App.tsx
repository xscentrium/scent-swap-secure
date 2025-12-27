import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AccountSetupDialog } from "@/components/AccountSetupDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/PageTransition";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import MarketplacePage from "./pages/MarketplacePage";
import Profile from "./pages/Profile";
import CreateListing from "./pages/CreateListing";
import InfluencerHub from "./pages/InfluencerHub";
import Trade from "./pages/Trade";
import Messages from "./pages/Messages";
import DirectMessages from "./pages/DirectMessages";
import MyTrades from "./pages/MyTrades";
import Settings from "./pages/Settings";
import AdminVerification from "./pages/AdminVerification";
import TradeMatches from "./pages/TradeMatches";
import SharedCollection from "./pages/SharedCollection";
import SharedWishlist from "./pages/SharedWishlist";
import FragranceComparison from "./pages/FragranceComparison";
import Discover from "./pages/Discover";
import DiscoverUsers from "./pages/DiscoverUsers";
import ScentQuiz from "./pages/ScentQuiz";
import Leaderboard from "./pages/Leaderboard";
import YearInReviewPage from "./pages/YearInReviewPage";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/marketplace" element={<PageTransition><MarketplacePage /></PageTransition>} />
        <Route path="/profile/:username" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/collection/:username" element={<PageTransition><SharedCollection /></PageTransition>} />
        <Route path="/wishlist/:username" element={<PageTransition><SharedWishlist /></PageTransition>} />
        <Route path="/compare" element={<PageTransition><FragranceComparison /></PageTransition>} />
        <Route path="/discover" element={<PageTransition><Discover /></PageTransition>} />
        <Route path="/discover/users" element={<PageTransition><DiscoverUsers /></PageTransition>} />
        <Route path="/scent-quiz" element={<PageTransition><ScentQuiz /></PageTransition>} />
        <Route path="/create-listing" element={<PageTransition><CreateListing /></PageTransition>} />
        <Route path="/influencers" element={<PageTransition><InfluencerHub /></PageTransition>} />
        <Route path="/trade/:listingId" element={<PageTransition><Trade /></PageTransition>} />
        <Route path="/my-trades" element={<PageTransition><MyTrades /></PageTransition>} />
        <Route path="/trade-matches" element={<PageTransition><TradeMatches /></PageTransition>} />
        <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
        <Route path="/year-in-review" element={<PageTransition><YearInReviewPage /></PageTransition>} />
        <Route path="/messages" element={<PageTransition><Messages /></PageTransition>} />
        <Route path="/messages/new/:recipientId" element={<PageTransition><DirectMessages /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
        <Route path="/admin/verification" element={<PageTransition><AdminVerification /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AccountSetupDialog />
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
