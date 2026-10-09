"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { supabase } from '@/lib/supabaseClient';
import {
  LayoutDashboard,
  Headphones,
  Users,
  ChevronDown,
  ChevronRight,
  Briefcase,
  LogOut,
} from "lucide-react";

interface SubMenuItem {
  name: string;
  href: string;
}

const crmSubMenus: SubMenuItem[] = [
  {
    name: "Sales Eksekutif",
    href: "/dashboard/sales-executive",
  },
  {
    name: "Company List",
    href: "/dashboard/company-list",
  },
  {
    name: "Meeting Schedule",
    href: "/dashboard/meeting-schedule",
  },
  {
    name: "Record Conversation",
    href: "/dashboard/record-conversation",
  },
  {
    name: "Task Field Agent",
    href: "/dashboard/task-of-field-agent",
  },
  {
    name: "Need Backup",
    href: "/dashboard/need-backup",
  },
];

const fieldAgentMenus: SubMenuItem[] = [
  {
    name: "Overview",
    href: "/dashboard/field-agent?tab=field-agent",
  },
  {
    name: "My Task",
    href: "/dashboard/field-agent?tab=tasks",
  },
  {
    name: "Job History",
    href: "/dashboard/field-agent?tab=history",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [crmOpen, setCrmOpen] = useState(true);
  const [fieldAgentOpen, setFieldAgentOpen] = useState(true);

  const isFieldAgentActive = pathname.startsWith("/dashboard/field-agent");
  const currentFieldTab = searchParams?.get("tab") || "field-agent";

  const isCrmRouteActive =
    pathname.startsWith("/dashboard/sales-executive") ||
    pathname.startsWith("/dashboard/company-list") ||
    pathname.startsWith("/dashboard/meeting-schedule") ||
    pathname.startsWith("/dashboard/record-conversation") ||
    pathname.startsWith("/dashboard/task-of-field-agent") ||
    pathname.startsWith("/dashboard/need-backup");

  return (
    <aside className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col bg-[#07111e] text-slate-300 select-none">
      {/* Brand Header */}
      <div className="flex h-20 items-center gap-3 px-5 border-b border-white/[0.06]">
        <Image
          src="/andima-logo.png"
          alt="PT Andima Transportindo"
          width={40}
          height={40}
          className="h-9 w-9 shrink-0 object-contain"
          priority
        />
        <div className="leading-tight">
          <h1 className="text-[14px] font-extrabold tracking-wider text-white">ANDIMA</h1>
          <p className="text-[10px] font-bold tracking-wide text-slate-200">TRANSPORTINDO</p>
          <p className="mt-0.5 text-[5px] tracking-[0.2em] text-blue-400">ENTERPRISE DIGITAL ECOSYSTEM</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-6 pb-4">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
            pathname === "/dashboard"
              ? "bg-blue-600 text-white font-semibold shadow-xs"
              : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>

        {/* CCR */}
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
        >
          <Headphones className="h-4 w-4 text-slate-400" />
          <span>CCR</span>
        </button>

        {/* CRM Accordion Menu */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setCrmOpen((prev) => !prev)}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors ${
              isCrmRouteActive
                ? "bg-[#1d4ed8] text-white shadow-sm"
                : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <span className="flex items-center gap-3">
              <Users className="h-4 w-4" />
              <span>CRM</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                crmOpen ? "rotate-0" : "-rotate-90"
              }`}
            />
          </button>

          {/* Submenu List */}
          {crmOpen && (
            <div className="mt-1 ml-2 space-y-1 border-l border-white/[0.08] pl-2">
              {crmSubMenus.map((sub) => {
                const isActive =
                  pathname === sub.href || pathname.startsWith(`${sub.href}/`);

                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                      isActive
                        ? "bg-[#e2edf8] text-[#1e3a8a] font-bold shadow-2xs"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="h-1 w-1 rounded-full bg-current opacity-70" />
                    <span>{sub.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Field Agent (Expandable Submenu from feature/A3-field-agent) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setFieldAgentOpen((prev) => !prev)}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors ${
              isFieldAgentActive
                ? "bg-[#1d4ed8] text-white shadow-sm"
                : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <span className="flex items-center gap-3">
              <Users className="h-4 w-4" />
              <span>Field Agent</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                fieldAgentOpen ? "rotate-0" : "-rotate-90"
              }`}
            />
          </button>

          {fieldAgentOpen && (
            <div className="mt-1 ml-2 space-y-1 border-l border-white/[0.08] pl-2">
              {fieldAgentMenus.map((item) => {
                const itemTab = item.href.includes("tab=")
                  ? item.href.split("tab=")[1]
                  : "field-agent";
                const isActive =
                  isFieldAgentActive && currentFieldTab === itemTab;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                      isActive
                        ? "bg-[#e2edf8] text-[#1e3a8a] font-bold shadow-2xs"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="h-1 w-1 rounded-full bg-current opacity-70" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* HRMS */}
        <div className="pt-1">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
          >
            <Briefcase className="h-4 w-4 text-slate-400" />
            <span>HRMS</span>
          </button>
        </div>
      </nav>

      {/* Bottom User / Logout Bar */}
      <div className="p-3.5 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            try { localStorage.removeItem("andima_user"); } catch {}
            router.push("/login");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 py-2.5 px-4 text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 transition-all cursor-pointer shadow-2xs"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
