import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { ReactNode } from "react";
import { Suspense } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#090f1d] text-slate-900 dark:text-slate-100 lg:flex transition-colors duration-200">
      <Suspense fallback={<aside className="w-[260px] bg-[#102445] h-screen" />}>
        <Sidebar />
      </Suspense>
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-12 bg-white dark:bg-[#090f1d] transition-colors duration-200">
        <Suspense fallback={<div className="h-12 border-b border-slate-100 dark:border-slate-800 mb-6" />}>
          <DashboardHeader />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
