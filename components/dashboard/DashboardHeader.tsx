"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Bell, HelpCircle, Check, FileText, ChevronRight, X, Sparkles, Menu } from "lucide-react";

export interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

const routeLabels: Record<string, string> = {
  "sales-executive": "Sales Executive",
  "company-list": "Company List",
  "meeting-schedule": "Meeting Schedule",
  "record-conversation": "Record Conversation",
  "task-of-field-agent": "Monitoring Task of Field Agent",
  "manage-field-agent-account": "Manage Field Agent Account",
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

const DEFAULT_MANAGER_NOTIFS: ManagerNotificationItem[] = [
  {
    id: 'notif-demo-1',
    type: 'need_assistance',
    title: 'Permintaan Bantuan (Need Assistance)',
    message: 'Aida membutuhkan pendampingan customs clearance untuk PT. DSV Transport Indonesia.',
    conversation_id: 'conv-figma-1',
    company_name: 'PT. DSV Transport Indonesia',
    timestamp: 'Baru saja',
    read: false,
  },
  {
    id: 'notif-demo-2',
    type: 'need_assistance',
    title: 'Permintaan Bantuan (Need Assistance)',
    message: 'Wulan membutuhkan asistensi verifikasi kargo untuk PT. Geodis Freight Forwarding.',
    conversation_id: 'conv-figma-3',
    company_name: 'PT. Geodis Freight Forwarding',
    timestamp: '15 menit lalu',
    read: false,
  },
];

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("User");
  const [userRole, setUserRole] = useState("Sales Executive");
  const [notifications, setNotifications] = useState<ManagerNotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement | null>(null);

  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem("andima_manager_notifications");
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        localStorage.setItem("andima_manager_notifications", JSON.stringify(DEFAULT_MANAGER_NOTIFS));
        setNotifications(DEFAULT_MANAGER_NOTIFS);
      }
    } catch {
      setNotifications(DEFAULT_MANAGER_NOTIFS);
    }
  };

  useEffect(() => {
    let active = true;
    const loadUsername = async () => {
      try {
        const savedUser = JSON.parse(localStorage.getItem("andima_user") || "null") as { name?: string; role?: string } | null;
        if (savedUser?.name?.trim()) {
          if (active) {
            setUsername(savedUser.name.trim());
            if (savedUser.role) setUserRole(savedUser.role);
          }
          return;
        }
      } catch {}

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accountName = session?.user.user_metadata?.full_name || session?.user.email?.split("@")[0] || "User";
        if (active) setUsername(accountName);
      } catch {
        if (active) setUsername("User");
      }
    };

    void loadUsername();
    loadNotifications();

    const handleNotifEvent = () => loadNotifications();
    window.addEventListener("andima_notification_update", handleNotifEvent);
    window.addEventListener("storage", handleNotifEvent);

    return () => {
      active = false;
      window.removeEventListener("andima_notification_update", handleNotifEvent);
      window.removeEventListener("storage", handleNotifEvent);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notif: ManagerNotificationItem) => {
    // Mark as read
    const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n);
    setNotifications(updated);
    try {
      localStorage.setItem("andima_manager_notifications", JSON.stringify(updated));
    } catch {}

    setIsNotifOpen(false);

    // Automatically navigate to Record Conversation and pass query param to open detail modal
    const targetUrl = `/dashboard/record-conversation?open_conv_id=${encodeURIComponent(notif.conversation_id)}&need_assist=true`;
    router.push(targetUrl);
  };

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean).slice(1);
    if (!segments.length) return ["Dashboard"];
    if (segments[0] === "task-of-field-agent") return ["CRM", "Sales Executive", "Monitoring Task of Field Agent"];
    const labels = segments.map((segment) => routeLabels[segment] || (segment.includes("-") ? "Details" : segment));
    if (labels[0] !== "Sales Executive" && labels[0] !== "Dashboard") labels.unshift("Sales Executive");
    return ["CRM", ...labels];
  }, [pathname]);

  return (
    <header className="mb-6 flex min-h-10 items-center justify-between gap-3 border-b border-slate-100 pb-4">
      <div className="flex items-center gap-2 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 -ml-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg lg:hidden shrink-0 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
        )}

        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1 text-[11px] sm:text-xs uppercase text-slate-500">
          {breadcrumbs.map((label, index) => (
            <span key={`${label}-${index}`} className={index === breadcrumbs.length - 1 ? "font-medium text-blue-600 truncate" : "hidden sm:inline"}>
              {index > 0 && <span className="px-1 text-slate-300 hidden sm:inline">/</span>}{label}
            </span>
          ))}
        </nav>
      </div>

      {/* Right User Controls & Notification Bell */}
      <div className="flex shrink-0 items-center gap-3">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
            title="Notifikasi Bantuan Manager"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse shadow-2xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Menu Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-amber-400" />
                  <span className="font-bold text-xs">Notifikasi Need Assistance</span>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} baru
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Tidak ada notifikasi permintaan bantuan.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 hover:bg-blue-50/70 transition-colors cursor-pointer flex items-start gap-3 ${
                        !notif.read ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs font-bold text-slate-800 truncate">
                            {notif.title}
                          </h5>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium block mt-1">
                          {notif.timestamp}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 shrink-0 self-center" />
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <span className="text-[10px] text-slate-500 font-medium">
                  Klik notifikasi untuk membuka Detail Conversation dengan status Need Assistance
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200" aria-label={`Signed in as ${username}`}>
          <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700 select-none shadow-2xs">
            {username.slice(0, 1).toUpperCase()}
          </span>
          <div className="flex flex-col">
            <span className="max-w-40 truncate text-xs font-bold text-slate-800 leading-tight">{username}</span>
            <span className="text-[10px] text-slate-400 font-semibold">{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
