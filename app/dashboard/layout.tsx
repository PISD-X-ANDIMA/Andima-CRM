import { Sidebar } from "@/components/dashboard/Sidebar";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-12">{children}</main>
    </div>
  );
}
