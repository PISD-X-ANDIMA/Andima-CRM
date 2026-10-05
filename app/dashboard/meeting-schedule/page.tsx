"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import type { ApiResponse, CustomerListItem } from "@/types/customer";

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = Array.from({ length: 10 }, (_, index) => 8 + index);
const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

export default function MeetingSchedulePage() {
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => dateKey(new Date()));
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slotToBook, setSlotToBook] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState<{ customer: CustomerListItem; meeting: NonNullable<CustomerListItem["meetingSchedule"]> } | null>(null);
  const [editingMeeting, setEditingMeeting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/v1/customers?perPage=100");
      const result: ApiResponse<CustomerListItem[]> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Failed to load the schedule." : result.message);
      setCustomers(result.data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to load the schedule."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const calendarDays = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), index - start.getDay() + 1));
  }, [month]);
  const selectedDate = new Date(`${selected}T00:00:00`);
  const agenda = customers.flatMap((customer) => {
    const meeting = customer.meetingSchedule;
    if (!meeting || (meeting.effectiveStartDate && selected < meeting.effectiveStartDate)) return [];
    const isScheduled = meeting.scheduleType === "one_day" ? meeting.meetingDate === selected : meeting.meetingDay === dayKeys[selectedDate.getDay()];
    return isScheduled ? [{ customer, meeting }] : [];
  }).sort((a, b) => (a.meeting.startTime || "").localeCompare(b.meeting.startTime || ""));

  async function saveMeeting(formData: FormData) {
    const companyId = String(formData.get("companyId") || "");
    const startTime = slotToBook || "09:00";
    const endHour = Math.min(Number(startTime.slice(0, 2)) + 1, 23);
    const endTime = `${String(endHour).padStart(2, "0")}:${startTime.slice(3, 5)}`;
    const scheduleType = String(formData.get("scheduleType") || "one_day");
    setSaving(true); setMutationError("");
    try {
      const response = await fetch(`/api/v1/customers/${companyId}/meetings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ meeting_day: dayKeys[selectedDate.getDay()], schedule_type: scheduleType, meeting_date: scheduleType === "one_day" ? selected : null, start_time: `${startTime}:00`, end_time: `${endTime}:00` }) });
      const result: ApiResponse<{ meetingId: string }> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Failed to save the meeting." : result.message);
      setSlotToBook(null); await load();
    } catch (cause) { setMutationError(cause instanceof Error ? cause.message : "Failed to save the meeting."); }
    finally { setSaving(false); }
  }

  async function updateSelectedMeeting(formData: FormData) {
    if (!selectedMeeting) return;
    const date = String(formData.get("meetingDate") || selected);
    const startTime = String(formData.get("startTime") || "09:00");
    const endTime = String(formData.get("endTime") || "10:00");
    const scheduleType = String(formData.get("scheduleType") || selectedMeeting.meeting.scheduleType);
    const dateParts = date.split("-").map(Number);
    const weekday = dayKeys[new Date(dateParts[0], dateParts[1] - 1, dateParts[2]).getDay()];
    setSaving(true); setMutationError("");
    try {
      const response = await fetch(`/api/v1/customers/${selectedMeeting.customer.id}/meetings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: selectedMeeting.meeting.id, meeting_day: weekday, schedule_type: scheduleType, meeting_date: scheduleType === "one_day" ? date : null, start_time: `${startTime}:00`, end_time: `${endTime}:00` }),
      });
      const result: ApiResponse<{ meetingId: string }> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Failed to update the meeting." : result.message);
      setSelected(date); setEditingMeeting(false); setSelectedMeeting(null); await load();
    } catch (cause) { setMutationError(cause instanceof Error ? cause.message : "Failed to update the meeting."); }
    finally { setSaving(false); }
  }

  async function deleteSelectedMeeting() {
    if (!selectedMeeting || !window.confirm("Delete this meeting schedule?")) return;
    setSaving(true); setMutationError("");
    try {
      const response = await fetch(`/api/v1/customers/${selectedMeeting.customer.id}/meetings`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ meetingId: selectedMeeting.meeting.id }) });
      const result: ApiResponse<{ meetingId: string }> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Failed to delete the meeting." : result.message);
      setSelectedMeeting(null); setEditingMeeting(false); await load();
    } catch (cause) { setMutationError(cause instanceof Error ? cause.message : "Failed to delete the meeting."); }
    finally { setSaving(false); }
  }

  const formatDate = (date: Date) => date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const meetingAtHour = (hour: number) => agenda.filter(({ meeting }) => {
    const start = Number(meeting.startTime?.slice(0, 2)) * 60 + Number(meeting.startTime?.slice(3, 5));
    const end = Number(meeting.endTime?.slice(0, 2)) * 60 + Number(meeting.endTime?.slice(3, 5));
    return start < (hour + 1) * 60 && end > hour * 60;
  });

  return <div className="space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-3xl font-bold tracking-tight text-black">{formatDate(selectedDate)}</h1><p className="mt-1 text-lg text-slate-500">Meeting schedule and availability for this date</p></div><button onClick={() => setSlotToBook("09:00")} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-700"><Plus className="h-5 w-5" />Add Meeting</button></header>
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(350px,0.76fr)_minmax(500px,1.24fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-7"><div className="mb-7 flex items-center justify-between"><button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded p-2 text-slate-400 hover:bg-slate-100"><ChevronLeft className="h-7 w-7" /></button><h2 className="text-2xl font-semibold text-slate-950">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2><button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded p-2 text-slate-400 hover:bg-slate-100"><ChevronRight className="h-7 w-7" /></button></div>
        <div className="grid grid-cols-7 gap-y-3 text-center">{weekdayNames.map((day) => <span key={day} className="pb-2 text-sm font-medium text-slate-600">{day}</span>)}{calendarDays.map((date) => { const key = dateKey(date); const inMonth = date.getMonth() === month.getMonth(); const hasMeeting = customers.some(({ meetingSchedule: meeting }) => meeting && (meeting.scheduleType === "one_day" ? meeting.meetingDate === key : meeting.meetingDay === dayKeys[date.getDay()])); return <button key={key} onClick={() => setSelected(key)} className={`relative mx-auto grid h-10 w-10 place-items-center rounded-full text-sm ${!inMonth ? "text-slate-300" : "text-slate-700 hover:bg-blue-50"} ${key === selected ? "bg-blue-600 font-semibold text-white hover:bg-blue-700" : ""}`} aria-pressed={key === selected}><span>{date.getDate()}</span>{hasMeeting && key !== selected && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-blue-500" />}</button>; })}</div>
      </section>
      <section className="space-y-3">
        {loading ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading schedule...</div> : error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{error}<button className="ml-3 underline" onClick={() => void load()}>Try again</button></div> : null}
        {!loading && !error && agenda.length === 0 && <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-slate-500">No meetings are scheduled for this date.</div>}
        {!loading && !error && hours.map((hour) => {
          const slotMeetings = meetingAtHour(hour);
          return slotMeetings.length ? slotMeetings.map(({ customer, meeting }) => <button key={`${meeting.id}-${hour}`} type="button" onClick={() => { setSelectedMeeting({ customer, meeting }); setEditingMeeting(false); setMutationError(""); }} className="flex min-h-[70px] w-full items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/60 px-5 py-4 text-left text-slate-700 hover:border-blue-400"><span className="flex items-center gap-4"><i className="h-3 w-3 shrink-0 rounded-full bg-blue-500" /><span className="font-medium">{customer.companyName}<small className="ml-2 text-slate-500">Scheduled · View details</small></span></span><span className="whitespace-nowrap text-slate-600">{meeting.startTime?.slice(0, 5)}–{meeting.endTime?.slice(0, 5)}</span></button>) : <div key={hour} className="flex min-h-[70px] items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-slate-500"><span className="flex items-center gap-4"><i className="h-3 w-3 rounded-full bg-slate-400" />Available</span><span className="whitespace-nowrap">{String(hour).padStart(2, "0")}:00–{String(hour + 1).padStart(2, "0")}:00</span><button onClick={() => setSlotToBook(`${String(hour).padStart(2, "0")}:00`)} className="rounded-lg border border-blue-400 px-3 py-1 text-sm font-semibold text-blue-600 hover:bg-blue-50">+Add</button></div>;
        })}
      </section>
    </div>
    {slotToBook && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><form action={saveMeeting} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-bold text-slate-900">Add Meeting</h2><p className="mt-1 text-sm text-slate-500">{formatDate(selectedDate)} · {slotToBook}</p></div><button type="button" aria-label="Close" onClick={() => setSlotToBook(null)} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><label className="block text-sm font-medium text-slate-700">Company<select required name="companyId" defaultValue="" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5"><option value="" disabled>Select a company</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.companyName}</option>)}</select></label><input type="hidden" name="startTime" value={slotToBook} /><label className="block text-sm font-medium text-slate-700">Schedule Type<select name="scheduleType" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5"><option value="one_day">One day</option><option value="weekly">Weekly</option></select></label>{mutationError && <p role="alert" className="text-sm text-red-600">{mutationError}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={() => setSlotToBook(null)} className="rounded-lg border px-4 py-2 text-slate-600">Cancel</button><button disabled={saving || customers.length === 0} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save Meeting"}</button></div></form></div>}
    {selectedMeeting && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { setSelectedMeeting(null); setEditingMeeting(false); } }}>
      {editingMeeting ? <form action={updateSelectedMeeting} className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h2 className="text-lg font-bold text-slate-900">Edit Meeting</h2><button type="button" aria-label="Close" onClick={() => setEditingMeeting(false)} className="text-slate-400 hover:text-slate-700"><X /></button></div><div className="space-y-4 px-6 py-5"><label className="block text-sm font-semibold text-slate-700">Date <span className="text-red-500">*</span><input required type="date" name="meetingDate" defaultValue={selectedMeeting.meeting.scheduleType === "one_day" ? selectedMeeting.meeting.meetingDate || selected : selected} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-semibold text-slate-700">Start time<input required type="time" name="startTime" defaultValue={selectedMeeting.meeting.startTime?.slice(0, 5) || "09:00"} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label><label className="block text-sm font-semibold text-slate-700">End time<input required type="time" name="endTime" defaultValue={selectedMeeting.meeting.endTime?.slice(0, 5) || "10:00"} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label></div><label className="block text-sm font-semibold text-slate-700">Company<input readOnly value={selectedMeeting.customer.companyName} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal text-slate-600" /></label><label className="block text-sm font-semibold text-slate-700">Schedule Type<select name="scheduleType" defaultValue={selectedMeeting.meeting.scheduleType} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"><option value="one_day">One day</option><option value="weekly">Weekly</option></select></label>{mutationError && <p role="alert" className="text-sm text-red-600">{mutationError}</p>}</div><div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4"><button type="button" onClick={() => setEditingMeeting(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button></div></form> : <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h2 className="text-lg font-bold text-slate-900">Meeting Details</h2><button type="button" aria-label="Close" onClick={() => setSelectedMeeting(null)} className="text-slate-400 hover:text-slate-700"><X /></button></div><div className="space-y-4 px-6 py-5"><DetailRow icon={<CalendarDays className="h-4 w-4" />} label="Date" value={formatDate(selectedDate)} /><DetailRow icon={<Clock3 className="h-4 w-4" />} label="Time" value={`${selectedMeeting.meeting.startTime?.slice(0, 5)} – ${selectedMeeting.meeting.endTime?.slice(0, 5)}`} /><DetailRow icon={<CalendarDays className="h-4 w-4" />} label="Customer" value={selectedMeeting.customer.companyName} /><DetailRow icon={<UserRound className="h-4 w-4" />} label="PIC" value={selectedMeeting.customer.primaryPic?.fullName || "Not provided"} /><DetailRow icon={<MapPin className="h-4 w-4" />} label="Location" value={selectedMeeting.customer.address || "Not provided"} /><DetailRow icon={<CalendarDays className="h-4 w-4" />} label="Schedule Type" value={selectedMeeting.meeting.scheduleType === "weekly" ? "Weekly" : "One day"} /><p className="border-t border-slate-100 pt-4 text-xs text-slate-500">Agenda, meeting status, and modification history are not stored in the current database schema.</p>{mutationError && <p role="alert" className="text-sm text-red-600">{mutationError}</p>}</div><div className="flex justify-between border-t border-slate-100 bg-slate-50 px-6 py-4"><button type="button" disabled={saving} onClick={() => void deleteSelectedMeeting()} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4" />Delete</button><button type="button" onClick={() => { setEditingMeeting(true); setMutationError(""); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white"><Pencil className="h-4 w-4" />Edit</button></div></div>}
    </div>}
  </div>;
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">{icon}</span><div><p className="text-xs text-slate-400">{label}</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p></div></div>;
}
