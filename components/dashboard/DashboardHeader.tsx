"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { ManagerBackupBell } from "@/components/dashboard/ManagerBackupBell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useSidebarToggle } from "@/components/dashboard/DashboardShell";

export function DashboardHeader({ isManager = false }: { isManager?: boolean }) {
  const pathname = usePathname();
  const { sidebarVisible, toggleSidebar } = useSidebarToggle();
  const [username, setUsername] = useState<string>("");
  const [storedRole, setStoredRole] = useState<string>("");

  useEffect(() => {
    let active = true;
    const loadUsername = async () => {
      try {
        const savedUser = JSON.parse(localStorage.getItem("andima_user") || "null") as { name?: string; role?: string } | null;
        if (savedUser?.name?.trim()) {
          if (active) {
            setUsername(savedUser.name.trim());
            if (savedUser.role) setStoredRole(savedUser.role);
          }
          return;
        }
      } catch {
        // Fall back to the authenticated account below.
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accountName = session?.user.user_metadata?.full_name || session?.user.email?.split("@")[0] || "";
        if (active && accountName) setUsername(accountName);
      } catch {
        // Keep fallback
      }
    };
    void loadUsername();
    return () => { active = false; };
  }, []);

  // Determine if the current active role is manager
  const isActuallyManager = Boolean(
    isManager ||
    pathname.includes("manager-customer-success") ||
    storedRole === "manager_customer_success" ||
    storedRole === "manager"
  );

  // Role title for breadcrumbs (strictly "Manager of Customer Success" without typo)
  const roleTitle = isActuallyManager ? "Manager of Customer Success" : "Sales Executive";
  const roleSubtitle = isActuallyManager ? "Manager" : "Sales";
  const displayName = username || (isActuallyManager ? "Kentson Thiodarent" : "Zefanya Christian Sutjahja");
  const initial = displayName.charAt(0).toUpperCase() || (isActuallyManager ? "K" : "Z");

  const breadcrumbs = useMemo(() => {
    // 1. Root dashboard
    if (pathname === "/dashboard") {
      return ["CRM", roleTitle];
    }

    // 2. Dashboard role homepage
    if (
      pathname === "/dashboard/manager-customer-success" ||
      pathname === "/dashboard/sales-executive"
    ) {
      return ["CRM", roleTitle, "Dashboard"];
    }

    // 3. Specific module pages
    if (pathname.includes("role-management")) {
      return ["CRM", roleTitle, "Manage User Role"];
    }
    if (pathname.includes("company-list")) {
      const parts = pathname.split("/").filter(Boolean);
      if (parts.length > 2 && parts[2] !== "") {
        return ["CRM", roleTitle, "Company List", "Detail"];
      }
      return ["CRM", roleTitle, "Company List"];
    }
    if (pathname.includes("meeting-schedule")) {
      return ["CRM", roleTitle, "Meeting Schedule"];
    }
    if (pathname.includes("record-conversation")) {
      return ["CRM", roleTitle, "Record Conversation"];
    }
    if (pathname.includes("task-of-field-agent")) {
      return ["CRM", roleTitle, isActuallyManager ? "Task Of Field Agent" : "Task Field Agent"];
    }
    if (pathname.includes("manage-field-agent-account")) {
      return ["CRM", roleTitle, "Manage Account"];
    }
    if (pathname.includes("field-agent-management") || pathname.includes("field-agent-access")) {
      return ["CRM", roleTitle, isActuallyManager ? "Manage Account" : "Field Agent Management"];
    }
    if (pathname.includes("need-backup")) {
      return ["CRM", roleTitle, "Need Backup"];
    }

    // 4. Dynamic fallback based on segments
    const segments = pathname.split("/").filter(Boolean).slice(1);
    if (!segments.length) return ["CRM", roleTitle];

    const formatted = segments.map((seg) =>
      seg
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    );

    return ["CRM", roleTitle, ...formatted];
  }, [pathname, isActuallyManager, roleTitle]);

  return (
    <header className="sticky top-0 z-30 -mx-3 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-10 lg:-mt-8 mb-6 sm:mb-8 flex min-h-[58px] w-[calc(100%+1.5rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+5rem)] items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 py-2.5 shadow-2xs">
      {/* Left: Hamburger + ANDIMA CRM + Divider + Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
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

        <span className="font-bold text-slate-900 text-[14px] sm:text-[15px] tracking-tight whitespace-nowrap">
          ANDIMA CRM
        </span>

        <span className="text-slate-300 font-light select-none text-sm mx-0.5 sm:mx-1" aria-hidden="true">
          |
        </span>

        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center text-[12px] sm:text-[13px] font-medium leading-none">
          {breadcrumbs.map((label, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={`${label}-${index}`} className="flex items-center">
                {index > 0 && <span className="text-slate-400 mx-1.5 text-xs select-none">/</span>}
                <span className={`truncate max-w-[140px] sm:max-w-none ${isLast ? "font-semibold text-[#1565d8]" : "text-slate-600"}`}>
                  {label}
                </span>
              </span>
            );
          })}
        </nav>
      </div>

      {/* Right: Language Switcher + Divider + Bell + Divider + User Profile */}
      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notification Bell (Only for Manager of Customer Success) */}
        {isActuallyManager && (
          <>
            <div className="h-5 w-px bg-slate-200" aria-hidden="true" />
            <ManagerBackupBell />
          </>
        )}

        {/* Vertical divider */}
        <div className="h-5 w-px bg-slate-200" aria-hidden="true" />

        {/* User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div
            aria-hidden="true"
            className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-[#1565d8] text-[13px] font-bold text-white shadow-xs"
          >
            {initial}
          </div>
          <div className="flex flex-col text-left leading-tight">
            <span className="max-w-[110px] sm:max-w-[180px] truncate text-[13px] font-semibold text-slate-900 leading-tight">
              {displayName}
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              {roleSubtitle}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
