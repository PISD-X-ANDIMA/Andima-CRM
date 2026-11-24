"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Users, ChevronDown } from "lucide-react";
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
  { name: "Task Field Agent", href: "/dashboard/task-of-field-agent" },
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
  { name: "Task Field Agent", href: "/dashboard/task-of-field-agent" },
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

  // Instant role detection from localStorage or pathname
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
      } catch (error) {
        console.error(error);
      }
    }
    if (pathname.includes("manager-customer-success")) return "manager";
    if (pathname.includes("field-agent")) return "field_agent";
    return "sales_executive";
  })();

  const [crmOpen, setCrmOpen] = useState(true);
  const [isManagerRole, setIsManagerRole] = useState(() => initialRole === "manager");
  const [menuLabel, setMenuLabel] = useState(() => (initialRole === "field_agent" ? "Field Agent" : "CRM"));
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
  const [submenuItems, setSubmenuItems] = useState<SubMenuItem[]>(() =>
    initialRole === "field_agent"
      ? defaultFieldAgentMenus
      : initialRole === "manager"
        ? defaultManagerMenus
        : defaultSalesExecutiveMenus
  );

  const getMenuTitle = (href: string, fallbackName: string) => {
    if (
      href.includes("/sales-executive") ||
      href.includes("/manager-customer-success") ||
      href.includes("field-agent?tab=dashboard")
    ) {
      return t("nav.dashboard", "Dashboard");
    }
    if (href.includes("/company-list")) return t("nav.companyList", "Company List");
    if (href.includes("/meeting-schedule")) return t("nav.meetingSchedule", "Meeting Schedule");
    if (href.includes("/record-conversation")) return t("nav.recordConversation", "Record Conversation");
    if (href.includes("/task-of-field-agent")) return t("nav.taskFieldAgent", "Task Field Agent");
    if (href.includes("/field-agent-management") || href.includes("/field-agent-access")) {
      return isManagerRole
        ? t("nav.manageAccounts", "Manage Accounts")
        : t("nav.fieldAgentManagement", "Field Agent Management");
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
        if (result.data.roleTitle) setRoleTitle(result.data.roleTitle);
        if (result.data.sectionHref) setSectionHref(result.data.sectionHref);

        const sub = result.data.submenuItems || result.data.menu?.[0]?.children?.[0]?.children;
        if (Array.isArray(sub) && sub.length > 0) {
          setSubmenuItems(
            sub.map((item: any) => ({
              name: item.name || item.label,
              href: item.href,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to load navigation data:", error);
      }
    }

    void loadNavData();
    return () => {
      active = false;
    };
  }, []);

  return (
    <aside
      aria-label="Main Navigation"
      className="flex h-full w-[260px] flex-col justify-between bg-[#0F2342] text-white select-none shadow-xl font-sans"
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 pt-6 pb-5">
          <Image
            src="/andima-logo.png"
            alt="Andima Logo"
            width={48}
            height={40}
            className="h-10 w-12 shrink-0 object-contain drop-shadow"
            priority
          />
          <div className="flex flex-col">
            <span className="text-[20px] font-bold tracking-[-0.5px] leading-[28px] text-white">
              ANDIMA
            </span>
            <span className="text-[12px] font-normal leading-[16px] text-[rgba(217,226,252,0.8)]">
              Logistics Suite
            </span>
          </div>
        </div>

        {/* Main Nav Container */}
        <nav className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
          {/* CRM Dropdown Header Button */}
          <button
            type="button"
            onClick={() => setCrmOpen((value) => !value)}
            className="flex h-[40px] w-full items-center justify-between rounded-[8px] !bg-[#0550d7] hover:!bg-[#0446b8] px-3 text-[14px] font-medium tracking-[0.07px] !text-white shadow-sm transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Users className="h-[18px] w-[18px] shrink-0 text-white" />
              <span className="truncate text-left text-white">{menuLabel}</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-white transition-transform duration-200 ${
                crmOpen ? "rotate-0" : "-rotate-90"
              }`}
            />
          </button>

          {crmOpen && (
            <div className="mt-2.5">
              {/* Active Role Box (e.g. Sales Executive) */}
              <Link
                href={sectionHref}
                prefetch
                onClick={handleNavClick}
                className="flex h-[40px] w-full items-center rounded-[8px] !bg-[#b0c6d4] hover:!bg-[#a1bccd] px-3 text-[14px] font-medium !text-[#45556c] transition-colors"
              >
                <span className="truncate">{currentRoleTitle}</span>
              </Link>

              {/* Submodule Tree */}
              <div className="ml-4 mt-2 border-l border-white/20 pl-2.5 space-y-1">
                {submenuItems.map((item) => {
                  const [rawItemPath, itemQuery] = item.href.split("?");
                  const itemPath = rawItemPath.replace(/\/+$/, "");
                  const currentPath = pathname.replace(/\/+$/, "");

                  const isDashboardItem =
                    item.href.includes("/sales-executive") ||
                    item.href.includes("/manager-customer-success") ||
                    item.href.includes("field-agent?tab=dashboard");

                  const isActive = itemQuery
                    ? itemPath === currentPath && itemQuery === searchParams.toString()
                    : isDashboardItem
                      ? (currentPath === itemPath || currentPath === "/dashboard") &&
                        (!itemQuery || itemQuery === searchParams.toString())
                      : currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex h-[36px] items-center rounded-[8px] px-3 text-[14px] transition-colors ${
                        isActive
                          ? "!bg-[#b0c6d4] font-medium !text-[#45556c]"
                          : "!bg-transparent font-normal !text-white hover:!bg-white/10"
                      }`}
                    >
                      {isActive && (
                        <span className="mr-2 size-[6px] shrink-0 rounded-full !bg-[#069494]" />
                      )}
                      <span className="truncate">{getMenuTitle(item.href, item.name)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="px-4 pb-8 pt-3">
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
            try {
              localStorage.removeItem("andima_user");
            } catch (error) {
              console.error(error);
            }
            router.push("/login");
          }}
          className="flex h-[40px] w-full items-center justify-center rounded-full border-2 border-[#d9364f] !bg-transparent hover:!bg-[#d9364f] text-[16px] font-medium !text-[#d9364f] hover:!text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9364f] cursor-pointer"
        >
          <span>{t("nav.logout", "Logout")}</span>
        </button>
      </div>
    </aside>
  );
}
