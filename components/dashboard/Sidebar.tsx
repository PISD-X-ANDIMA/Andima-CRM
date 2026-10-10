"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from '@/lib/supabaseClient';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  ChevronDown,
  Briefcase,
  Settings,
  LogOut,
} from "lucide-react";

interface SubMenuItem {
  name: string;
  href: string;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const salesExecutiveMenus: SubMenuItem[] = [
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
    name: "Monitoring Task of Field Agent",
    href: "/dashboard/task-of-field-agent",
  },
  {
    name: "Manage Field Agent Account",
    href: "/dashboard/manage-field-agent-account",
  },
];

const topMenuItems: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "CCR",
    href: "#",
    icon: ShoppingBag,
  },
];

const bottomMenuItems: MenuItem[] = [
  {
    name: "HRMS",
    href: "#",
    icon: Briefcase,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [crmOpen, setCrmOpen] = useState(true);
  const [salesExecOpen, setSalesExecOpen] = useState(true);

  const isSalesExecutiveDashboard =
    pathname === "/dashboard/sales-executive";

  const isSalesExecutiveActive =
    pathname.startsWith("/dashboard/sales-executive") ||
    pathname.startsWith("/dashboard/company-list") ||
    pathname.startsWith("/dashboard/meeting-schedule") ||
    pathname.startsWith("/dashboard/record-conversation") ||
    pathname.startsWith("/dashboard/task-of-field-agent") ||
    pathname.startsWith("/dashboard/manage-field-agent-account");
  const isCrmActive = isSalesExecutiveActive;

  return (
    <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-[#1a3154] bg-[#102445]">
      <div className="mx-4 flex h-[102px] items-center gap-4 border-b border-white/10">
        <Image src="/andima-logo.png" alt="PT Andima Transportindo" width={470} height={300} className="h-12 w-[54px] shrink-0 object-contain" priority />
        <div className="leading-tight text-white">
          <h1 className="text-[17px] font-extrabold tracking-wide">ANDIMA</h1>
          <p className="text-[13px] font-bold tracking-[0.04em]">TRANSPORTINDO</p>
          <p className="mt-1 text-[6px] tracking-[0.18em] text-slate-400">ENTERPRISE DIGITAL ECOSYSTEM</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pt-14 pb-4">
        {topMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href !== "#" && (
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
          );

          if (item.href === "#") {
            return (
              <button
                key={item.name}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
              >
                <Icon className="h-[18px] w-[18px] text-slate-500" />
                <span>{item.name}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] ${
                  isActive ? "text-white" : "text-slate-500"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setCrmOpen((value) => !value)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
              isCrmActive
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
            }`}
          >
            <span className="flex items-center gap-3">
              <Users
                className={`h-[18px] w-[18px] ${
                  isCrmActive ? "text-white" : "text-slate-500"
                }`}
              />
              <span>CRM</span>
            </span>

            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isCrmActive ? "text-white" : "text-slate-500"
              } ${crmOpen ? "rotate-0" : "-rotate-90"}`}
            />
          </button>

          {crmOpen && (
            <div className="mt-0.5 ml-2">
              <div className="flex w-full items-center rounded-lg text-[13px] font-medium">
              <Link
                href="/dashboard/sales-executive"
                prefetch
                onClick={() => {
                  setCrmOpen(true);
                  setSalesExecOpen(true);
                }}
                className={`flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                  isSalesExecutiveDashboard
                    ? "bg-[#b4c9d4] text-slate-700"
                    : isSalesExecutiveActive
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Sales Executive</span>

              </Link>
                <button
                  type="button"
                  aria-label="Toggle Sales Executive submenu"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSalesExecOpen((value) => !value);
                  }}
                  className="rounded p-0.5 hover:bg-white/10"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      salesExecOpen ? "rotate-0" : "-rotate-90"
                    } ${
                      isSalesExecutiveDashboard
                        ? "text-blue-300"
                        : "text-slate-500"
                    }`}
                  />
                </button>
              </div>

              {salesExecOpen && (
                <div className="mt-0.5 ml-3 space-y-0.5">
                  {salesExecutiveMenus.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                          isActive
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                            : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                        }`}
                      >
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="mt-0.5 flex w-full items-center rounded-lg px-3 py-2 text-[13px] font-medium text-slate-400">
                <span>Field Agent</span>
              </div>

            </div>
          )}
        </div>

        <div className="space-y-0.5 pt-0.5">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-[18px] w-[18px] text-slate-500" />
                  <span>{item.name}</span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="px-3 pb-4 space-y-0.5">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
        >
          <Settings className="h-[18px] w-[18px] text-slate-500" />
          <span>Settings</span>
        </button>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            try {
              localStorage.removeItem('andima_user');
              sessionStorage.removeItem('andima_logged_in');
              sessionStorage.clear();
            } catch {}
            router.push('/login');
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-[18px] w-[18px] text-red-400" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
