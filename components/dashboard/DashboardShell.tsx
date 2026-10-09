"use client";

import { useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <div className="min-h-screen bg-white lg:flex">
      {sidebarVisible && <Sidebar />}
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-12">
        <div className="mb-3 flex justify-start">
          <button
            type="button"
            onClick={() => setSidebarVisible((visible) => !visible)}
            aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
            aria-expanded={sidebarVisible}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-700"
          >
            {sidebarVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
