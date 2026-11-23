"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  ChevronDown,
} from "lucide-react";

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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

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

  useEffect(() => {
    let active = true;
    fetch("/api/v1/navigation/sidebar", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (!active || !result?.success) return;
        const isField = Boolean(result.data?.isFieldAgent);
        const isMgr = !isField && Boolean(result.data?.isManager);
        setIsManagerRole(isMgr);
        setMenuLabel(isField ? "Field Agent" : "CRM");
        setRoleTitle(isField ? "Field Agent" : isMgr ? "Manager of Customer Success" : "Sales Executive");
        setSectionHref(
          isField
            ? "/dashboard/field-agent"
            : isMgr
              ? "/dashboard/manager-customer-success"
              : "/dashboard/sales-executive"
        );

        const crm = result.data?.menu?.[0];
        if (crm?.label) setMenuLabel(crm.label);
        const activeSection = crm?.children?.[0];
        if (Array.isArray(activeSection?.children) && activeSection.children.length > 0) {
          const items = activeSection.children
            .filter((item: { label?: string; href?: string | null }) => item.href && item.label)
            .map((item: { label: string; href: string }) => ({ name: item.label, href: item.href }));
          if (items.length) setSubmenuItems(items);
        } else {
          setSubmenuItems(isField ? defaultFieldAgentMenus : isMgr ? defaultManagerMenus : defaultSalesExecutiveMenus);
        }
      })
      .catch(() => {
        if (pathname === "/dashboard/field-agent" || pathname.startsWith("/dashboard/field-agent/")) {
          setMenuLabel("Field Agent");
          setRoleTitle("Field Agent");
          setSectionHref("/dashboard/field-agent");
          setSubmenuItems(defaultFieldAgentMenus);
        } else if (pathname.includes("manager-customer-success")) {
          setIsManagerRole(true);
          setRoleTitle("Manager of Customer Success");
          setSectionHref("/dashboard/manager-customer-success");
          setSubmenuItems(defaultManagerMenus);
        }
      });
    return () => { active = false; };
  }, [pathname]);

  // Root link is active on the role home, unless a query-based submenu item owns that URL.
  const cleanPath = pathname.replace(/\/+$/, "");
  const currentUrl = searchParams.toString()
    ? `${cleanPath}?${searchParams.toString()}`
    : cleanPath;
  const isCurrentDashboard =
    cleanPath === sectionHref &&
    !submenuItems.some((item) => item.href === currentUrl && item.href !== sectionHref);

  return (
    <aside className="group relative flex h-screen h-dvh w-[260px] shrink-0 flex-col bg-[#0F2342]">
      {/* Header Logo */}
      <div className="flex items-start gap-2 px-4 pb-5 pt-5">
        <div className="flex items-center gap-2.5">
          <Image src="/andima-logo.png" alt="PT Andima Transportindo" width={470} height={300} className="h-10 w-11 shrink-0 object-contain" priority />
          <div className="leading-tight text-white">
            <h1 className="text-[16px] font-extrabold tracking-wide">ANDIMA</h1>
            <p className="text-[9px] font-medium tracking-[0.08em] text-slate-300">Logistics Suite</p>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        <button
          type="button"
          onClick={() => setCrmOpen((value) => !value)}
          className="flex w-full items-center gap-2.5 rounded-lg bg-[#1476f2] px-3 py-2.5 text-[12.5px] font-bold text-white shadow-md shadow-black/10 transition-colors hover:bg-[#0f6ae0]"
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px] bg-white">
            <Users className="h-3 w-3 text-[#1476f2]" />
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
              aria-current={isCurrentDashboard ? "page" : undefined}
              className={`flex items-center rounded-md border-l-2 px-2 py-[7px] text-[12.5px] font-semibold transition-colors ${
                isCurrentDashboard
                  ? "border-emerald-400 bg-[#cdd8dd] text-[#5d6b75]"
                  : "border-transparent text-white hover:bg-white/10"
              }`}
            >
              {isCurrentDashboard && (
                <span className="mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              )}
              <span className="truncate">{roleTitle}</span>
            </Link>

            <div className="space-y-0.5">
              {submenuItems
                .filter((item) => item.href !== sectionHref)
                .map((item) => {
                const [rawItemPath, itemQuery] = item.href.split("?");
                const itemPath = rawItemPath.replace(/\/+$/, "");
                const currentPath = pathname.replace(/\/+$/, "");
                // Item tanpa query aktif untuk path itu sendiri dan semua sub-path-nya.
                const isActive = itemQuery
                  ? itemPath === currentPath && itemQuery === searchParams.toString()
                  : itemPath === currentPath || currentPath.startsWith(`${itemPath}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center rounded-md border-l-2 px-2 py-[7px] text-[12.5px] font-semibold transition-colors ${
                      isActive
                        ? "border-emerald-400 bg-[#cdd8dd] text-[#5d6b75]"
                        : "border-transparent text-white hover:bg-white/10"
                    }`}
                  >
                    {isActive && (
                      <span className="mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className="px-[17px] pb-5 pt-3">
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
            try { localStorage.removeItem('andima_user'); } catch (error) { console.error(error); }
            router.push('/login');
          }}
          className="flex h-10 w-full items-center justify-center rounded-full border-2 border-[#f32650] bg-transparent px-4 text-base font-bold text-[#f32650] transition-colors hover:bg-[#f32650] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f32650] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2342]"
        >
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
