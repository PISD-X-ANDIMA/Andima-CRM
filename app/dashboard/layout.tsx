import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { ReactNode } from "react";
import { Suspense } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white lg:flex">
      <Suspense fallback={<aside className="w-[260px] bg-[#102445] h-screen" />}>
        <Sidebar />
      </Suspense>
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-12">
        <Suspense fallback={<div className="h-12 border-b border-slate-100 mb-6" />}>
          <DashboardHeader />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
