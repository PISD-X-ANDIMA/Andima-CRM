"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { ManagerBackupBell } from "@/components/dashboard/ManagerBackupBell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useSidebarToggle } from "@/components/dashboard/DashboardShell";
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
    if (!segments.length) return ["CRM", t("nav.dashboard", "Dashboard")];
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
    <header className="sticky top-0 z-30 -mx-3 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-10 lg:-mt-8 mb-6 sm:mb-8 flex min-h-[54px] w-[calc(100%+1.5rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+5rem)] flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] bg-white px-4 sm:px-6 py-2 shadow-2xs">
      {/* Left: Toggle Button + Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
          className={`flex size-[36px] shrink-0 items-center justify-center rounded-[8px] !bg-[#1565d8] !text-white shadow-xs transition-colors hover:!bg-[#0f52b8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1565d8]/40 cursor-pointer ${
            sidebarVisible ? "lg:hidden" : ""
          }`}
        >
          <Menu className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide">
          {breadcrumbs.map((label, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={`${label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && <span className="text-[#424753]">/</span>}
                <span className={`truncate max-w-[150px] sm:max-w-none ${isLast ? "font-semibold text-[#1565d8]" : "text-[#424753]"}`}>
                  {label}
                </span>
              </span>
            );
          })}
        </nav>
      </div>

      {/* Right: Language Switcher + Bell + User Profile */}
      <div className="flex shrink-0 items-center gap-2.5">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Manager Backup Bell (conditional in component) */}
        {isManager && <ManagerBackupBell />}

        {/* User profile pill */}
        <div
          className="flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white pl-[5px] pr-3 sm:pr-[17px] py-[5px] shadow-2xs"
          aria-label={`Signed in as ${username}`}
        >
          <span
            aria-hidden="true"
            className="grid size-[28px] place-items-center rounded-full bg-[#1565d8] text-[12px] font-medium text-white shrink-0"
          >
            {username.slice(0, 1).toUpperCase()}
          </span>
          <span className="max-w-28 sm:max-w-44 truncate text-[12px] font-medium text-[#191b22]">
            {username}
          </span>
        </div>
      </div>
    </header>
  );
}
