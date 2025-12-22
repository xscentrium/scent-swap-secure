import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles, Settings, MessageCircle, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";

const navLinks = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/compare", label: "Compare" },
  { to: "/discover", label: "Discover" },
  { to: "/discover/users", label: "Find Users" },
  { to: "/trade-matches", label: "Trade Matches" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/year-in-review", label: "Year in Review" },
  { to: "/influencers", label: "Influencers" },
];

export const Navigation = () => {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-serif font-bold">ScentSwap</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link to="/my-trades" className="text-sm font-medium hover:text-primary transition-colors">
                My Trades
              </Link>
            )}
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
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

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            {user && profile && <NotificationBell />}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <div className="flex flex-col gap-6 mt-6">
                  {/* Nav Links */}
                  <div className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={closeMenu}
                        className="text-lg font-medium hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                    {user && (
                      <Link
                        to="/my-trades"
                        onClick={closeMenu}
                        className="text-lg font-medium hover:text-primary transition-colors"
                      >
                        My Trades
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-border pt-4">
                    {user && profile ? (
                      <div className="flex flex-col gap-3">
                        <Link
                          to={`/profile/${profile.username}`}
                          onClick={closeMenu}
                          className="text-lg font-medium hover:text-primary transition-colors"
                        >
                          Profile
                        </Link>
                        <Link
                          to="/messages"
                          onClick={closeMenu}
                          className="text-lg font-medium hover:text-primary transition-colors"
                        >
                          Messages
                        </Link>
                        <Link
                          to="/settings"
                          onClick={closeMenu}
                          className="text-lg font-medium hover:text-primary transition-colors"
                        >
                          Settings
                        </Link>
                        <Button
                          variant="outline"
                          onClick={() => {
                            signOut();
                            closeMenu();
                          }}
                          className="mt-2"
                        >
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <Button variant="ghost" asChild onClick={closeMenu}>
                          <Link to="/auth">Sign In</Link>
                        </Button>
                        <Button asChild onClick={closeMenu}>
                          <Link to="/auth">Get Started</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
