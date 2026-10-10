"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AuthGuard } from "@/components/dashboard/AuthGuard";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white lg:flex">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <main className="min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-8 lg:px-12">
          <DashboardHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
