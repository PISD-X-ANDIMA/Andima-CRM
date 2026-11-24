"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface BackupAlertItem {
  id: string;
  conversation_id: string;
  status: string;
  alerted_at: string | null;
  company_name: string;
  sales_name: string;
  conversation_date: string | null;
  summary: string;
}

const POLL_INTERVAL_MS = 30_000;

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function ManagerBackupBell() {
  const [items, setItems] = useState<BackupAlertItem[]>([]);
  const [isManager, setIsManager] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/record-conversation/alerts", { cache: "no-store" });
      if (response.status === 401 || response.status === 403) {
        setIsManager(false);
        setIsLoading(false);
        return;
      }
      const result = await response.json();
      setIsManager(true);
      setIsLoading(false);
      if (result?.success) {
        setItems(Array.isArray(result.items) ? result.items : []);
        setLoadFailed(false);
      } else {
        setLoadFailed(true);
      }
    } catch {
      setIsLoading(false);
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!isManager) return null;

  const count = items.length;

  return (
    <div ref={containerRef} className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={`Need backup terbuka: ${count || 3}`}
        aria-expanded={isOpen}
        className="relative flex size-8 cursor-pointer items-center justify-center text-slate-500 hover:text-slate-700 transition-colors focus-visible:outline-none"
      >
        <Bell className="h-[18px] w-[18px] text-slate-600" aria-hidden="true" />
        <span className="absolute -top-1 -right-1 grid min-w-4 h-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-xs">
          {count > 0 ? (count > 99 ? "99+" : count) : 3}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-xs font-bold text-slate-800">Need Backup</span>
            <span className="text-[11px] font-medium text-slate-500">{isLoading ? "Memuat" : `${count} terbuka`}</span>
          </div>

          {isLoading ? (
            <div className="space-y-3 px-4 py-4" aria-busy="true">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : loadFailed ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-slate-600">Gagal memuat need backup.</p>
              <button
                type="button"
                onClick={() => { setIsLoading(true); void load(); }}
                className="mt-2 cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Coba lagi
              </button>
            </div>
          ) : count === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-500">Tidak ada need backup terbuka.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/dashboard/record-conversation?open_conv_id=${encodeURIComponent(item.conversation_id)}`}
                    onClick={() => setIsOpen(false)}
                    className="block border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-slate-800">{item.company_name}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {item.sales_name} · {formatDate(item.conversation_date)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {count > 0 && (
            <Link
              href="/dashboard/record-conversation?need_backup=yes"
              onClick={() => setIsOpen(false)}
              className="block border-t border-slate-100 px-4 py-2.5 text-center text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
            >
              Buka semua need backup
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
