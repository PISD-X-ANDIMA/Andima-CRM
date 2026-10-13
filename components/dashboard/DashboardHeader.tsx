"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const routeLabels: Record<string, string> = {
  "sales-executive": "Sales Executive",
  "manager-customer-success": "Manager of Customer Success",
  "role-management": "Manage User Roles",
  "company-list": "Company List",
  "meeting-schedule": "Meeting Schedule",
  "record-conversation": "Record Conversation",
  "task-of-field-agent": "Management Task of Field Agent",
  "need-backup": "Need Backup",
  "manage-field-agent-account": "Manage Field Agent Account",
  "field-agent-management": "Field Agent Management",
  "field-agent-access": "Field Agent Management",
  jobs: "Jobs",
};

export interface ManagerNotificationItem {
  id: string;
  type: 'need_assistance';
  title: string;
  message: string;
  conversation_id: string;
  company_name: string;
  timestamp: string;
  read: boolean;
}

export function DashboardHeader() {
  const pathname = usePathname();
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

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean).slice(1);
    if (!segments.length) return ["Dashboard"];
    const isManager = pathname.includes("manager-customer-success");
    const parentRole = isManager ? "Manager of Customer Success" : "Sales Executive";
    if (segments[0] === "task-of-field-agent") return ["CRM", parentRole, "Management Task of Field Agent"];
    const labels = segments.map((segment) => routeLabels[segment] || (segment.includes("-") ? "Details" : segment));
    if (labels[0] !== parentRole && labels[0] !== "Dashboard") labels.unshift(parentRole);
    return ["CRM", ...labels];
  }, [pathname]);

  return (
    <header className="mb-8 flex min-h-10 items-center justify-between gap-4 border-b border-slate-100 pb-4">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1 text-xs uppercase text-slate-500">
        {breadcrumbs.map((label, index) => (
          <span key={`${label}-${index}`} className={index === breadcrumbs.length - 1 ? "font-medium text-blue-600" : ""}>
            {index > 0 && <span className="px-1 text-slate-300">/</span>}{label}
          </span>
        ))}
      </nav>
      <div className="flex shrink-0 items-center gap-2 text-slate-700" aria-label={`Signed in as ${username}`}>
        <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">{username.slice(0, 1).toUpperCase()}</span>
        <span className="max-w-48 truncate text-xs font-semibold">{username}</span>
      </div>
    </header>
  );
}
