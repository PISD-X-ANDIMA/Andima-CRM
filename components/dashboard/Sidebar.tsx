"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SubMenuItem {
  name: string;
  href: string;
}

const defaultSalesExecutiveMenus: SubMenuItem[] = [
  { name: "Dashboard", href: "/dashboard/sales-executive" },
  { name: "Company List", href: "/dashboard/company-list" },
  { name: "Meeting Schedule", href: "/dashboard/meeting-schedule" },
  { name: "Record Conversation", href: "/dashboard/record-conversation" },
  { name: "Task of Field Agent", href: "/dashboard/task-of-field-agent" },
  { name: "Field Agent Management", href: "/dashboard/field-agent-management" },
];

const defaultFieldAgentMenus: SubMenuItem[] = [
  { name: "Dashboard", href: "/dashboard/field-agent?tab=dashboard" },
  { name: "My Tasks", href: "/dashboard/field-agent?tab=tasks" },
  { name: "History", href: "/dashboard/field-agent?tab=history" },
];

const defaultManagerMenus: SubMenuItem[] = [
  { name: "Dashboard", href: "/dashboard/manager-customer-success" },
  { name: "Company List", href: "/dashboard/company-list" },
  { name: "Meeting Schedule", href: "/dashboard/meeting-schedule" },
  { name: "Record Conversation", href: "/dashboard/record-conversation" },
  { name: "Task of Field Agent", href: "/dashboard/task-of-field-agent" },
  { name: "Manage Accounts", href: "/dashboard/field-agent-management" },
];

export function Sidebar({ onHide }: { onHide?: () => void } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const handleNavClick = () => {
    if (onHide && typeof window !== "undefined" && window.innerWidth < 1024) {
      onHide();
    }
  };

  // Instant role detection from localStorage or pathname to eliminate the 1-2s delay
  const initialRole = (() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("andima_user");
        if (stored) {
          const user = JSON.parse(stored);
          const role = String(user.role || "").toLowerCase();
          if (role.includes("field") || role.includes("agent")) return "field_agent";
          if (role.includes("manager")) return "manager";
        }
      } catch (error) { console.error(error); }
    }
    if (pathname.includes("manager-customer-success")) return "manager";
    if (pathname.includes("field-agent")) return "field_agent";
    return "sales_executive";
  })();

  const [crmOpen, setCrmOpen] = useState(true);
  const [isManagerRole, setIsManagerRole] = useState(() => initialRole === "manager");
  const [menuLabel, setMenuLabel] = useState(() => initialRole === "field_agent" ? "Field Agent" : "CRM");
  const [roleTitle, setRoleTitle] = useState(() =>
    initialRole === "field_agent"
      ? "Field Agent"
      : initialRole === "manager"
        ? "Manager of Customer Success"
        : "Sales Executive"
  );
  const [sectionHref, setSectionHref] = useState(() =>
    initialRole === "field_agent"
      ? "/dashboard/field-agent"
      : initialRole === "manager"
        ? "/dashboard/manager-customer-success"
        : "/dashboard/sales-executive"
  );
  const [submenuItems, setSubmenuItems] = useState(() =>
    initialRole === "field_agent"
      ? defaultFieldAgentMenus
      : initialRole === "manager"
        ? defaultManagerMenus
        : defaultSalesExecutiveMenus
  );

  const getMenuTitle = (href: string, fallbackName: string) => {
    if (href.includes("/sales-executive") || href.includes("/manager-customer-success") || href.includes("field-agent?tab=dashboard")) {
      return t("nav.dashboard", "Dashboard");
    }
    if (href.includes("/company-list")) return t("nav.companyList", "Company List");
    if (href.includes("/meeting-schedule")) return t("nav.meetingSchedule", "Meeting Schedule");
    if (href.includes("/record-conversation")) return t("nav.recordConversation", "Record Conversation");
    if (href.includes("/task-of-field-agent")) return t("nav.taskOfFieldAgent", "Task of Field Agent");
    if (href.includes("/field-agent-management") || href.includes("/field-agent-access")) {
      return isManagerRole ? t("nav.manageAccounts", "Manage Accounts") : t("nav.fieldAgentManagement", "Field Agent Management");
    }
    if (href.includes("tab=tasks")) return t("nav.myTasks", "My Tasks");
    if (href.includes("tab=history")) return t("nav.history", "History");
    return fallbackName;
  };

  const currentRoleTitle = useMemo(() => {
    if (isManagerRole || roleTitle.includes("Manager")) return t("nav.managerCustomerSuccess", "Manager of Customer Success");
    if (roleTitle.includes("Field Agent")) return t("nav.fieldAgent", "Field Agent");
    return t("nav.salesExecutive", "Sales Executive");
  }, [isManagerRole, roleTitle, t]);

  useEffect(() => {
    let active = true;

    async function loadNavData() {
      try {
        const response = await fetch("/api/v1/navigation/sidebar", { cache: "no-store" });
        const result = await response.json();
        if (!active || !result.success) return;

        setIsManagerRole(Boolean(result.data.isManager));
        setMenuLabel(result.data.menuLabel || "CRM");
        setRoleTitle(result.data.roleTitle || "Sales Executive");
        setSectionHref(result.data.sectionHref || "/dashboard/sales-executive");

        if (Array.isArray(result.data.submenuItems) && result.data.submenuItems.length > 0) {
          setSubmenuItems(result.data.submenuItems);
        }
      } catch (error) {
        console.error("Failed to load navigation data:", error);
      }
    }

    void loadNavData();
    return () => { active = false; };
  }, []);

  const [currentSectionPath, currentSectionQuery] = sectionHref.split("?");
  const cleanSectionPath = currentSectionPath.replace(/\/+$/, "");
  const cleanCurrentPath = pathname.replace(/\/+$/, "");
  const isCurrentDashboard = currentSectionQuery
    ? cleanSectionPath === cleanCurrentPath && currentSectionQuery === searchParams.toString()
    : cleanSectionPath === cleanCurrentPath;

  return (
    <aside
      aria-label="Main Navigation"
      className="flex h-full w-[260px] flex-col justify-between bg-[#0F2342] text-white select-none shadow-xl"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 pt-7 pb-6">
        <Image
          src="/andima-logo.png"
          alt="Andima Logo"
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 object-contain drop-shadow"
          priority
        />
        <div className="flex flex-col">
          <span className="font-heading text-xl font-black tracking-tight text-white leading-none">
            ANDIMA
          </span>
          <span className="text-[11px] font-semibold tracking-wider text-slate-300 uppercase mt-0.5">
            {t("nav.crm", "CRM")}
          </span>
        </div>
      </div>

      {/* Main Nav Container */}
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        <button
          type="button"
          onClick={() => setCrmOpen((value) => !value)}
          className="flex w-full items-center gap-2.5 rounded-lg bg-[#0550D7] px-3 py-2.5 text-[12.5px] font-bold text-white shadow-md shadow-black/10 transition-colors hover:bg-[#0446B8]"
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px] bg-white">
            <Users className="h-3 w-3 text-[#0550D7]" />
          </span>
          <span className="flex-1 truncate text-left">{menuLabel}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
              crmOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>

        {crmOpen && (
          <div className="ml-3 mt-2 border-l-2 border-white/25 pl-3">
            <Link
              href={sectionHref}
              prefetch
              onClick={handleNavClick}
              aria-current={isCurrentDashboard ? "page" : undefined}
              className={`flex items-center rounded-md border-l-2 px-2 py-[7px] text-[12.5px] font-semibold transition-colors ${
                isCurrentDashboard
                  ? "border-transparent bg-[#B0C6D4] text-[#44525c]"
                  : "border-transparent text-white hover:bg-white/10"
              }`}
            >
              {isCurrentDashboard && (
                <span className="mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              )}
              <span className="truncate">{currentRoleTitle}</span>
            </Link>

            <div className="space-y-0.5">
              {submenuItems
                .filter((item) => item.href !== sectionHref)
                .map((item) => {
                const [rawItemPath, itemQuery] = item.href.split("?");
                const itemPath = rawItemPath.replace(/\/+$/, "");
                const currentPath = pathname.replace(/\/+$/, "");
                const isActive = itemQuery
                  ? itemPath === currentPath && itemQuery === searchParams.toString()
                  : itemPath === currentPath || currentPath.startsWith(`${itemPath}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center rounded-md border-l-2 px-2 py-[7px] text-[12.5px] font-semibold transition-colors ${
                      isActive
                        ? "border-transparent bg-[#B0C6D4] text-[#44525c]"
                        : "border-transparent text-white hover:bg-white/10"
                    }`}
                  >
                    {isActive && (
                      <span className="mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    )}
                    <span className="truncate">{getMenuTitle(item.href, item.name)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Logout Footer */}
      <div className="px-[17px] pb-5 pt-3">
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
            try { localStorage.removeItem('andima_user'); } catch (error) { console.error(error); }
            router.push('/login');
          }}
          className="flex h-10 w-full items-center justify-center rounded-full border-2 border-[#D9364F] bg-transparent px-4 text-base font-bold text-[#D9364F] transition-colors hover:bg-[#D9364F] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9364F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2342] cursor-pointer"
        >
          <span>{t("nav.logout", "Logout")}</span>
        </button>
      </div>
    </aside>
  );
}
