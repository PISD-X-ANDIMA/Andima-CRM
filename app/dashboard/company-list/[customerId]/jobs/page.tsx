import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, CheckCircle2, Clock, Calendar } from "lucide-react";
import { getCustomerById } from "@/lib/services/customer-service";

interface PageProps {
  params: Promise<{ customerId: string }>;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  completed: { label: "Selesai", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "Berlangsung", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  pending: { label: "Menunggu", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  cancelled: { label: "Dibatalkan", cls: "bg-red-50 text-red-700 border-red-200" },
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function CustomerJobsPage({ params }: PageProps) {
  const { customerId } = await params;
  const customer = await getCustomerById(customerId);

  if (!customer) notFound();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/dashboard/company-list" className="hover:text-slate-800 transition-colors">
          Company List
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/company-list/${customerId}`}
          className="hover:text-slate-800 transition-colors"
        >
          {customer.companyName}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Jobs</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Daftar Job — {customer.companyName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {customer.jobs.length} penugasan tercatat
            </p>
          </div>
        </div>

        <Link
          href={`/dashboard/company-list/${customerId}`}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ke Detail Customer</span>
        </Link>
      </div>

      {/* Info Notice */}
      <div className="bg-slate-900 text-white rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm text-white">Mode Read-Only</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Daftar job bersifat read-only dari modul Sales Executive. Perubahan status job dikelola oleh tim operasional.
            </p>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Riwayat Penugasan</h2>
          <span className="text-xs text-slate-400">{customer.jobs.length} job</span>
        </div>

        {customer.jobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Belum ada penugasan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Job dan penugasan untuk customer ini akan muncul di sini secara otomatis.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100">
                <tr>
                  {["NO", "JOB NO", "JUDUL", "STATUS", "TANGGAL DIJADWALKAN", "TANGGAL DIBUAT"].map(
                    (h, i) => (
                      <th
                        key={i}
                        className="py-3 px-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customer.jobs.map((job, idx) => {
                  const status = STATUS_MAP[job.status] || {
                    label: job.status,
                    cls: "bg-slate-100 text-slate-600 border-slate-200",
                  };
                  return (
                    <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 text-sm text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-mono text-[12px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {job.jobNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="text-slate-800 text-xs font-medium">{job.title}</p>
                        {job.transactionNo && (
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {job.transactionNo}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${status.cls}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(job.scheduledDate)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-xs text-slate-400">
                          {formatDate(job.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
