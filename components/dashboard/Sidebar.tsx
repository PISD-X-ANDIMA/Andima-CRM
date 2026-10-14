"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Users,
  X,
} from "lucide-react";

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface SubMenuItem {
  name: string;
  href: string;
}

const crmMenus: SubMenuItem[] = [
  {
    name: "Sales Executif",
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
    name: "Manage Account",
    href: "/dashboard/manage-field-agent-account",
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [crmOpen, setCrmOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    try {
      localStorage.removeItem("andima_user");
      sessionStorage.removeItem("andima_logged_in");
      sessionStorage.clear();
    } catch {}
    router.push("/login");
  };

  const isItemActive = (href: string) => {
    if (href === "/dashboard/sales-executive") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isDashboardActive = pathname === "/dashboard";

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between py-6 px-4">
      {/* Top Section */}
      <div>
        {/* Mobile Close Button (only on mobile drawer) */}
        {onClose && (
          <div className="flex justify-end lg:hidden mb-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* 1. Logo & Company Title Header */}
        <div className="flex items-center gap-3 mb-4">
          <Image
            src="/andima-logo.png"
            alt="PT Andima Transportindo"
            width={60}
            height={40}
            className="h-10 w-auto shrink-0 object-contain"
            priority
          />
          <div className="leading-tight text-white select-none">
            <h1 className="text-[15px] font-extrabold tracking-wide text-white">ANDIMA</h1>
            <p className="text-[12px] font-bold tracking-[0.03em] text-white">TRANSPORTINDO</p>
            <p className="mt-0.5 text-[6.5px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
              Enterprise Digital Ecosystem
            </p>
          </div>
        </div>

        {/* Divider Line */}
        <div className="border-b border-slate-700/60 mb-5" />

        {/* 2. Dashboard Menu Item */}
        <div className="mb-4">
          <Link
            href="/dashboard"
            onClick={() => {
              if (onClose) onClose();
            }}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold transition-colors ${
              isDashboardActive
                ? "bg-[#1665FF] text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <LayoutGrid className="w-5 h-5 shrink-0" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* 3. CRM Section */}
        <div className="flex items-center gap-2.5">
          {/* ID Badge Icon matching screenshot exactly */}
          <svg
            className="w-5 h-5 text-white shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M9 7h6" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M8 18c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" />
          </svg>

          {/* CRM Bright Blue Button */}
          <button
            type="button"
            onClick={() => setCrmOpen(!crmOpen)}
            className="flex flex-1 items-center justify-between bg-[#1665FF] hover:bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold tracking-wide transition-colors cursor-pointer shadow-sm"
          >
            <span>CRM</span>
            {crmOpen ? (
              <ChevronUp className="h-4 w-4 text-white stroke-[2.5]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white stroke-[2.5]" />
            )}
          </button>
        </div>

        {/* CRM Submenu with left guideline */}
        {crmOpen && (
          <div className="relative ml-2.5 my-3 border-l border-slate-700/70 pl-3 space-y-1.5">
            {crmMenus.map((item) => {
              const active = isItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                    active
                      ? "bg-[#AFC0D0] text-[#0B1E38] font-bold shadow-xs"
                      : "text-slate-300 hover:text-white font-medium hover:bg-white/5"
                  }`}
                >
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488] shrink-0" />
                  )}
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* 4. HRMS Section below CRM */}
        <div className="mt-5 flex items-center gap-2.5 px-0 text-white font-bold text-xs tracking-wide select-none">
          <Users className="h-5 w-5 text-white shrink-0" />
          <span>HRMS</span>
        </div>
      </div>

      {/* Bottom Section: Logout Button */}
      <div className="pt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2.5 px-4 rounded-full border-2 border-[#E11D48] text-[#E11D48] hover:bg-[#E11D48]/10 font-bold text-sm tracking-wide transition-colors cursor-pointer text-center block"
        >
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-[235px] shrink-0 flex-col bg-[#0B1E38] select-none border-r border-[#1a3154]/50">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in cursor-pointer"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-[240px] flex-col bg-[#0B1E38] shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
