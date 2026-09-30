import Link from "next/link";
import { CalendarDays, FileText, Plus } from "lucide-react";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { getCustomers } from "@/lib/services/customer-service";

export default async function SalesExecutiveDashboardPage() {
  let customers: Awaited<ReturnType<typeof getCustomers>>["customers"] = [];
  try {
    customers = (await getCustomers({ perPage: 5 })).customers;
  } catch {
    // The dashboard still renders if customer data is temporarily unavailable.
  }
  return <div className="mx-auto w-full max-w-[1440px] space-y-7">
    <header className="flex items-start justify-between gap-5"><div><p className="text-sm text-slate-500">CRM / <span className="text-blue-600 underline">Sales Executive</span></p><h1 className="mt-14 text-4xl font-bold tracking-tight text-slate-950">Dashboard</h1></div><Link href="/dashboard/company-list" className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"><Plus className="h-4 w-4" />Add Company</Link></header>
    <SummaryCards />
    <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-700">Schedule this week</h2><Link className="rounded-lg border border-slate-200 p-2 text-slate-600" href="/dashboard/meeting-schedule" aria-label="Open Meeting Schedule"><CalendarDays className="h-5 w-5" /></Link></div><div className="space-y-2">{customers.filter((c) => c.meetingSchedule).slice(0, 2).map((c) => <Link key={c.id} href={`/dashboard/company-list/${c.id}`} className="flex justify-between rounded-xl border border-slate-300 px-5 py-4 text-slate-700"><span className="font-semibold">{c.companyName}</span><span>{c.meetingSchedule?.formattedSchedule}</span></Link>)}{customers.every((c) => !c.meetingSchedule) && <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No meeting schedules yet.</div>}</div></section>
    <section><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold text-slate-700">Recent Companies</h2><Link href="/dashboard/company-list" className="text-sm text-blue-600">View Company List</Link></div><div className="overflow-x-auto rounded-lg border border-slate-300"><table className="w-full min-w-[640px] text-left"><thead className="bg-[#edf4f8]"><tr>{["Transaction ID", "Job Number", "Company", "PIC", "Details"].map((heading) => <th key={heading} className="px-4 py-4 font-semibold text-slate-700">{heading}</th>)}</tr></thead><tbody>{customers.map((customer) => <tr key={customer.id} className="border-t border-slate-300 text-slate-700"><td className="px-4 py-4">{customer.transactionNo || "—"}</td><td className="px-4 py-4">{customer.jobNumber || "—"}</td><td className="px-4 py-4">{customer.companyName}</td><td className="px-4 py-4">{customer.primaryPic?.fullName || "—"}</td><td className="px-4 py-4"><Link href={`/dashboard/company-list/${customer.id}`} className="text-blue-600 underline">See more...</Link></td></tr>)}</tbody></table>{customers.length === 0 && <div className="p-8 text-center text-slate-500"><FileText className="mx-auto mb-2 h-5 w-5" />No company data yet.</div>}</div></section>
  </div>;
}
