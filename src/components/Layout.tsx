import { createContext, useContext, type ReactNode } from "react";
import { Navigation } from "@/components/Navigation";

/**
 * Context flag — when true, child <Navigation /> instances skip rendering
 * so the global Layout nav is the only one shown. Pages that still import
 * Navigation themselves become a no-op under the shared layout.
 */
const NavRenderedCtx = createContext(false);
export const useNavAlreadyRendered = () => useContext(NavRenderedCtx);

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Render the shared nav OUTSIDE the provider so it actually mounts. */}
      <Navigation />
      <NavRenderedCtx.Provider value={true}>
        <main className="min-h-screen pt-16">{children}</main>
      </NavRenderedCtx.Provider>
    </>
  );
}
