"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <div className="min-h-screen bg-white lg:flex lg:items-start">
      <div
        id="crm-sidebar"
        aria-hidden={!sidebarVisible}
        inert={!sidebarVisible}
        className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out lg:sticky lg:top-0 lg:h-dvh ${sidebarVisible ? "w-[260px]" : "w-0"}`}
      >
        <div className={`h-full w-[260px] transition-transform duration-300 ease-in-out ${sidebarVisible ? "translate-x-0" : "-translate-x-full"}`}>
          <Sidebar onHide={() => setSidebarVisible(false)} />
        </div>
      </div>
      {!sidebarVisible && (
        <button
          type="button"
          onClick={() => setSidebarVisible(true)}
          aria-label="Show sidebar"
          aria-controls="crm-sidebar"
          aria-expanded={false}
          className="fixed left-4 top-5 z-40 grid h-8 w-8 place-items-center rounded-md bg-[#1476f2] text-white shadow-md transition-colors hover:bg-[#0f6ae0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1476f2]/40"
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </button>
      )}
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-12">
        {children}
      </main>
    </div>
  );
}
