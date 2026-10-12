import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { ReactNode } from "react";
import { Suspense } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen max-h-screen w-full overflow-hidden bg-white dark:bg-[#090f1d] text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      <Suspense fallback={<aside className="hidden lg:block w-[240px] bg-[#0b1a34] h-screen shrink-0" />}>
        <Sidebar />
      </Suspense>
      <div className="flex-1 min-w-0 h-screen max-h-screen flex flex-col overflow-hidden bg-white dark:bg-[#090f1d] transition-colors duration-200">
        <header className="shrink-0 px-3.5 pt-3 sm:px-6 lg:px-8 bg-white dark:bg-[#090f1d] z-20">
          <Suspense fallback={<div className="h-12 border-b border-slate-100 dark:border-slate-800 mb-2" />}>
            <DashboardHeader />
          </Suspense>
        </header>
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col px-3.5 pb-3 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
