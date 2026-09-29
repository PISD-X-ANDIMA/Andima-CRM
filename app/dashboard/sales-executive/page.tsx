import { SummaryCards } from "@/components/dashboard/SummaryCards";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  Plus,
} from "lucide-react";
import Link from "next/link";

const upcomingMeetings = [
  {
    id: "1",
    company: "PT. YOSSAVA TRANS LOGISTIK",
    contact: "Siti Rahma",
    date: "Hari ini, 10.00",
    type: "Meeting Customer",
    status: "Akan datang",
  },
  {
    id: "2",
    company: "PT. SAMUDERA BAHARI LOGISTIK",
    contact: "Rian Pratama",
    date: "Besok, 13.30",
    type: "Meeting Customer",
    status: "Akan datang",
  },
  {
    id: "3",
    company: "PT. SINAR SURYA EXPRESS",
    contact: "Farhan Maulana",
    date: "Jumat, 09.00",
    type: "Meeting Customer",
    status: "Akan datang",
  },
];

const pendingMinutes = [
  {
    id: "1",
    company: "PT. CITRA MANDIRI CARGO",
    date: "Senin, 08 September 2026",
    contact: "Melisa Anggraeni",
  },
  {
    id: "2",
    company: "PT. PRIMA ANUGERAH TRANSINDO",
    date: "Selasa, 09 September 2026",
    contact: "Rina Marlina",
  },
];

export default function SalesExecutiveDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-7">
      <section className="flex items-start justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-slate-500">
            CRM / Sales Executive
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Sales Executive Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Pantau customer, jadwal meeting, dan status notulensi Anda.
          </p>
        </div>

        <Link
          href="/dashboard/company-list"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Customer
        </Link>
      </section>

      <SummaryCards />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Jadwal Meeting Terdekat
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Agenda meeting customer yang akan datang.
              </p>
            </div>

            <Link
              href="/dashboard/meeting-schedule"
              className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Lihat semua
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {upcomingMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CalendarDays className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {meeting.company}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {meeting.contact} · {meeting.type}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium text-slate-700">
                    {meeting.date}
                  </p>

                  <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                    {meeting.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Perlu Notulensi
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Meeting selesai tanpa notulensi.
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {pendingMinutes.map((minute) => (
              <Link
                key={minute.id}
                href="/dashboard/record-conversation"
                className="block rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-amber-200 hover:bg-amber-50/40"
              >
                <p className="truncate text-sm font-semibold text-slate-800">
                  {minute.company}
                </p>

                <p className="mt-1 truncate text-xs text-slate-500">
                  {minute.contact}
                </p>

                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                  <Clock3 className="h-3.5 w-3.5" />
                  {minute.date}
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/dashboard/record-conversation"
            className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Kelola Notulensi
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}