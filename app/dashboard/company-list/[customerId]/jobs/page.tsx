import Link from "next/link";
import { ArrowLeft, Briefcase, CheckCircle2, Clock, Calendar } from "lucide-react";
import { getCustomerById } from "@/lib/services/customer-service";

interface PageProps {
  params: Promise<{ customerId: string }>;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  in_progress: { label: "In Progress", cls: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  pending: { label: "Pending", cls: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  cancelled: { label: "Canceled", cls: "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" },
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function CustomerJobsPage({ params }: PageProps) {
  const { customerId } = await params;
  const customer = await getCustomerById(customerId);

  if (!customer) return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-8">
      <Link href="/dashboard/company-list" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
        ← Back to Company List
      </Link>
      <h1 className="mt-5 text-2xl font-bold text-slate-900 dark:text-slate-100">Job data unavailable</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">Customer ID: {customerId}. Customer details could not be loaded.</p>
    </section>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/dashboard/company-list" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
          Company List
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/company-list/${customerId}`}
          className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          {customer.companyName}
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-100 font-semibold">Jobs</span>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Jobs for — {customer.companyName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {customer.jobs.length} jobs recorded
            </p>
          </div>
        </div>

        <Link
          href={`/dashboard/company-list/${customerId}`}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customer Details</span>
        </Link>
      </div>

      {/* Info Notice */}
      <div className="bg-slate-900 dark:bg-[#0b1324] border border-slate-800 text-white rounded-2xl p-5 shadow-2xs">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm text-white">Read-Only View</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              This job list is read-only in the Sales Executive module. Job status changes are managed by the operations team.
            </p>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Job History</h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">{customer.jobs.length} job</span>
        </div>

        {customer.jobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No jobs yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Jobs and assignments for this customer will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800">
                <tr>
                  {["NO", "JOB NO", "TITLE", "STATUS", "SCHEDULED DATE", "CREATED DATE"].map(
                    (h, i) => (
                      <th
                        key={i}
                        className="py-3 px-5 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {customer.jobs.map((job, idx) => {
                  const status = STATUS_MAP[job.status] || {
                    label: job.status,
                    cls: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
                  };
                  return (
                    <tr key={job.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3.5 px-5 text-sm text-slate-400 dark:text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-mono text-[12px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded">
                          {job.jobNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="text-slate-800 dark:text-slate-200 text-xs font-medium">{job.title}</p>
                        {job.transactionNo && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
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
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(job.scheduledDate)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-xs text-slate-400 dark:text-slate-500">
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
