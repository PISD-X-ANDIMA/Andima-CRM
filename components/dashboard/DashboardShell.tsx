"use client";

import { useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <div className="min-h-screen bg-white lg:flex">
      <div
        id="crm-sidebar"
        aria-hidden={!sidebarVisible}
        inert={!sidebarVisible}
        className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${sidebarVisible ? "w-[260px]" : "w-0"}`}
      >
        <div className={`w-[260px] transition-transform duration-300 ease-in-out ${sidebarVisible ? "translate-x-0" : "-translate-x-full"}`}>
          <Sidebar />
        </div>
      </div>
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-12">
        <div className="mb-3 flex justify-start">
          <button
            type="button"
            onClick={() => setSidebarVisible((visible) => !visible)}
            aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
            aria-controls="crm-sidebar"
            aria-expanded={sidebarVisible}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-blue-700"
          >
            {sidebarVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            <span>{sidebarVisible ? "Hide sidebar" : "Show sidebar"}</span>
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
