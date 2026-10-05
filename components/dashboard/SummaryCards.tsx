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
      label: "Total Customers",
      value: data.totalCustomer,
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Meetings This Week",
      value: data.meetingThisWeek.total,
      sub: `${data.meetingThisWeek.completed} completed · ${data.meetingThisWeek.upcoming} upcoming`,
      icon: CalendarCheck,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Missing Meeting Notes",
      value: data.unminutedMeetingsCount,
      sub: "Meetings that have ended",
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
      label: "Notes Sent",
      value: data.sentMinutesCount,
      sub: "This month",
      icon: FileCheck2,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
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
            className={`flex min-w-0 flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm transition-colors ${
              card.highlight
                ? "border-amber-200/80"
                : "border-slate-200/80"
            }`}
          >
            <div className="flex items-start justify-between">
              <p className="text-[15px] font-semibold text-slate-700">
                {card.label}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon className={`h-[22px] w-[22px] ${card.iconColor}`} />
              </div>

              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-slate-100" />
              ) : (
                <div className="flex flex-col justify-center">
                  <p
                    className={`text-3xl leading-none font-bold ${
                      card.highlight ? "text-amber-600" : "text-slate-900"
                    }`}
                  >
                    {card.value}
                  </p>
                </div>
              )}
            </div>
            {card.sub && !isLoading && (
              <p className="truncate text-[11px] leading-tight text-slate-400">
                {card.sub}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
