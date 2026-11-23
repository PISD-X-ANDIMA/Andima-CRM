"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { ManagerBackupBell } from "@/components/dashboard/ManagerBackupBell";
import { useSidebarToggle } from "@/components/dashboard/DashboardShell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function DashboardHeader({ isManager = false }: { isManager?: boolean }) {
  const pathname = usePathname();
  const { sidebarVisible, toggleSidebar } = useSidebarToggle();
  const { t } = useLanguage();
  const [username, setUsername] = useState("User");

  useEffect(() => {
    let active = true;
    const loadUsername = async () => {
      try {
        const savedUser = JSON.parse(localStorage.getItem("andima_user") || "null") as { name?: string } | null;
        if (savedUser?.name?.trim()) {
          if (active) setUsername(savedUser.name.trim());
          return;
        }
      } catch {
        // Fall back to the authenticated account below.
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accountName = session?.user.user_metadata?.full_name || session?.user.email?.split("@")[0] || "User";
        if (active) setUsername(accountName);
      } catch {
        if (active) setUsername("User");
      }
    };
    void loadUsername();
    return () => { active = false; };
  }, []);

  const routeLabelMap: Record<string, string> = useMemo(() => ({
    "sales-executive": t("nav.salesExecutive", "Sales Executive"),
    "manager-customer-success": t("nav.managerCustomerSuccess", "Manager of Customer Success"),
    "field-agent": t("nav.fieldAgent", "Field Agent"),
    "company-list": t("nav.companyList", "Company List"),
    "meeting-schedule": t("nav.meetingSchedule", "Meeting Schedule"),
    "record-conversation": t("nav.recordConversation", "Record Conversation"),
    "task-of-field-agent": t("nav.taskOfFieldAgent", "Task of Field Agent"),
    "field-agent-management": t("nav.fieldAgentManagement", "Field Agent Management"),
    "field-agent-access": t("nav.fieldAgentManagement", "Field Agent Management"),
    jobs: "Jobs",
  }), [t]);

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean).slice(1);
    if (!segments.length) return [t("nav.dashboard", "Dashboard")];
    const isManagerRole = pathname.includes("manager-customer-success");
    const parentRole = isManagerRole
      ? t("nav.managerCustomerSuccess", "Manager of Customer Success")
      : segments[0] === "field-agent"
        ? t("nav.fieldAgent", "Field Agent")
        : t("nav.salesExecutive", "Sales Executive");

    if (segments[0] === "task-of-field-agent") {
      return ["CRM", parentRole, t("nav.taskOfFieldAgent", "Task of Field Agent")];
    }
    const labels = segments.map((segment) =>
      routeLabelMap[segment] || (segment.includes("-") ? t("common.details", "Details") : segment)
    );
    if (labels[0] !== parentRole && labels[0] !== t("nav.dashboard", "Dashboard")) {
      labels.unshift(parentRole);
    }
    return ["CRM", ...labels];
  }, [pathname, routeLabelMap, t]);

  return (
    <header className="mb-6 flex min-h-10 flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 pt-1 sm:mb-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
          aria-controls="crm-sidebar"
          aria-expanded={sidebarVisible}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#1476f2] text-white shadow-md transition-colors hover:bg-[#0f6ae0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1476f2]/40"
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </button>
        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1 text-[11px] sm:text-xs uppercase text-slate-500 font-medium">
          {breadcrumbs.map((label, index) => (
            <span
              key={`${label}-${index}`}
              className={`truncate max-w-[140px] sm:max-w-none ${
                index === breadcrumbs.length - 1 ? "font-semibold text-blue-600" : ""
              }`}
            >
              {index > 0 && <span className="px-1 text-slate-300">/</span>}
              {label}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 text-slate-700">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Manager Backup Bell (conditional in component) */}
        {isManager && <ManagerBackupBell />}

        {/* User avatar & name */}
        <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 py-1 pl-1 pr-3" aria-label={`Signed in as ${username}`}>
          <span
            aria-hidden="true"
            className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-2xs"
          >
            {username.slice(0, 1).toUpperCase()}
          </span>
          <span className="max-w-28 sm:max-w-40 truncate text-xs font-semibold text-slate-800">
            {username}
          </span>
        </div>
      </div>
    </header>
  );
}
