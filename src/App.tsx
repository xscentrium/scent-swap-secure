import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AccountSetupDialog } from "@/components/AccountSetupDialog";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import MarketplacePage from "./pages/MarketplacePage";
import Profile from "./pages/Profile";
import CreateListing from "./pages/CreateListing";
import InfluencerHub from "./pages/InfluencerHub";
import Trade from "./pages/Trade";
import Messages from "./pages/Messages";
import MyTrades from "./pages/MyTrades";
import Settings from "./pages/Settings";
import AdminVerification from "./pages/AdminVerification";
import TradeMatches from "./pages/TradeMatches";
import SharedCollection from "./pages/SharedCollection";
import SharedWishlist from "./pages/SharedWishlist";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AccountSetupDialog />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/collection/:username" element={<SharedCollection />} />
            <Route path="/wishlist/:username" element={<SharedWishlist />} />
            <Route path="/create-listing" element={<CreateListing />} />
            <Route path="/influencers" element={<InfluencerHub />} />
            <Route path="/trade/:listingId" element={<Trade />} />
            <Route path="/my-trades" element={<MyTrades />} />
            <Route path="/trade-matches" element={<TradeMatches />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin/verification" element={<AdminVerification />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
