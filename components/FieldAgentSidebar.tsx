"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Users, ChevronDown, ChevronLeft } from "lucide-react";
import type { SubMenuItem } from "../types/field-agent";

// Default menu untuk modul Field Agent (Squad A3)
// Squad A3 dapat mengosongkan atau menambah menu di sini sesuai kebutuhan
export const defaultFieldAgentMenus: SubMenuItem[] = [
  { name: "Dashboard", href: "/dashboard/field-agent" },
  { name: "My Tasks", href: "/dashboard/field-agent/tasks" },
  { name: "Field Reports", href: "/dashboard/field-agent/reports" },
  { name: "Need Backup", href: "/dashboard/need-backup" },
];

interface FieldAgentSidebarProps {
  onHide?: () => void;
  // Jika Squad A3 ingin mengosongkan submenu atau menyuplai menu kustom
  customMenus?: SubMenuItem[];
}

export function FieldAgentSidebar({ onHide, customMenus }: FieldAgentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [crmOpen, setCrmOpen] = useState(true);
  const [sectionOpen, setSectionOpen] = useState(true);

  // Menggunakan customMenus jika disuplai (bisa berupa [] jika ingin dikosongkan total)
  const menuItems = customMenus !== undefined ? customMenus : defaultFieldAgentMenus;

  const isCurrentDashboard = pathname === "/dashboard/field-agent";
  const isCrmActive = pathname.startsWith("/dashboard/field-agent") || pathname.startsWith("/dashboard/need-backup");

  return (
    <aside className="group relative flex h-screen h-dvh w-[260px] shrink-0 flex-col border-r border-[#1a3154] bg-[#102445]">
      {onHide && (
        <button
          type="button"
          onClick={onHide}
          aria-label="Hide sidebar"
          className="absolute right-2 top-1/2 z-50 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 opacity-0 shadow-md transition-all hover:scale-105 hover:text-blue-700 focus:opacity-100 group-hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Header Logo */}
      <div className="mx-4 flex h-[102px] items-center gap-4 border-b border-white/10">
        <Image
          src="/andima-logo.png"
          alt="PT Andima Transportindo"
          width={470}
          height={300}
          className="h-12 w-[54px] shrink-0 object-contain"
          priority
        />
        <div className="leading-tight text-white">
          <h1 className="text-[17px] font-extrabold tracking-wide">ANDIMA</h1>
          <p className="text-[13px] font-bold tracking-[0.04em]">TRANSPORTINDO</p>
          <p className="mt-1 text-[6px] tracking-[0.18em] text-slate-400">ENTERPRISE DIGITAL ECOSYSTEM</p>
        </div>
      </div>

      {/* Navigation Area */}
      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-3 pt-14 pb-4">
        <div className="pt-0.5">
          {/* Main Parent: CRM */}
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
              className={`h-4 w-4 text-slate-300 transition-transform duration-200 ${
                crmOpen ? "rotate-0" : "-rotate-90"
              }`}
            />
          </button>

          {/* CRM Submenu Section */}
          {crmOpen && (
            <div className="mt-1 ml-2">
              {/* Role Title Section: FIELD AGENT (Menggantikan Sales Executive) */}
              <div className="flex w-full items-center rounded-lg text-[13px] font-medium">
                <Link
                  href="/dashboard/field-agent"
                  prefetch
                  onClick={() => {
                    setCrmOpen(true);
                    setSectionOpen(true);
                  }}
                  className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                    isCurrentDashboard
                      ? "bg-[#b4c9d4] text-slate-700 font-bold"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="truncate">Field Agent</span>
                </Link>
                <button
                  type="button"
                  aria-label="Toggle section submenu"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSectionOpen((value) => !value);
                  }}
                  className="rounded p-1 hover:bg-white/10 text-slate-400"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      sectionOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>
              </div>

              {/* Submenu List Field Agent (Atau kosong jika customMenus=[]) */}
              {sectionOpen && menuItems.length > 0 && (
                <div className="mt-1 ml-3 space-y-0.5 border-l border-white/10 pl-2">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard/field-agent" && pathname.startsWith(`${item.href}/`));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center rounded-lg px-3 py-2 text-[12.5px] font-medium transition-all duration-150 ${
                          isActive
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25 font-semibold"
                            : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                        }`}
                      >
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Logout Area */}
      <div className="px-[17px] pb-5 pt-3">
        <button
          type="button"
          onClick={() => {
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
