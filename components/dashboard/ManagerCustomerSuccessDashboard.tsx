"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useManagerFilter } from "@/lib/hooks/useManagerFilter";

interface SalesExecItem {
  id: string;
  name: string;
  customers: number;
  meetings_this_week: number;
  open_issues: number;
}

interface LatestIssue {
  id: string;
  company_name: string;
  executive_name: string;
  meeting_date: string;
  meeting_time: string;
  badge: string;
}

interface OverviewData {
  total_sales_executives: number;
  total_customers: number;
  meetings_this_week: number;
  need_backup: number;
  sales_executives: SalesExecItem[];
  latest_issues: LatestIssue[];
}

export function ManagerCustomerSuccessDashboard() {
  const router = useRouter();
  const { setSelectedExecutive } = useManagerFilter();

  const [data, setData] = useState<OverviewData>({
    total_sales_executives: 0,
    total_customers: 0,
    meetings_this_week: 0,
    need_backup: 0,
    sales_executives: [],
    latest_issues: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/manager/dashboard/overview", { cache: "no-store" })
      .then((res) => res.json())
      .then((res) => {
        if (active && res.success && res.data) {
          setData(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const handleViewExecutive = (execName: string) => {
    setSelectedExecutive(execName);
    router.push("/dashboard/company-list");
  };

  return (
    <div className="mx-auto w-full max-w-[1360px] pb-12">
      {/* Page Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Manager Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of the whole team. These numbers always cover all Sales Executives, regardless of the selection made in Company List.
        </p>
      </div>

      {/* 4 KPI Cards */}
      <section aria-label="Team KPI Summary" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Sales Executive */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Sales Executive</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {data.total_sales_executives}
          </p>
          <p className="mt-2 text-xs text-slate-400">Active users</p>
        </div>

        {/* Total Customer */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Customer</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {data.total_customers}
          </p>
          <p className="mt-2 text-xs text-slate-400">All Sales Executives</p>
        </div>

        {/* Meetings this week */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <p className="text-xs font-medium text-slate-500">Meetings this week</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {data.meetings_this_week}
          </p>
          <p className="mt-2 text-xs text-slate-400">All Sales Executives</p>
        </div>

        {/* Need Backup */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <p className="text-xs font-medium text-slate-500">Need Backup</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {data.need_backup}
          </p>
          <p className="mt-2 text-xs text-slate-400">Open issues</p>
        </div>
      </section>

      {/* Two Columns: Sales Executives Table & Latest issues needing backup */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Sales Executives Table (7 cols) */}
        <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-7">
          <h2 className="mb-4 text-base font-semibold text-slate-800">
            Sales Executives
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <th scope="col" className="pb-3 pr-4">Name</th>
                  <th scope="col" className="pb-3 px-4 text-center">Customers</th>
                  <th scope="col" className="pb-3 px-4 text-center">Meetings this week</th>
                  <th scope="col" className="pb-3 px-4 text-center">Open issues</th>
                  <th scope="col" className="pb-3 pl-4 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.sales_executives.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                      {loading ? "Memuat data Sales Executive..." : "Belum ada data Sales Executive."}
                    </td>
                  </tr>
                ) : (
                  data.sales_executives.map((exec) => (
                    <tr key={exec.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="py-3.5 pr-4 font-medium text-slate-800">
                        {exec.name}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {exec.customers}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {exec.meetings_this_week}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          exec.open_issues > 0
                            ? "bg-rose-50 text-rose-600"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {exec.open_issues}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewExecutive(exec.name)}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-blue-600"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Latest issues needing backup (5 cols) */}
        <section className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-5">
          <div>
            <h2 className="mb-4 text-base font-semibold text-slate-800">
              Latest issues needing backup
            </h2>

            <div className="space-y-4">
              {data.latest_issues.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
                  {loading ? "Memeriksa data issues..." : "Belum ada issue yang membutuhkan backup (Tabel Squad A2)."}
                </div>
              ) : (
                data.latest_issues.map((issue) => (
                  <div key={issue.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {issue.company_name}
                      </h3>
                      <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                        {issue.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {issue.executive_name} · meeting {issue.meeting_date}, {issue.meeting_time}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-2">
            <Link
              href="/dashboard/record-conversation?need_backup=yes"
              className="inline-flex w-full items-center justify-center rounded-lg border border-blue-600 bg-white py-2 text-xs font-semibold text-blue-600 shadow-2xs transition-colors hover:bg-blue-50"
            >
              See conversation records
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
