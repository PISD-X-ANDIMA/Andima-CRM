"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
  // Mobile: drawer tertutup. Desktop: sidebar tampil.
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    setSidebarVisible(desktop.matches);
    const onChange = (event: MediaQueryListEvent) => setSidebarVisible(event.matches);
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="min-h-screen bg-white lg:flex lg:items-start">
      {sidebarVisible && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarVisible(false)}
          className="fixed inset-0 z-40 cursor-default bg-slate-950/50 lg:hidden"
        />
      )}
      <div
        id="crm-sidebar"
        aria-hidden={!sidebarVisible}
        inert={!sidebarVisible}
        className={`fixed inset-y-0 left-0 z-50 shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out lg:sticky lg:top-0 lg:z-auto lg:h-dvh ${
          sidebarVisible ? "w-[260px]" : "w-0"
        }`}
      >
        <div
          className={`h-full w-[260px] transition-transform duration-300 ease-in-out ${
            sidebarVisible ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar />
        </div>
      </div>
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-12">
        <SidebarToggleContext.Provider
          value={{ sidebarVisible, toggleSidebar: () => setSidebarVisible((value) => !value) }}
        >
          {children}
        </SidebarToggleContext.Provider>
      </main>
    </div>
  );
}
