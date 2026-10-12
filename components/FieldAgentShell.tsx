"use client";

import { ReactNode } from "react";
import { FieldAgentSidebar } from "./FieldAgentSidebar";
import { FieldAgentHeader } from "./FieldAgentHeader";
import type { SubMenuItem } from "../types/field-agent";

interface FieldAgentShellProps {
  children: ReactNode;
  headerTitle?: string;
  customMenus?: SubMenuItem[];
}

export function FieldAgentShell({ children, headerTitle, customMenus }: FieldAgentShellProps) {
  return (
    <div className="flex h-screen h-dvh w-full overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar khusus Field Agent A3 */}
      <FieldAgentSidebar customMenus={customMenus} />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <FieldAgentHeader title={headerTitle} />
        <main className="flex-1 p-6 sm:p-8 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
