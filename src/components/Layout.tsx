import { createContext, useContext, type ReactNode } from "react";
import { Navigation } from "@/components/Navigation";

/**
 * Context flag — when true, child <Navigation /> instances skip rendering
 * so the global Layout nav is the only one shown. This lets us roll out the
 * shared layout without breaking existing pages that still import Navigation.
 */
const NavRenderedCtx = createContext(false);
export const useNavAlreadyRendered = () => useContext(NavRenderedCtx);

export function Layout({ children }: { children: ReactNode }) {
  return (
    <NavRenderedCtx.Provider value={true}>
      <Navigation />
      <main className="pt-16 min-h-screen">{children}</main>
    </NavRenderedCtx.Provider>
  );
}
