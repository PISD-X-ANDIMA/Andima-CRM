"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";

type SidebarToggle = { sidebarVisible: boolean; toggleSidebar: () => void };

const SidebarToggleContext = createContext<SidebarToggle>({
  sidebarVisible: true,
  toggleSidebar: () => {},
});

export function useSidebarToggle() {
  return useContext(SidebarToggleContext);
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close mobile drawer on route changes automatically
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setDesktopSidebarVisible((prev) => !prev);
    }
  };

  return (
    <SidebarToggleContext.Provider
      value={{
        sidebarVisible: desktopSidebarVisible,
        toggleSidebar,
      }}
    >
      <div className="min-h-screen bg-slate-50/50 lg:flex lg:items-start">
        {/* ======================================================== */}
        {/* 1. DESKTOP SIDEBAR (Large screens >= 1024px)              */}
        {/* ======================================================== */}
        <aside
          id="crm-sidebar"
          aria-hidden={!desktopSidebarVisible}
          inert={!desktopSidebarVisible}
          className={`hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out lg:sticky lg:top-0 lg:block lg:h-dvh ${
            desktopSidebarVisible ? "w-[260px]" : "w-0"
          }`}
        >
          <div
            className={`h-full w-[260px] transition-transform duration-300 ease-in-out ${
              desktopSidebarVisible ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar onHide={() => setDesktopSidebarVisible(false)} />
          </div>
        </aside>

        {/* ======================================================== */}
        {/* 2. MOBILE SLIDE-OUT DRAWER & BACKDROP (< 1024px)          */}
        {/* ======================================================== */}
        {mobileDrawerOpen && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Close navigation drawer"
            onClick={() => setMobileDrawerOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setMobileDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden"
          />
        )}

        <div
          id="mobile-crm-drawer"
          aria-hidden={!mobileDrawerOpen}
          inert={!mobileDrawerOpen}
          className={`fixed inset-y-0 left-0 z-50 w-[275px] max-w-[85vw] transform bg-[#0F2342] shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
            mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onHide={() => setMobileDrawerOpen(false)} />
        </div>

        {/* ======================================================== */}
        {/* 3. MAIN CONTENT AREA                                      */}
        {/* ======================================================== */}
        <main className="min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 pb-12 lg:pb-8">
          {children}
        </main>
      </div>
    </SidebarToggleContext.Provider>
  );
}
