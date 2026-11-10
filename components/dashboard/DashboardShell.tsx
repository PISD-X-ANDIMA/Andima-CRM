"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
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
          className="fixed left-0 top-1/2 z-40 grid h-11 w-7 -translate-y-1/2 place-items-center rounded-r-lg border border-l-0 border-slate-300 bg-white text-slate-600 shadow-md transition-colors hover:bg-blue-50 hover:text-blue-700"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-12">
        {children}
      </main>
    </div>
  );
}
