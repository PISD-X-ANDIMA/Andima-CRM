"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { ApiResponse, CustomerListItem } from "@/types/customer";

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = Array.from({ length: 10 }, (_, index) => 8 + index);
const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function MeetingSchedulePage() {
  const [month, setMonth] = useState(() => new Date(2026, 9, 1));
  const [selected, setSelected] = useState("2026-10-07");
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slotToBook, setSlotToBook] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/customers?perPage=100");
      const result: ApiResponse<CustomerListItem[]> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Failed to load the schedule." : result.message);
      setCustomers(result.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load the schedule.");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const calendarDays = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = start.getDay();
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), index - offset + 1));
  }, [month]);

  const selectedDate = new Date(`${selected}T00:00:00`);
  const agenda = customers.flatMap((customer) => {
    const meeting = customer.meetingSchedule;
    if (!meeting) return [];
    const isScheduled = meeting.scheduleType === "one_day"
      ? meeting.meetingDate === selected
      : meeting.meetingDay === dayKeys[selectedDate.getDay()];
    return isScheduled ? [{ customer, meeting }] : [];
  });

  async function saveMeeting(formData: FormData) {
    const companyId = String(formData.get("companyId") || "");
    const startTime = slotToBook || String(formData.get("startTime") || "09:00");
    const endHour = Math.min(Number(startTime.slice(0, 2)) + 1, 23);
    const endTime = `${String(endHour).padStart(2, "0")}:${startTime.slice(3, 5)}`;
    const scheduleType = String(formData.get("scheduleType") || "one_day");
    setSaving(true);
    setMutationError("");
    try {
      const response = await fetch(`/api/v1/customers/${companyId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_day: dayKeys[selectedDate.getDay()],
          schedule_type: scheduleType,
          meeting_date: scheduleType === "one_day" ? selected : null,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
        }),
      });
      const result: ApiResponse<{ meetingId: string }> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Failed to save the meeting." : result.message);
      setSlotToBook(null);
      await load();
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : "Failed to save the meeting.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h1>
          <p className="mt-1 text-lg text-slate-500">Meeting schedule and availability for this date</p>
        </div>
        <button onClick={() => setSlotToBook("09:00")} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"><Plus className="h-5 w-5" />Add Meeting</button>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(350px,0.8fr)_minmax(500px,1.2fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-7 flex items-center justify-between">
            <button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded p-2 text-slate-400 hover:bg-slate-100"><ChevronLeft /></button>
            <h2 className="text-2xl font-semibold text-slate-900">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
            <button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded p-2 text-slate-400 hover:bg-slate-100"><ChevronRight /></button>
          </div>
          <div className="grid grid-cols-7 gap-y-3 text-center">
            {weekdayNames.map((day) => <span key={day} className="pb-2 text-sm font-medium text-slate-600">{day}</span>)}
            {calendarDays.map((date) => {
              const key = dateKey(date);
              const inMonth = date.getMonth() === month.getMonth();
              const hasMeeting = customers.some(({ meetingSchedule: m }) => m && (m.scheduleType === "one_day" ? m.meetingDate === key : m.meetingDay === dayKeys[date.getDay()]));
              return <button key={key} onClick={() => setSelected(key)} className={`mx-auto grid h-10 w-10 place-items-center rounded-full text-sm ${!inMonth ? "text-slate-300" : "text-slate-700 hover:bg-blue-50"} ${key === selected ? "bg-blue-600 font-semibold text-white hover:bg-blue-700" : ""}`} aria-pressed={key === selected}>
                <span>{date.getDate()}</span>{hasMeeting && key !== selected && <span className="absolute mt-7 h-1 w-1 rounded-full bg-blue-500" />}
              </button>;
            })}
          </div>
        </section>

        <section className="space-y-3">
          {loading ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading schedule...</div> : error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{error}<button className="ml-3 underline" onClick={() => void load()}>Try again</button></div> : agenda.length > 0 ? agenda.map(({ customer, meeting }) => <Link key={meeting.id} href={`/dashboard/company-list/${customer.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700 hover:border-blue-300"><span className="flex items-center gap-4"><i className="h-3 w-3 rounded-full bg-blue-500" /><span className="font-medium">{customer.companyName}</span></span><span className="text-slate-500">{meeting.startTime?.slice(0, 5)}–{meeting.endTime?.slice(0, 5)}</span></Link>) : <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center"><p className="font-medium text-slate-600">No meeting scheduled</p><p className="mt-1 text-sm text-slate-500">Choose another date or add a schedule from the Company List.</p></div>}
          {!loading && !error && hours.map((hour) => <div key={hour} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-slate-500"><span className="flex items-center gap-4"><i className="h-3 w-3 rounded-full bg-slate-400" />Available</span><span>{String(hour).padStart(2, "0")}:00–{String(hour + 1).padStart(2, "0")}:00</span><button onClick={() => setSlotToBook(`${String(hour).padStart(2, "0")}:00`)} className="rounded-lg border border-blue-400 px-3 py-1 text-sm font-semibold text-blue-600">+Add</button></div>)}
        </section>
      </div>
      {slotToBook && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><form action={saveMeeting} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"><div><h2 className="text-xl font-bold text-slate-900">Add Meeting</h2><p className="mt-1 text-sm text-slate-500">{selectedDate.toLocaleDateString("en-GB")} · {slotToBook}</p></div><label className="block text-sm font-medium text-slate-700">Company<select required name="companyId" defaultValue="" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5"><option value="" disabled>Select a company</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.companyName}</option>)}</select></label><input type="hidden" name="startTime" value={slotToBook} /><label className="block text-sm font-medium text-slate-700">Schedule Type<select name="scheduleType" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5"><option value="one_day">One day</option><option value="weekly">Weekly</option></select></label>{mutationError && <p role="alert" className="text-sm text-red-600">{mutationError}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={() => setSlotToBook(null)} className="rounded-lg border px-4 py-2 text-slate-600">Cancel</button><button disabled={saving || customers.length === 0} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save Meeting"}</button></div></form></div>}
    </div>
  );
}
