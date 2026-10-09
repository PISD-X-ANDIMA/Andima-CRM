import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { ReactNode } from "react";
import { Suspense } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#090f1d] text-slate-900 dark:text-slate-100 lg:flex transition-colors duration-200">
      <Suspense fallback={<aside className="hidden lg:block w-[240px] bg-[#0b1a34] h-screen" />}>
        <Sidebar />
      </Suspense>
      <main className="min-w-0 flex-1 px-3.5 py-4 sm:px-6 lg:px-12 bg-white dark:bg-[#090f1d] transition-colors duration-200">
        <Suspense fallback={<div className="h-12 border-b border-slate-100 dark:border-slate-800 mb-6" />}>
          <DashboardHeader />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
