import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Calendar,
  Briefcase,
  Clock,
  CheckCircle2,
  User,
} from "lucide-react";
import { getCustomerById } from "@/lib/services/customer-service";

interface PageProps {
  params: Promise<{ customerId: string }>;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { customerId } = await params;
  const customer = await getCustomerById(customerId);

  if (!customer) return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-8">
      <Link href="/dashboard/company-list" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
        ← Back to Company List
      </Link>
      <h1 className="mt-5 text-2xl font-bold text-slate-900 dark:text-slate-100">Customer data unavailable</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">Customer {customerId} could not be found or loaded.</p>
      <Link href={`/dashboard/company-list/${customerId}/jobs`} className="mt-5 inline-block text-blue-600 dark:text-blue-400 font-medium">
        View Jobs
      </Link>
    </section>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back */}
      <div>
        <Link
          href="/dashboard/company-list"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Company List</span>
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {customer.companyName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Active
              </span>
            </div>
            {customer.address && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {customer.address}
              </p>
            )}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
              ID: {customer.id}
            </p>
          </div>
        </div>

        <Link
          href={`/dashboard/company-list/${customerId}/jobs`}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-2xs cursor-pointer"
        >
          <Briefcase className="w-4 h-4" />
          <span>View Customer Jobs</span>
        </Link>
      </div>

      {/* 3-column overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Company Info */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Company Profile</span>
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Company Name</dt>
              <dd className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {customer.companyName}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Address</dt>
              <dd className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                {customer.address || <span className="text-slate-400 italic">Not provided</span>}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Registered Since</dt>
              <dd className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{formatDate(customer.createdAt)}</dd>
            </div>
          </dl>
        </div>

        {/* Contact PIC */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Company PIC</span>
          </div>
          {!customer.primaryPic ? (
            <p className="text-xs text-slate-400 italic">No PIC recorded</p>
          ) : (
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {customer.primaryPic.fullName}
                    </p>
                    {customer.primaryPic.phoneNumber && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{customer.primaryPic.phoneNumber}</p>
                    )}
                  </div>
                </div>
              </li>
            </ul>
          )}
        </div>

        {/* Meeting Schedule */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Meeting Schedule</span>
          </div>
          {customer.meetings.length ? (
            <div className="space-y-2.5">
              {customer.meetings.map((meeting) => (
                <div key={meeting.id} className="rounded-xl border border-purple-100 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-950/30 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{meeting.status || "Scheduled"}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-purple-800 dark:text-purple-300">{meeting.formattedSchedule}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400">
                    <Clock className="h-3 w-3" />
                    {meeting.startTime.slice(0, 5)} – {meeting.endTime.slice(0, 5)}
                  </p>
                  {meeting.agenda && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{meeting.agenda}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No meeting schedule yet</p>
          )}
        </div>
      </div>

      {/* Jobs are owned by a separate source system and are not part of confirmed A1 data. */}
      {customer.jobs.length > 0 && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Job / Task ({customer.jobs.length})</span>
            </div>
            <Link
              href={`/dashboard/company-list/${customerId}/jobs`}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-2.5 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Job No
                  </th>
                  <th className="pb-2.5 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="pb-2.5 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="pb-2.5 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {customer.jobs.slice(0, 5).map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="font-mono text-[12px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded">
                        {job.jobNumber}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-slate-800 dark:text-slate-200 text-xs">{job.title}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          job.status === "completed"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : job.status === "in_progress"
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(job.scheduledDate || job.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
