"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  ChevronDown,
  ChevronRight,
  Building2,
  Mic,
  ClipboardList,
  ShieldAlert,
  UserCog,
  Briefcase,
  Settings,
  Calendar,
} from "lucide-react";

interface SubMenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
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
    icon: Building2,
  },
  {
    name: "Meeting Schedule",
    href: "/dashboard/meeting-schedule",
    icon: Calendar,
  },
  {
    name: "Record Conversation",
    href: "/dashboard/record-conversation",
    icon: Mic,
  },
  {
    name: "Task of Field Agent",
    href: "/dashboard/task-of-field-agent",
    icon: ClipboardList,
  },
  {
    name: "Need Backup",
    href: "/dashboard/need-backup",
    icon: ShieldAlert,
  },
];

const topMenuItems: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard/sales-executive",
    icon: LayoutDashboard,
  },
  {
    name: "POS",
    href: "#",
    icon: ShoppingBag,
  },
];

const bottomMenuItems: MenuItem[] = [
  {
    name: "Field Agent",
    href: "#",
    icon: UserCog,
  },
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
    pathname.startsWith("/dashboard/need-backup");

  const handleSalesExecutiveClick = () => {
    setCrmOpen(true);
    setSalesExecOpen(true);
    router.push("/dashboard/sales-executive");
  };

  return (
    <aside className="flex min-h-screen w-[260px] shrink-0 flex-col border-r border-[#1a2744] bg-[#0b1224]">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-[17px] font-extrabold tracking-[0.12em] text-white uppercase">
          ANDIMA
        </h1>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pt-2 pb-4">
        {topMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href !== "#" &&
            (pathname === item.href ||
              pathname.startsWith(`${item.href}/`));

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
              isSalesExecutiveActive
                ? "bg-white/[0.04] text-white"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
            }`}
          >
            <span className="flex items-center gap-3">
              <Users
                className={`h-[18px] w-[18px] ${
                  isSalesExecutiveActive ? "text-blue-400" : "text-slate-500"
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
              <button
                type="button"
                onClick={handleSalesExecutiveClick}
                className={`flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                  isSalesExecutiveDashboard
                    ? "bg-blue-600/15 text-blue-300"
                    : isSalesExecutiveActive
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isSalesExecutiveDashboard
                        ? "bg-blue-400"
                        : "bg-blue-500"
                    }`}
                  />
                  <span>Sales Executive</span>
                </span>

              </button>
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
                    const Icon = item.icon;

                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                          isActive
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                            : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            isActive ? "text-white" : "text-slate-500"
                          }`}
                        />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-0.5 pt-0.5">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            const hasChevron = item.name === "Field Agent";

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

                {hasChevron && (
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="px-3 pb-4">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
        >
          <Settings className="h-[18px] w-[18px] text-slate-500" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
