"use client";

import { Briefcase, CheckCircle2, Clock, MapPin, Search, FileText } from "lucide-react";
import type { FieldAgentMetrics, FieldAgentTaskItem } from "../types/field-agent";

interface FieldAgentDashboardProps {
  metrics?: FieldAgentMetrics;
  tasks?: FieldAgentTaskItem[];
}

export function FieldAgentDashboard({
  metrics = { assignedTasks: 0, completedTasks: 0, pendingReports: 0 },
  tasks = [],
}: FieldAgentDashboardProps) {
  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      {/* Header Greeting */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Field Agent Dashboard
        </h1>
        <p className="mt-1 text-base text-slate-500">
          Selamat datang di modul operasional lapangan. Kelola tugas worksheet dan laporan kunjungan Anda di sini.
        </p>
      </div>

      {/* KPI Cards untuk Field Agent */}
      <section aria-label="Ringkasan Kinerja Lapangan" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="flex min-h-[110px] items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-500">Tugas Ditugaskan</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{metrics.assignedTasks}</p>
            <span className="text-xs text-blue-600 font-medium">Worksheet Aktif</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Briefcase className="h-6 w-6" />
          </div>
        </article>

        <article className="flex min-h-[110px] items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-500">Tugas Selesai</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{metrics.completedTasks}</p>
            <span className="text-xs text-emerald-600 font-medium">Kunjungan Tuntas</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </article>

        <article className="flex min-h-[110px] items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-500">Menunggu Laporan</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{metrics.pendingReports}</p>
            <span className="text-xs text-amber-600 font-medium">Perlu Dibuat</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </article>
      </section>

      {/* Main Workspace Area (Clean Starter Template untuk Squad A3) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Daftar Tugas Kunjungan Lapangan</h2>
            <p className="text-xs text-slate-500">Tugas yang dialokasikan dari tim CRM / Sales Executive</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tugas atau lokasi..."
              className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {tasks.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <div key={task.id} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{task.title}</h3>
                  <p className="text-xs text-slate-500">{task.customerName}</p>
                  {task.companyAddress && (
                    <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {task.companyAddress}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Buka Form Tugas
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3 font-semibold text-base">
              A3
            </div>
            <h3 className="text-base font-semibold text-slate-800">Area Modul Lapangan Squad A3</h3>
            <p className="mt-1 max-w-md mx-auto text-xs text-slate-500">
              Template ini siap dikembangkan oleh tim Squad A3 untuk menampilkan daftar tugas, form laporan inspeksi, foto kunjungan, dan integrasi worksheet lapangan.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
