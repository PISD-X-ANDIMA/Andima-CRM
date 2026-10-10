import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AuthGuard } from "@/components/dashboard/AuthGuard";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-white lg:flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-6 py-8 lg:px-12">
          <DashboardHeader />
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
