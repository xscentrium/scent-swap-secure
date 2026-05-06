import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, Settings, MessageCircle, Menu, Moon, Sun, ChevronDown, User, LogOut, Wallet, Rocket } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { NavigationSearch } from "@/components/NavigationSearch";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const primaryLinks = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/discover", label: "Discover" },
  { to: "/trade-matches", label: "Trades" },
];

const moreLinks = [
  { to: "/compare", label: "Compare" },
  { to: "/discover/users", label: "Find Users" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/year-in-review", label: "Year in Review" },
  { to: "/influencers", label: "Influencers" },
];

const authedExtraLinks = [
  { to: "/onboarding", label: "Onboarding", icon: Rocket },
  { to: "/payouts", label: "Payouts", icon: Wallet },
];

export const Navigation = () => {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const closeMenu = () => setOpen(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-serif font-bold hidden sm:block">Xscentrium</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {primaryLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive(link.to)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.label}
              </Link>
            ))}
            
            {user && (
              <Link
                to="/my-trades"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive("/my-trades")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                My Trades
              </Link>
            )}

            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 flex items-center gap-1">
                  More
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 bg-popover border border-border shadow-lg">
                {moreLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link
                      to={link.to}
                      className={cn(
                        "w-full cursor-pointer",
                        isActive(link.to) && "text-primary"
                      )}
                    >
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <NavigationSearch />
            
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            {user && profile ? (
              <>
                <NotificationBell />
                <Button variant="ghost" size="icon" asChild className="rounded-lg">
                  <Link to="/messages">
                    <MessageCircle className="w-[18px] h-[18px]" />
                  </Link>
                </Button>
                
                <div className="w-px h-6 bg-border mx-1" />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-3 rounded-lg">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium hidden xl:block">{profile.display_name || profile.username}</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium">{profile.display_name || profile.username}</p>
                      <p className="text-xs text-muted-foreground">@{profile.username}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to={`/profile/${profile.username}`} className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/onboarding" className="cursor-pointer">
                        <Rocket className="w-4 h-4 mr-2" />
                        Onboarding
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/payouts" className="cursor-pointer">
                        <Wallet className="w-4 h-4 mr-2" />
                        Payouts
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="rounded-lg">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size="sm" variant="default" asChild className="rounded-lg">
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex lg:hidden items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            {user && profile && <NotificationBell />}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] bg-background">
                <div className="flex flex-col h-full">
                  {/* Logo in sheet */}
                  <div className="flex items-center gap-2.5 pb-6 border-b border-border">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-serif font-bold">Xscentrium</span>
                  </div>
                  
                  {/* Nav Links */}
                  <div className="flex-1 py-6 space-y-1 overflow-y-auto">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">Navigation</p>
                    {[...primaryLinks, ...moreLinks].map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={closeMenu}
                        className={cn(
                          "flex items-center px-3 py-2.5 rounded-lg text-base font-medium transition-colors",
                          isActive(link.to)
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                    {user && (
                      <>
                        <Link
                          to="/my-trades"
                          onClick={closeMenu}
                          className={cn(
                            "flex items-center px-3 py-2.5 rounded-lg text-base font-medium transition-colors",
                            isActive("/my-trades")
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          My Trades
                        </Link>
                        {authedExtraLinks.map((link) => {
                          const Icon = link.icon;
                          return (
                            <Link
                              key={link.to}
                              to={link.to}
                              onClick={closeMenu}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium transition-colors",
                                isActive(link.to)
                                  ? "bg-primary/10 text-primary"
                                  : "text-foreground hover:bg-muted"
                              )}
                            >
                              <Icon className="w-4 h-4" />
                              {link.label}
                            </Link>
                          );
                        })}
                      </>
                    )}
                  </div>

                  {/* User section */}
                  <div className="border-t border-border pt-4 space-y-3">
                    {user && profile ? (
                      <>
                        <div className="flex items-center gap-3 px-3 py-2">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{profile.display_name || profile.username}</p>
                            <p className="text-xs text-muted-foreground">@{profile.username}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" asChild onClick={closeMenu}>
                            <Link to={`/profile/${profile.username}`}>
                              <User className="w-4 h-4 mr-1.5" />
                              Profile
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild onClick={closeMenu}>
                            <Link to="/messages">
                              <MessageCircle className="w-4 h-4 mr-1.5" />
                              Messages
                            </Link>
                          </Button>
                        </div>
                        <Button variant="outline" size="sm" className="w-full" asChild onClick={closeMenu}>
                          <Link to="/settings">
                            <Settings className="w-4 h-4 mr-1.5" />
                            Settings
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            signOut();
                            closeMenu();
                          }}
                        >
                          <LogOut className="w-4 h-4 mr-1.5" />
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full" asChild onClick={closeMenu}>
                          <Link to="/auth">Sign In</Link>
                        </Button>
                        <Button className="w-full" asChild onClick={closeMenu}>
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
