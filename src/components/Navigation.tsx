import { Button } from "@/components/ui/button";
import { Sparkles, Settings, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";

export const Navigation = () => {
  const { user, profile, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-serif font-bold">ScentSwap</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="/marketplace" className="text-sm font-medium hover:text-primary transition-colors">
              Marketplace
            </Link>
            <Link to="/influencers" className="text-sm font-medium hover:text-primary transition-colors">
              Influencers
            </Link>
            {user && (
              <Link to="/my-trades" className="text-sm font-medium hover:text-primary transition-colors">
                My Trades
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {user && profile ? (
              <>
                <NotificationBell />
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/messages">
                    <MessageCircle className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/settings">
                    <Settings className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/profile/${profile.username}`}>Profile</Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size="sm" variant="default" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
