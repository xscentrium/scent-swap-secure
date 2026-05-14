import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { AccountSetupDialog } from "@/components/AccountSetupDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/PageTransition";
import { Layout } from "@/components/Layout";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { ThemeProvider } from "next-themes";
import { AnimatePresence } from "framer-motion";
import { CookieConsent } from "@/components/CookieConsent";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
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
import AdminDisputes from "./pages/AdminDisputes";
import TradeMatches from "./pages/TradeMatches";
import SharedCollection from "./pages/SharedCollection";
import SharedWishlist from "./pages/SharedWishlist";
import FragranceComparison from "./pages/FragranceComparison";
import Discover from "./pages/Discover";
import DiscoverUsers from "./pages/DiscoverUsers";
import ScentQuiz from "./pages/ScentQuiz";
import Leaderboard from "./pages/Leaderboard";
import YearInReviewPage from "./pages/YearInReviewPage";
import SearchAnalytics from "./pages/SearchAnalytics";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import Onboarding from "./pages/Onboarding";
import SellerPayouts from "./pages/SellerPayouts";
import AdminAudit from "./pages/AdminAudit";
import AdminListingsAudit from "./pages/AdminListingsAudit";
import AdminImageQueue from "./pages/AdminImageQueue";
import News from "./pages/News";
import Forum from "./pages/Forum";
import ForumNewThread from "./pages/ForumNewThread";
import ForumThread from "./pages/ForumThread";
import FragranceDetail from "./pages/FragranceDetail";
import FragranceBrowse from "./pages/FragranceBrowse";
import Performance from "./pages/Performance";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  // Send a GA4 page_view on every SPA route change
  useEffect(() => {
    const gtag = (window as any).gtag;
    if (typeof gtag === "function") {
      gtag("event", "page_view", {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [location.pathname, location.search]);

  return (
    <Layout>
      <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/marketplace" element={<PageTransition><MarketplacePage /></PageTransition>} />
        <Route path="/profile/:username" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/collection/:username" element={<PageTransition><SharedCollection /></PageTransition>} />
        <Route path="/wishlist/:username" element={<PageTransition><SharedWishlist /></PageTransition>} />
        <Route path="/compare" element={<PageTransition><FragranceComparison /></PageTransition>} />
        <Route path="/discover" element={<PageTransition><Discover /></PageTransition>} />
        <Route path="/discover/users" element={<PageTransition><DiscoverUsers /></PageTransition>} />
        <Route path="/scent-quiz" element={<PageTransition><ScentQuiz /></PageTransition>} />
        <Route path="/performance" element={<PageTransition><Performance /></PageTransition>} />
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
        <Route path="/admin/disputes" element={<PageTransition><AdminDisputes /></PageTransition>} />
        <Route path="/admin/audit" element={<PageTransition><AdminAudit /></PageTransition>} />
        <Route path="/admin/audit/:tradeId" element={<PageTransition><AdminAudit /></PageTransition>} />
        <Route path="/admin/listings-audit" element={<PageTransition><AdminListingsAudit /></PageTransition>} />
        <Route path="/admin/image-queue" element={<PageTransition><AdminImageQueue /></PageTransition>} />
        <Route path="/admin/search-analytics" element={<PageTransition><SearchAnalytics /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
        <Route path="/payouts" element={<PageTransition><SellerPayouts /></PageTransition>} />
        <Route path="/news" element={<PageTransition><News /></PageTransition>} />
        <Route path="/forum" element={<PageTransition><Forum /></PageTransition>} />
        <Route path="/forum/new" element={<PageTransition><ForumNewThread /></PageTransition>} />
        <Route path="/forum/thread/:id" element={<PageTransition><ForumThread /></PageTransition>} />
        <Route path="/fragrance/:id" element={<PageTransition><FragranceDetail /></PageTransition>} />
        <Route path="/browse" element={<PageTransition><FragranceBrowse /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
      </AnimatePresence>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ErrorBoundary>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AccountSetupDialog />
              <AnimatedRoutes />
              <FloatingActionButton />
              <CookieConsent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
