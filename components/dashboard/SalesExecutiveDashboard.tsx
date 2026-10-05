"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CalendarDays, ChevronDown, FileText, Search, Sun } from "lucide-react";
import { MOCK_SALES_USER } from "@/lib/supabase/mock-data";
import type { ApiResponse, CustomerListItem, MeetingDay } from "@/types/customer";
import type { SalesExecutiveMetrics } from "@/lib/services/sales-executive-metrics";

interface SalesExecutiveDashboardProps {
  initialCustomers: CustomerListItem[];
  metrics: SalesExecutiveMetrics;
}

interface WeeklyMeeting {
  customer: CustomerListItem;
  date: Date;
  time: string;
}

const meetingDayNumbers: Record<MeetingDay, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

function dateFromDatabase(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function getWeeklyMeetings(customers: CustomerListItem[]): WeeklyMeeting[] {
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  const meetings = customers.flatMap((customer) => {
    const schedule = customer.meetingSchedule;
    if (!schedule) return [];

    let date: Date;
    if (schedule.scheduleType === "one_day") {
      if (!schedule.meetingDate) return [];
      date = dateFromDatabase(schedule.meetingDate);
    } else {
      const offset = (meetingDayNumbers[schedule.meetingDay] + 6) % 7;
      date = new Date(monday);
      date.setDate(monday.getDate() + offset);
    }

    const dayFromMonday = Math.round((date.getTime() - monday.getTime()) / 86_400_000);
    const effectiveStart = schedule.effectiveStartDate
      ? dateFromDatabase(schedule.effectiveStartDate)
      : null;
    if (dayFromMonday < 0 || dayFromMonday > 6 || (effectiveStart && date < effectiveStart)) {
      return [];
    }

    return [{
      customer,
      date,
      time: schedule.startTime?.slice(0, 5) || "09:00",
    }];
  });

  return meetings.sort((a, b) =>
    a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time)
  );
}

export function SalesExecutiveDashboard({ initialCustomers, metrics }: SalesExecutiveDashboardProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const keyword = search.trim();
    if (!keyword) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");
      try {
        const params = new URLSearchParams({ search: keyword, page: "1", perPage: "5" });
        const response = await fetch(`/api/v1/customers?${params}`, {
          signal: controller.signal,
        });
        const result: ApiResponse<CustomerListItem[]> = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.success ? "Customer search failed." : result.message);
        }
        setCustomers(result.data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setSearchError(error instanceof Error ? error.message : "Customer search failed.");
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [initialCustomers, search]);

  const weeklyMeetings = useMemo(
    () => getWeeklyMeetings(initialCustomers).slice(0, 2),
    [initialCustomers]
  );

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <div className="mb-14 flex min-h-9 items-center justify-between gap-6">
        <p className="text-xs text-slate-500">
          CRM <span className="px-1 text-slate-300">/</span>
          <span className="text-blue-600 underline underline-offset-2">SALES EXECUTIVE</span>
        </p>
        <div className="flex items-center gap-4 text-slate-500">
          <Sun aria-label="Display settings" className="hidden h-4 w-4 sm:block" />
          <span aria-label="Notifications" className="relative hidden sm:inline-flex">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </span>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
              {MOCK_SALES_USER.name.slice(0, 1)}
            </span>
            <span className="hidden text-[11px] leading-tight sm:block">
              <span className="block font-semibold text-slate-800">{MOCK_SALES_USER.name}</span>
              <span>{MOCK_SALES_USER.role}</span>
            </span>
            <ChevronDown aria-hidden="true" className="ml-1 h-3 w-3" />
          </div>
        </div>
      </div>

      <h1 className="mb-6 text-4xl font-bold tracking-tight text-black sm:text-5xl">
        Dashboard
      </h1>

      <section aria-label="Key performance indicators" className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[["Total Customers", metrics.totalCustomers], ["Upcoming Meeting", metrics.upcomingMeetings], ["Task", metrics.tasks]].map(([label, value]) => (
          <article key={label} className="min-h-[112px] rounded-[14px] bg-[#102445] px-8 py-3 sm:px-11">
            <h2 className="text-xl font-semibold text-[#b7c1d1] sm:text-2xl">{label}</h2>
            <p className="mt-2 text-3xl font-bold text-white sm:text-4xl">{value}</p>
          </article>
        ))}
      </section>

      <section aria-labelledby="weekly-schedule-title" className="mb-9">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="weekly-schedule-title" className="text-xl font-bold text-[#505050] sm:text-2xl">
            Schedule this week
          </h2>
          <Link
            href="/dashboard/meeting-schedule"
            aria-label="Open Meeting Schedule"
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <CalendarDays className="h-5 w-5" />
          </Link>
        </div>
        <div className="space-y-2.5">
          {weeklyMeetings.length ? weeklyMeetings.map(({ customer, date, time }) => (
            <Link
              key={`${customer.id}-${date.toISOString()}`}
              href={`/dashboard/company-list/${customer.id}`}
              className="flex min-h-[70px] items-center justify-between gap-5 rounded-2xl border border-[#d0d0d0] px-4 py-4 text-[#555] transition-colors hover:border-blue-300 sm:px-5"
            >
              <span className="truncate text-lg font-semibold sm:text-2xl">{customer.companyName}</span>
              <span className="shrink-0 text-sm sm:text-xl">
                {date.toLocaleDateString("en-US", { weekday: "long" })}, {time}
              </span>
            </Link>
          )) : (
            <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-6 text-sm text-slate-500">
              No meeting scheduled this week.
            </div>
          )}
        </div>
      </section>

      <div className="relative mb-9">
        <Search aria-hidden="true" className="absolute left-8 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={search}
          onChange={(event) => {
            const value = event.target.value;
            setSearch(value);
            if (!value.trim()) {
              setCustomers(initialCustomers);
              setSearchError("");
              setIsSearching(false);
            }
          }}
          placeholder="Search Company or PIC"
          aria-label="Search company or PIC"
          className="h-[52px] w-full rounded-full border border-[#bdbdbd] bg-white pl-16 pr-5 text-base font-medium text-slate-700 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-lg"
        />
      </div>

      <section aria-label="Recent transactions" className="overflow-x-auto rounded-lg border border-[#d0d0d0]">
        <table className="w-full min-w-[850px] table-fixed text-left">
          <thead className="bg-[#edf4f8] text-[#333]">
            <tr>
              <th className="w-[24%] px-5 py-6 text-center text-lg font-semibold sm:text-2xl">Transaction ID</th>
              <th className="w-[21%] px-5 py-6 text-center text-lg font-semibold sm:text-2xl">Job Number</th>
              <th className="w-[22%] px-5 py-6 text-center text-lg font-semibold sm:text-2xl">Company</th>
              <th className="w-[14%] px-5 py-6 text-center text-lg font-semibold sm:text-2xl">PIC</th>
              <th className="w-[19%] px-5 py-6 text-center text-lg font-semibold sm:text-2xl">Detail</th>
            </tr>
          </thead>
          <tbody className="text-[#383838]">
            {customers.slice(0, 5).map((customer) => (
              <tr key={customer.id} className="border-t border-[#d0d0d0]">
                <td className="px-5 py-5 text-center text-base sm:text-xl">{customer.transactionNo || "—"}</td>
                <td className="break-words px-5 py-5 text-center text-base sm:text-xl">{customer.jobNumber || "—"}</td>
                <td className="px-5 py-3 text-base leading-tight sm:text-xl">{customer.companyName}</td>
                <td className="px-5 py-5 text-center text-base sm:text-xl">{customer.primaryPic?.fullName || "—"}</td>
                <td className="px-5 py-5 text-center">
                  <Link href={`/dashboard/company-list/${customer.id}`} className="text-base text-blue-600 underline underline-offset-2 sm:text-lg">
                    See more...
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {searchError ? (
          <div role="alert" className="border-t border-slate-200 p-6 text-center text-sm text-red-700">{searchError}</div>
        ) : customers.length === 0 ? (
          <div className="border-t border-slate-200 p-8 text-center text-slate-500">
            <FileText className="mx-auto mb-2 h-5 w-5" />
            {search ? "No customer or PIC found." : "No transaction data available."}
          </div>
        ) : null}
        {isSearching && <p className="sr-only" role="status">Searching customers</p>}
      </section>
    </div>
  );
}
