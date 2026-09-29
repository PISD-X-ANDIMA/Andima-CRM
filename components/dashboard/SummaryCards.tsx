"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  FileCheck2,
  FileX,
  Users,
} from "lucide-react";
import type { ApiResponse, DashboardSummaryData } from "@/types/customer";

const DEFAULT_DATA: DashboardSummaryData = {
  totalCustomer: 0,
  meetingThisWeek: {
    total: 0,
    completed: 0,
    upcoming: 0,
  },
  unminutedMeetingsCount: 0,
  sentMinutesCount: 0,
};

interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  highlight?: boolean;
}

function buildCards(data: DashboardSummaryData): StatCard[] {
  return [
    {
      label: "Total Customer",
      value: data.totalCustomer,
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Meeting Minggu Ini",
      value: data.meetingThisWeek.total,
      sub: `${data.meetingThisWeek.completed} selesai · ${data.meetingThisWeek.upcoming} akan datang`,
      icon: CalendarCheck,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Belum Ada Notulensi",
      value: data.unminutedMeetingsCount,
      sub: "Meeting sudah lewat",
      icon: FileX,
      iconBg:
        data.unminutedMeetingsCount > 0
          ? "bg-amber-50"
          : "bg-slate-50",
      iconColor:
        data.unminutedMeetingsCount > 0
          ? "text-amber-600"
          : "text-slate-400",
      highlight: data.unminutedMeetingsCount > 0,
    },
    {
      label: "Notulensi Terkirim",
      value: data.sentMinutesCount,
      sub: "Bulan berjalan",
      icon: FileCheck2,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];
}

export function SummaryCards() {
  const [data, setData] = useState<DashboardSummaryData>(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardSummary() {
      try {
        const response = await fetch("/api/v1/dashboard/summary");
        const json: ApiResponse<DashboardSummaryData> =
          await response.json();

        if (!cancelled && json.success && json.data) {
          setData(json.data);
        }
      } catch {
        if (!cancelled) {
          setData(DEFAULT_DATA);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchDashboardSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = buildCards(data);

  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.label}
            className={`flex min-w-0 items-start gap-4 rounded-2xl border bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors ${
              card.highlight
                ? "border-amber-200/80"
                : "border-slate-200/80"
            }`}
          >
            <div
              className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
            >
              <Icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>

            <div className="min-w-0">
              <p className="text-xs leading-tight font-medium text-slate-500">
                {card.label}
              </p>

              {isLoading ? (
                <div className="mt-1.5 h-7 w-12 animate-pulse rounded bg-slate-100" />
              ) : (
                <p
                  className={`mt-0.5 text-2xl leading-none font-bold ${
                    card.highlight ? "text-amber-600" : "text-slate-900"
                  }`}
                >
                  {card.value}
                </p>
              )}

              {card.sub && !isLoading && (
                <p className="mt-1 truncate text-[11px] leading-tight text-slate-400">
                  {card.sub}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}