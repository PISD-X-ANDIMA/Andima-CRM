"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LayoutDashboard,
  Building2,
  Calendar,
  MessageSquare,
  Compass,
} from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type SidebarToggle = { sidebarVisible: boolean; toggleSidebar: () => void };

const SidebarToggleContext = createContext<SidebarToggle>({
  sidebarVisible: true,
  toggleSidebar: () => {},
});

export function useSidebarToggle() {
  return useContext(SidebarToggleContext);
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close mobile drawer on route changes automatically
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  // Determine dashboard link based on role
  const isManager = pathname.includes("manager-customer-success");
  const isFieldAgent = pathname.includes("field-agent");
  const dashboardHref = isManager
    ? "/dashboard/manager-customer-success"
    : isFieldAgent
      ? "/dashboard/field-agent"
      : "/dashboard/sales-executive";

  const isDashboardActive = pathname === dashboardHref || pathname === "/dashboard";
  const isCompaniesActive = pathname.startsWith("/dashboard/company-list");
  const isScheduleActive = pathname.startsWith("/dashboard/meeting-schedule");
  const isConversationActive = pathname.startsWith("/dashboard/record-conversation");

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setDesktopSidebarVisible((prev) => !prev);
    }
  };

  return (
    <SidebarToggleContext.Provider
      value={{
        sidebarVisible: desktopSidebarVisible,
        toggleSidebar,
      }}
    >
      <div className="min-h-screen bg-slate-50/50 lg:flex lg:items-start">
        {/* ======================================================== */}
        {/* 1. DESKTOP SIDEBAR (Large screens >= 1024px)              */}
        {/* ======================================================== */}
        <aside
          id="crm-sidebar"
          aria-hidden={!desktopSidebarVisible}
          inert={!desktopSidebarVisible}
          className={`hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out lg:sticky lg:top-0 lg:block lg:h-dvh ${
            desktopSidebarVisible ? "w-[260px]" : "w-0"
          }`}
        >
          <div
            className={`h-full w-[260px] transition-transform duration-300 ease-in-out ${
              desktopSidebarVisible ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar onHide={() => setDesktopSidebarVisible(false)} />
          </div>
        </aside>

        {/* Desktop Toggle Button when hidden */}
        {!desktopSidebarVisible && (
          <button
            type="button"
            onClick={() => setDesktopSidebarVisible(true)}
            aria-label="Show sidebar"
            aria-controls="crm-sidebar"
            aria-expanded={false}
            className="fixed left-4 top-4 z-40 hidden size-[36px] place-items-center rounded-[8px] bg-[#1565d8] text-white shadow-md transition-colors hover:bg-[#0f52b8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1565d8]/40 lg:grid cursor-pointer"
          >
            <Menu className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        )}

        {/* ======================================================== */}
        {/* 2. MOBILE SLIDE-OUT DRAWER & BACKDROP (< 1024px)          */}
        {/* ======================================================== */}
        {mobileDrawerOpen && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Close navigation drawer"
            onClick={() => setMobileDrawerOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setMobileDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden"
          />
        )}

        <div
          id="mobile-crm-drawer"
          aria-hidden={!mobileDrawerOpen}
          inert={!mobileDrawerOpen}
          className={`fixed inset-y-0 left-0 z-50 w-[275px] max-w-[85vw] transform bg-[#0F2342] shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
            mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onHide={() => setMobileDrawerOpen(false)} />
        </div>

        {/* ======================================================== */}
        {/* 3. MAIN CONTENT AREA                                      */}
        {/* ======================================================== */}
        <main className="min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 pb-28 sm:pb-12 lg:pb-8">
          {children}
        </main>

        {/* ======================================================== */}
        {/* 4. MOBILE BOTTOM NAVIGATION BAR (< 1024px)                */}
        {/* ======================================================== */}
        <nav
          aria-label="Mobile Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur-md lg:hidden"
        >
          <div className="flex items-center justify-around">
            {/* Dashboard Tab */}
            <Link
              href={dashboardHref}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isDashboardActive
                  ? "text-[#1565d8] font-bold scale-105"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="mt-1 text-[10px] tracking-tight">{t("mobile.home", "Home")}</span>
            </Link>

            {/* Companies Tab */}
            <Link
              href="/dashboard/company-list"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isCompaniesActive
                  ? "text-[#1565d8] font-bold scale-105"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span className="mt-1 text-[10px] tracking-tight">{t("mobile.companies", "Companies")}</span>
            </Link>

            {/* Schedule Tab */}
            <Link
              href="/dashboard/meeting-schedule"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isScheduleActive
                  ? "text-[#1565d8] font-bold scale-105"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span className="mt-1 text-[10px] tracking-tight">{t("mobile.schedule", "Schedule")}</span>
            </Link>

            {/* Record Conversation / Notes Tab */}
            <Link
              href="/dashboard/record-conversation"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isConversationActive
                  ? "text-[#1565d8] font-bold scale-105"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="mt-1 text-[10px] tracking-tight">{t("mobile.notes", "Notes")}</span>
            </Link>

            {/* All Menu Drawer Toggle */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 active:scale-95 transition-all cursor-pointer"
            >
              <Compass className="h-5 w-5" />
              <span className="mt-1 text-[10px] tracking-tight">{t("nav.menu", "Menu")}</span>
            </button>
          </div>
        </nav>
      </div>
    </SidebarToggleContext.Provider>
  );
}
