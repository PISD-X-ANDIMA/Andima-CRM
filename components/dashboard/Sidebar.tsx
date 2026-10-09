"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  ChevronDown,
  ChevronLeft,
} from "lucide-react";

interface SubMenuItem {
  name: string;
  href: string;
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
    name: "Task of Field Agent",
    href: "/dashboard/task-of-field-agent",
  },
  {
    name: "Need Backup",
    href: "/dashboard/need-backup",
  },
];

export function Sidebar({ onHide }: { onHide: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const [crmOpen, setCrmOpen] = useState(true);
  const [salesExecOpen, setSalesExecOpen] = useState(true);
  const [submenuItems, setSubmenuItems] = useState(salesExecutiveMenus);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/navigation/sidebar", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (!active || !result?.success || !Array.isArray(result.data?.menu)) return;
        const crm = result.data.menu.find((item: { label?: string }) => item.label === "CRM");
        const salesExecutive = crm?.children?.find((item: { label?: string }) => item.label === "Sales Executive");
        if (!Array.isArray(salesExecutive?.children)) return;
        const items = salesExecutive.children
          .filter((item: { label?: string; href?: string | null }) => item.href && item.label)
          .map((item: { label: string; href: string }) => ({ name: item.label, href: item.href }));
        if (items.length) setSubmenuItems(items);
      })
      .catch(() => { /* Keep the local menu when the navigation API is unavailable. */ });
    return () => { active = false; };
  }, []);

  const isSalesExecutiveDashboard =
    pathname === "/dashboard/sales-executive";

  const isSalesExecutiveActive =
    pathname.startsWith("/dashboard/sales-executive") ||
    pathname.startsWith("/dashboard/company-list") ||
    pathname.startsWith("/dashboard/meeting-schedule") ||
    pathname.startsWith("/dashboard/record-conversation") ||
    pathname.startsWith("/dashboard/need-backup");
  const isCrmActive = isSalesExecutiveActive;

  return (
    <aside className="group relative flex h-screen h-dvh w-[260px] shrink-0 flex-col border-r border-[#1a3154] bg-[#102445]">
      <button
        type="button"
        onClick={onHide}
        aria-label="Hide sidebar"
        className="absolute right-2 top-1/2 z-50 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 opacity-0 shadow-md transition-all hover:scale-105 hover:text-blue-700 focus:opacity-100 group-hover:opacity-100"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="mx-4 flex h-[102px] items-center gap-4 border-b border-white/10">
        <Image src="/andima-logo.png" alt="PT Andima Transportindo" width={470} height={300} className="h-12 w-[54px] shrink-0 object-contain" priority />
        <div className="leading-tight text-white">
          <h1 className="text-[17px] font-extrabold tracking-wide">ANDIMA</h1>
          <p className="text-[13px] font-bold tracking-[0.04em]">TRANSPORTINDO</p>
          <p className="mt-1 text-[6px] tracking-[0.18em] text-slate-400">ENTERPRISE DIGITAL ECOSYSTEM</p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-3 pt-14 pb-4">
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
                  isCrmActive ? "text-blue-400" : "text-slate-500"
                }`}
              />
            <span>CRM</span>
            </span>

            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                crmOpen ? "rotate-0" : "-rotate-90"
              }`}
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
                  {submenuItems.map((item) => {
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

      </nav>

      <div className="px-[17px] pb-5 pt-3">
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
            try { localStorage.removeItem('andima_user'); } catch {}
            router.push('/login');
          }}
          className="flex h-10 w-full items-center justify-center rounded-full border-2 border-[#f32650] bg-transparent px-4 text-base font-bold text-[#f32650] transition-colors hover:bg-[#f32650] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f32650] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102445]"
        >
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
