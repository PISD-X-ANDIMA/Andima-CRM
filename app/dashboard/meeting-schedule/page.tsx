"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import type { ApiResponse, CustomerListItem, MeetingDay, ScheduleType } from "@/types/customer";

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = Array.from({ length: 10 }, (_, index) => 8 + index);
const dayKeys: MeetingDay[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
type MeetingType = "offline" | "online";
interface MeetingFormState {
  companyId: string;
  date: string;
  startTime: string;
  endTime: string;
  agenda: string;
  picName: string;
  representative: string;
  meetingType: MeetingType;
  location: string;
  meetingLink: string;
  frequency: ScheduleType;
  notes: string;
}

function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function dateForInput(value: string) { return new Date(`${value}T12:00:00`); }
function newForm(date: string, startTime: string, customer?: CustomerListItem, representative = ""): MeetingFormState {
  const [hour, minutes] = startTime.split(":").map(Number);
  const endTime = `${String(Math.min(hour + 1, 23)).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}`;
  return { companyId: customer?.id || "", date, startTime, endTime, agenda: "", picName: customer?.primaryPic?.fullName || "", representative, meetingType: "offline", location: "", meetingLink: "", frequency: "one_day", notes: "" };
}

export default function MeetingSchedulePage() {
  const router = useRouter();
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
  const [form, setForm] = useState<MeetingFormState>(() => newForm(dateKey(new Date()), "09:00"));

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/v1/customers?perPage=100&context=calendar", { cache: "no-store" });
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
  const selectedDate = dateForInput(selected);
  const agenda = customers.flatMap((customer) => (customer.meetings || []).flatMap((meeting) => {
    if (meeting.effectiveStartDate && selected < meeting.effectiveStartDate) return [];
    const isScheduled = meeting.scheduleType === "one_day" ? meeting.meetingDate === selected : meeting.meetingDay === dayKeys[selectedDate.getDay()];
    return isScheduled ? [{ customer, meeting }] : [];
  })).sort((a, b) => (a.meeting.startTime || "").localeCompare(b.meeting.startTime || ""));
  const availableCustomers = customers;

  const beginAdd = (time: string) => {
    const representative = (() => { try { return JSON.parse(localStorage.getItem("andima_user") || "{}").name || ""; } catch { return ""; } })();
    setForm(newForm(selected, time, undefined, representative));
    setMutationError("");
    setSlotToBook(time);
  };

  const beginEdit = () => {
    if (!selectedMeeting) return;
    const meeting = selectedMeeting.meeting;
    const representative = (() => { try { return JSON.parse(localStorage.getItem("andima_user") || "{}").name || ""; } catch { return ""; } })();
    setForm({
      companyId: selectedMeeting.customer.id,
      date: meeting.scheduleType === "one_day" ? meeting.meetingDate || selected : meeting.effectiveStartDate || selected,
      startTime: meeting.startTime?.slice(0, 5) || "09:00",
      endTime: meeting.endTime?.slice(0, 5) || "10:00",
      agenda: meeting.agenda || "",
      picName: selectedMeeting.customer.primaryPic?.fullName || meeting.picName || "",
      representative: meeting.representativeName || representative,
      meetingType: meeting.meetingType || "offline",
      location: meeting.location || "",
      meetingLink: meeting.meetingLink || "",
      frequency: meeting.scheduleType,
      notes: meeting.notes || "",
    });
    setMutationError("");
    setEditingMeeting(true);
  };

  const handleSaveMeeting = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const customer = customers.find((item) => item.id === form.companyId);
    if (!customer) { setMutationError("Select a company."); return; }
    if (form.meetingType === "offline" && !form.location.trim()) { setMutationError("Location is required for an offline meeting."); return; }
    if (form.meetingType === "online" && !form.meetingLink.trim()) { setMutationError("A meeting link is required for an online meeting."); return; }
    if (form.endTime <= form.startTime) { setMutationError("End time must be after start time."); return; }
    const meetingDate = dateForInput(form.date);
    const payload = {
      meeting_day: dayKeys[meetingDate.getDay()],
      schedule_type: form.frequency,
      meeting_date: form.frequency === "one_day" ? form.date : null,
      effective_start_date: form.frequency === "weekly" ? form.date : null,
      start_time: `${form.startTime}:00`,
      end_time: `${form.endTime}:00`,
      agenda: form.agenda.trim(),
      pic_name: form.picName.trim(),
      representative_name: form.representative.trim(),
      meeting_type: form.meetingType,
      location: form.meetingType === "offline" ? form.location.trim() : null,
      meeting_link: form.meetingType === "online" ? form.meetingLink.trim() : null,
      notes: form.notes.trim(),
    };
    setSaving(true); setMutationError("");
    try {
      const editMeeting = editingMeeting ? selectedMeeting : null;
      const response = await fetch(`/api/v1/customers/${editMeeting ? editMeeting.customer.id : customer.id}/meetings`, {
        method: editMeeting ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editMeeting ? { meetingId: editMeeting.meeting.id, ...payload } : payload),
      });
      const result: ApiResponse<{ meetingId: string }> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Failed to save the meeting." : result.message);
      setSelected(form.date);
      setMonth(new Date(meetingDate.getFullYear(), meetingDate.getMonth(), 1));
      setSlotToBook(null); setEditingMeeting(false); setSelectedMeeting(null);
      await load();
    } catch (cause) { setMutationError(cause instanceof Error ? cause.message : "Failed to save the meeting."); }
    finally { setSaving(false); }
  };

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

  async function changeMeetingStatus(status: "scheduled" | "completed" | "cancelled") {
    if (!selectedMeeting || selectedMeeting.meeting.status === status) return;
    setSaving(true); setMutationError("");
    try {
      const response = await fetch(`/api/v1/customers/${selectedMeeting.customer.id}/meetings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: selectedMeeting.meeting.id, status }),
      });
      const result: ApiResponse<{ meetingId: string }> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Failed to update the meeting status." : result.message);
      setSelectedMeeting((current) => current ? { ...current, meeting: { ...current.meeting, status } } : null);
      await load();
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : "Failed to update the meeting status.");
    } finally {
      setSaving(false);
    }
  }

  const formatDate = (date: Date) => date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const meetingAtHour = (hour: number) => agenda.filter(({ meeting }) => {
    const start = Number(meeting.startTime?.slice(0, 2)) * 60 + Number(meeting.startTime?.slice(3, 5));
    const end = Number(meeting.endTime?.slice(0, 2)) * 60 + Number(meeting.endTime?.slice(3, 5));
    return start < (hour + 1) * 60 && end > hour * 60;
  });
  const updateForm = (field: keyof MeetingFormState, value: string) => setForm((current) => ({ ...current, [field]: value }));

  return <div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{formatDate(selectedDate)}</h1>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Meeting schedule and availability for this date</p>
      </div>
      <button
        type="button"
        onClick={() => beginAdd("09:00")}
        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Add Meeting</span>
      </button>
    </header>
    <div className="grid items-start gap-5 lg:grid-cols-[330px_1fr]">
      <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-[#0f172a]">
        <div className="mb-4 flex items-center justify-between">
          <button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
          <button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-y-1.5 text-center">
          {weekdayNames.map((day) => <span key={day} className="pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{day}</span>)}
          {calendarDays.map((date) => {
            const key = dateKey(date);
            const inMonth = date.getMonth() === month.getMonth();
            const statuses = customers.flatMap((customer) => (customer.meetings || []).filter((meeting) => meeting.scheduleType === "one_day" ? meeting.meetingDate === key : meeting.meetingDay === dayKeys[date.getDay()] && (!meeting.effectiveStartDate || key >= meeting.effectiveStartDate)).map((meeting) => meeting.status || "scheduled"));
            const dotClass = statuses.includes("scheduled") ? "bg-[#2563eb]" : statuses.includes("completed") ? "bg-[#10b981]" : statuses.includes("cancelled") ? "border border-slate-500 bg-white dark:bg-slate-900" : "bg-slate-400";
            return <button key={key} onClick={() => setSelected(key)} className={`relative mx-auto grid h-8 w-8 place-items-center rounded-full text-xs transition-colors ${!inMonth ? "text-slate-300 dark:text-slate-600" : "text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800"} ${key === selected ? "bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:text-white" : ""}`} aria-pressed={key === selected}>
              <span>{date.getDate()}</span>
              {inMonth && <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${key === selected ? "bg-white" : dotClass}`} />}
            </button>;
          })}
        </div>
        <ul aria-label="Meeting status legend" className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <li className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-slate-500" /><span className="font-medium text-slate-600 dark:text-slate-400">Available</span></li>
          <li className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#2563eb]" /><span className="font-semibold text-[#2563eb] dark:text-blue-400">Scheduled</span></li>
          <li className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#10b981]" /><span className="font-semibold text-[#10b981] dark:text-emerald-400">Completed</span></li>
          <li className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full border border-slate-500 bg-white dark:bg-slate-900" /><span>Canceled</span></li>
        </ul>
      </section>
      <section className="space-y-2">
        {loading ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">Loading schedule...</div> : error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">{error}<button className="ml-3 underline" onClick={() => void load()}>Try again</button></div> : null}
        {!loading && !error && agenda.length === 0 && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">No meetings are scheduled for this date.</div>}
        {!loading && !error && hours.map((hour) => {
          const slotMeetings = meetingAtHour(hour);
          return slotMeetings.length ? slotMeetings.map(({ customer, meeting }) => {
            const meetingStatus = meeting.status || "scheduled";
            const statusStyle = meetingStatus === "completed" ? "border-[#86efac] dark:border-emerald-800/80 bg-[#d1fae5] dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-300" : meetingStatus === "cancelled" ? "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400" : "border-[#93c5fd] dark:border-blue-800/80 bg-[#dce9fe] dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-300";
            const statusColor = meetingStatus === "completed" ? "bg-[#10b981]" : meetingStatus === "cancelled" ? "bg-slate-400" : "bg-[#2563eb]";
            const timeColor = meetingStatus === "completed" ? "text-[#059669] dark:text-emerald-300" : meetingStatus === "cancelled" ? "text-slate-600 dark:text-slate-400" : "text-[#2563eb] dark:text-blue-300";
            return <div key={`${meeting.id}-${hour}`} className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs ${statusStyle}`}><button type="button" onClick={() => { setSelectedMeeting({ customer, meeting }); setEditingMeeting(false); setMutationError(""); }} className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left cursor-pointer"><span className="flex min-w-0 items-center gap-2.5"><i className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusColor}`} /><span className="truncate font-semibold">{meetingStatus === "completed" ? "Completed" : (meeting.agenda ? `Meeting with ${customer.companyName}` : customer.companyName)}<small className="ml-2 font-normal opacity-80">{meetingStatus === "completed" ? "" : meetingStatus === "cancelled" ? "Canceled" : "Scheduled"}</small></span></span><span className={`whitespace-nowrap font-bold ${timeColor}`}>{meeting.startTime?.slice(0, 5)}-{meeting.endTime?.slice(0, 5)}</span></button>{meetingStatus === "cancelled" ? <button type="button" onClick={() => beginAdd(meeting.startTime?.slice(0, 5) || `${String(hour).padStart(2, "0")}:00`)} className="shrink-0 rounded-lg border border-blue-400 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-500/40 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/40 cursor-pointer">+Add</button> : <button type="button" onClick={() => { setSelectedMeeting({ customer, meeting }); setEditingMeeting(false); setMutationError(""); }} className="shrink-0 rounded-lg border border-blue-400 dark:border-blue-500/60 bg-white dark:bg-slate-900 px-3.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 shadow-2xs transition-colors cursor-pointer">View</button>}</div>;
          }) : <div key={hour} className="flex min-h-[48px] items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-[#f8fafc] px-4 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"><span className="flex items-center gap-2.5"><i className="h-2.5 w-2.5 rounded-full bg-slate-500 dark:bg-slate-500" /><span className="font-medium text-slate-600 dark:text-slate-300">Available</span></span><span className="whitespace-nowrap font-medium text-slate-600 dark:text-slate-400">{String(hour).padStart(2, "0")}:00-{String(hour + 1).padStart(2, "0")}:00</span><button type="button" onClick={() => beginAdd(`${String(hour).padStart(2, "0")}:00`)} className="rounded-lg border border-blue-400 dark:border-blue-500/60 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 shadow-2xs transition-colors cursor-pointer">+Add</button></div>;
        })}
      </section>
    </div>

    {slotToBook && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setSlotToBook(null); }}><form onSubmit={handleSaveMeeting} className="my-auto w-full max-w-xl rounded-2xl bg-white px-5 py-5 shadow-2xl sm:px-6 animate-in fade-in zoom-in-95 duration-150 dark:bg-[#0f172a] dark:border dark:border-slate-800"><div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800"><h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Add Meeting</h2><button type="button" aria-label="Close" onClick={() => setSlotToBook(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"><X className="h-4 w-4" /></button></div>
      <div className="space-y-3">
        <MeetingField label="Company" required><select required value={form.companyId} onChange={(event) => { const customer = customers.find((item) => item.id === event.target.value); updateForm("companyId", event.target.value); if (customer) updateForm("picName", customer.primaryPic?.fullName || ""); }} className={inputClass}><option value="">Select company</option>{availableCustomers.map((customer) => <option key={customer.id} value={customer.id}>{customer.companyName}</option>)}</select></MeetingField>
        <MeetingField label="Date" required><input required type="date" value={form.date} onChange={(event) => updateForm("date", event.target.value)} className={inputClass} /></MeetingField>
        <MeetingField label="Time" required><div className="grid grid-cols-2 gap-2.5"><input required type="time" value={form.startTime} onChange={(event) => updateForm("startTime", event.target.value)} className={inputClass} /><input required type="time" value={form.endTime} onChange={(event) => updateForm("endTime", event.target.value)} className={inputClass} /></div></MeetingField>
        <MeetingField label="Agenda / Topic" required><input required maxLength={200} value={form.agenda} onChange={(event) => updateForm("agenda", event.target.value)} placeholder="Enter agenda" className={inputClass} /></MeetingField>
        <MeetingField label="PIC Name" required><input required value={form.picName} onChange={(event) => updateForm("picName", event.target.value)} placeholder="Enter PIC name" className={inputClass} /></MeetingField>
        <MeetingField label="Andima Representative" required><input required value={form.representative} onChange={(event) => updateForm("representative", event.target.value)} placeholder="Representative name" className={inputClass} /></MeetingField>
        <MeetingField label="Meeting Type" required><div className="flex flex-wrap gap-5 pt-1"><RadioChoice name="meeting-type" checked={form.meetingType === "offline"} onChange={() => updateForm("meetingType", "offline")} label="Offline (Location)" /><RadioChoice name="meeting-type" checked={form.meetingType === "online"} onChange={() => updateForm("meetingType", "online")} label="Online (Link)" /></div></MeetingField>
        {form.meetingType === "offline" ? <MeetingField label="Location" required><input required value={form.location} onChange={(event) => updateForm("location", event.target.value)} placeholder="Enter location" className={inputClass} /></MeetingField> : <MeetingField label="Meeting Link" required><input required type="url" value={form.meetingLink} onChange={(event) => updateForm("meetingLink", event.target.value)} placeholder="https://" className={inputClass} /></MeetingField>}
        <MeetingField label="Frequency" required><div className="flex flex-wrap gap-5 pt-1"><RadioChoice name="meeting-frequency" checked={form.frequency === "one_day"} onChange={() => updateForm("frequency", "one_day")} label="One-time" /><RadioChoice name="meeting-frequency" checked={form.frequency === "weekly"} onChange={() => updateForm("frequency", "weekly")} label="Weekly (repeats until canceled)" /></div></MeetingField>
        <MeetingField label="Notes"><div><textarea maxLength={500} rows={2} value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Enter notes (optional)" className={`${inputClass} h-auto py-2 resize-y`} /><p className="mt-1 text-right text-[11px] text-slate-400 dark:text-slate-500">{form.notes.length}/500</p></div></MeetingField>
      </div>
      {mutationError && <p role="alert" className="mt-2.5 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{mutationError}</p>}
      <div className="mt-4 flex justify-end gap-2.5 border-t border-slate-100 pt-3.5 dark:border-slate-800"><button type="button" onClick={() => setSlotToBook(null)} className="h-9 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">Cancel</button><button type="submit" disabled={saving || availableCustomers.length === 0} className="h-9 rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs">{saving ? "Saving..." : "Save Meeting"}</button></div>
    </form></div>}

    {selectedMeeting && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { setSelectedMeeting(null); setEditingMeeting(false); } }}>
      {editingMeeting ? <form onSubmit={handleSaveMeeting} className="my-auto w-full max-w-xl rounded-2xl bg-white px-5 py-5 shadow-2xl sm:px-6 animate-in fade-in zoom-in-95 duration-150 dark:bg-[#0f172a] dark:border dark:border-slate-800"><div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800"><h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Edit Meeting</h2><button type="button" aria-label="Close" onClick={() => setEditingMeeting(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"><X className="h-4 w-4" /></button></div>
        <div className="space-y-3"><MeetingField label="Company" required><select required value={form.companyId} onChange={(event) => updateForm("companyId", event.target.value)} className={inputClass}><option value={selectedMeeting.customer.id}>{selectedMeeting.customer.companyName}</option></select></MeetingField>
          <MeetingField label="Date" required><input required type="date" value={form.date} onChange={(event) => updateForm("date", event.target.value)} className={inputClass} /></MeetingField>
          <MeetingField label="Time" required><div className="grid grid-cols-2 gap-2.5"><input required type="time" value={form.startTime} onChange={(event) => updateForm("startTime", event.target.value)} className={inputClass} /><input required type="time" value={form.endTime} onChange={(event) => updateForm("endTime", event.target.value)} className={inputClass} /></div></MeetingField>
          <MeetingField label="Agenda / Topic" required><input required maxLength={200} value={form.agenda} onChange={(event) => updateForm("agenda", event.target.value)} placeholder="Enter agenda" className={inputClass} /></MeetingField>
          <MeetingField label="PIC Name" required><input required value={form.picName} onChange={(event) => updateForm("picName", event.target.value)} placeholder="Enter PIC name" className={inputClass} /></MeetingField>
          <MeetingField label="Andima Representative" required><input required value={form.representative} onChange={(event) => updateForm("representative", event.target.value)} className={inputClass} /></MeetingField>
          <MeetingField label="Meeting Type" required><div className="flex flex-wrap gap-5 pt-1"><RadioChoice name="edit-meeting-type" checked={form.meetingType === "offline"} onChange={() => updateForm("meetingType", "offline")} label="Offline (Location)" /><RadioChoice name="edit-meeting-type" checked={form.meetingType === "online"} onChange={() => updateForm("meetingType", "online")} label="Online (Link)" /></div></MeetingField>
          {form.meetingType === "offline" ? <MeetingField label="Location" required><input required value={form.location} onChange={(event) => updateForm("location", event.target.value)} className={inputClass} /></MeetingField> : <MeetingField label="Meeting Link" required><input required type="url" value={form.meetingLink} onChange={(event) => updateForm("meetingLink", event.target.value)} className={inputClass} /></MeetingField>}
          <MeetingField label="Frequency" required><div className="flex flex-wrap gap-5 pt-1"><RadioChoice name="edit-meeting-frequency" checked={form.frequency === "one_day"} onChange={() => updateForm("frequency", "one_day")} label="One-time" /><RadioChoice name="edit-meeting-frequency" checked={form.frequency === "weekly"} onChange={() => updateForm("frequency", "weekly")} label="Weekly (repeats until canceled)" /></div></MeetingField>
          <MeetingField label="Notes"><div><textarea maxLength={500} rows={2} value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Enter notes (optional)" className={`${inputClass} h-auto py-2 resize-y`} /><p className="mt-1 text-right text-[11px] text-slate-400 dark:text-slate-500">{form.notes.length}/500</p></div></MeetingField>
        </div>
        {mutationError && <p role="alert" className="mt-2.5 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{mutationError}</p>}
        <div className="mt-4 flex justify-end gap-2.5 border-t border-slate-100 pt-3.5 dark:border-slate-800"><button type="button" onClick={() => setEditingMeeting(false)} className="h-9 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">Cancel</button><button type="submit" disabled={saving} className="h-9 rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs">{saving ? "Saving..." : "Save Changes"}</button></div>
      </form> : <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 dark:bg-[#0f172a] dark:border dark:border-slate-800"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Meeting Details</h2><button type="button" aria-label="Close" onClick={() => setSelectedMeeting(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"><X className="h-4 w-4" /></button></div>
        <div className="space-y-3.5 px-5 py-4"><div className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-3 text-xs"><DetailRow label="Company" value={selectedMeeting.customer.companyName} /><DetailRow label="Date & Time" value={`${formatDate(selectedMeeting.meeting.scheduleType === "one_day" && selectedMeeting.meeting.meetingDate ? dateForInput(selectedMeeting.meeting.meetingDate) : selectedDate)}, ${selectedMeeting.meeting.startTime?.slice(0, 5)} - ${selectedMeeting.meeting.endTime?.slice(0, 5)}`} /><DetailRow label="Agenda / Topic" value={selectedMeeting.meeting.agenda || "Not provided"} /><DetailRow label="PIC" value={selectedMeeting.meeting.picName || selectedMeeting.customer.primaryPic?.fullName || "Not provided"} /><DetailRow label="PIC Phone Number" value={selectedMeeting.customer.primaryPic?.phoneNumber || "Not provided"} /><DetailRow label="Andima Representative" value={selectedMeeting.meeting.representativeName || "Not provided"} /><DetailRow label="Meeting Type" value={selectedMeeting.meeting.meetingType === "online" ? "Online (Link)" : "Offline (Location)"} /><DetailRow label={selectedMeeting.meeting.meetingType === "online" ? "Meeting Link" : "Location"} value={selectedMeeting.meeting.meetingType === "online" ? selectedMeeting.meeting.meetingLink || "Not provided" : selectedMeeting.meeting.location || selectedMeeting.customer.address || "Not provided"} /><dt className="text-slate-500 font-medium dark:text-slate-400">Status</dt><dd>{selectedMeeting.meeting.status === "completed" ? <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Completed</span> : <select aria-label="Meeting status" disabled={saving} value={selectedMeeting.meeting.status || "scheduled"} onChange={(event) => void changeMeetingStatus(event.target.value as "scheduled" | "completed" | "cancelled")} className={`rounded-lg border border-slate-200 px-2.5 py-0.5 text-xs font-semibold disabled:opacity-60 dark:border-slate-700 ${selectedMeeting.meeting.status === "cancelled" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"}`}><option value="scheduled" className="dark:bg-slate-900 dark:text-white">Scheduled</option><option value="completed" className="dark:bg-slate-900 dark:text-white">Completed</option><option value="cancelled" className="dark:bg-slate-900 dark:text-white">Canceled</option></select>}</dd><DetailRow label="Frequency" value={selectedMeeting.meeting.scheduleType === "weekly" ? "Weekly" : "One-time"} /><DetailRow label="Notes" value={selectedMeeting.meeting.notes || "No notes"} /></div>{selectedMeeting.meeting.status === "completed" && <p className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">This completed meeting is read-only.</p>}{mutationError && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{mutationError}</p>}</div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/60"><button type="button" disabled={selectedMeeting.meeting.status !== "completed"} onClick={() => router.push(`/dashboard/record-conversation?customer_id=${encodeURIComponent(selectedMeeting.customer.id)}&meeting_id=${encodeURIComponent(selectedMeeting.meeting.id)}`)} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-800 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700">+ Record Conversation</button>{selectedMeeting.meeting.status !== "completed" && <button type="button" disabled={saving} onClick={() => void deleteSelectedMeeting()} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"><Trash2 className="h-3.5 w-3.5" />Delete</button>}{selectedMeeting.meeting.status !== "completed" && <button type="button" onClick={beginEdit} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"><Pencil className="h-3.5 w-3.5" />Edit</button>}</div>
      </div>}
    </div>}
  </div>;
}

const inputClass = "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-950/50 transition-all";

function MeetingField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center"><label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}{required && <span className="ml-0.5 text-rose-500">*</span>}</label>{children}</div>;
}

function RadioChoice({ name, checked, onChange, label }: { name: string; checked: boolean; onChange: () => void; label: string }) {
  return <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300"><input type="radio" name={name} checked={checked} onChange={onChange} className="h-3.5 w-3.5 accent-blue-600" />{label}</label>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <><dt className="text-slate-500 font-medium dark:text-slate-400">{label}</dt><dd className="break-words font-semibold text-slate-800 dark:text-slate-100">{value}</dd></>;
}
