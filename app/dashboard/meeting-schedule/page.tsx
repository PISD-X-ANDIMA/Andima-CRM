"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { ApiResponse, CustomerListItem, MeetingDay, ScheduleType } from "@/types/customer";
import { ManagerGlobalFilterBar } from "@/components/dashboard/ManagerGlobalFilterBar";
import { useManagerFilter } from "@/lib/hooks/useManagerFilter";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Hours displayed in the calendar: 08:00 to 18:00 (1 slot = 1 hour, from 08:00-09:00 until 17:00-18:00)
const hours = Array.from({ length: 10 }, (_, index) => 8 + index);
const meetingSlots = hours.map((hour) => ({
  start: `${String(hour).padStart(2, "0")}:00`,
  end: `${String(hour + 1).padStart(2, "0")}:00`,
}));
const dayKeys: MeetingDay[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const dayShortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarViewMode = "day" | "work_week" | "week";
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

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function jakartaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function jakartaMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return (
    Number(parts.find((part) => part.type === "hour")?.value || 0) * 60 +
    Number(parts.find((part) => part.type === "minute")?.value || 0)
  );
}

function dateForInput(value: string) {
  return new Date(`${value}T12:00:00`);
}

function getMonday(dateInput: Date): Date {
  const d = new Date(dateInput);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function isMeetingPast(meeting: NonNullable<CustomerListItem["meetingSchedule"]>, selectedDate: string) {
  const occurrenceDate = meeting.scheduleType === "one_day" ? meeting.meetingDate : meeting.occurrenceDate || selectedDate;
  if (!occurrenceDate) return false;
  const today = jakartaDateKey();
  if (occurrenceDate < today) return true;
  if (occurrenceDate > today) return false;
  const [hours, minutes] = (meeting.endTime || "00:00").split(":").map(Number);
  return hours * 60 + minutes <= jakartaMinutes();
}

function newForm(date: string, startTime: string, customer?: CustomerListItem, representative = ""): MeetingFormState {
  const [hour, minutes] = startTime.split(":").map(Number);
  const endTime = `${String(Math.min(hour + 1, 23)).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}`;
  return {
    companyId: customer?.id || "",
    date,
    startTime,
    endTime,
    agenda: "",
    picName: customer?.primaryPic?.fullName || "",
    representative,
    meetingType: "offline",
    location: "",
    meetingLink: "",
    frequency: "one_day",
    notes: "",
  };
}

function getMeetingColorStyle(agenda: string, status?: string) {
  if (status === "completed") {
    return "border-emerald-400 bg-emerald-50/90 text-emerald-900 border-l-4";
  }
  if (status === "cancelled") {
    return "border-slate-300 bg-slate-100 text-slate-500 border-l-4 opacity-65 line-through";
  }
  const lower = agenda.toLowerCase();
  if (lower.includes("follow") || lower.includes("kargo") || lower.includes("global")) {
    return "border-purple-400 bg-purple-50/90 text-purple-900 border-l-4";
  }
  if (lower.includes("trans") || lower.includes("closing") || lower.includes("deal") || lower.includes("nusantara")) {
    return "border-emerald-400 bg-emerald-50/90 text-emerald-900 border-l-4";
  }
  if (lower.includes("discuss") || lower.includes("diskusi") || lower.includes("cargo") || lower.includes("sentra")) {
    return "border-amber-400 bg-amber-50/90 text-amber-900 border-l-4";
  }
  return "border-blue-500 bg-blue-50/90 text-blue-900 border-l-4";
}

export default function MeetingSchedulePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { selectedExecutive } = useManagerFilter();
  const [isManager, setIsManager] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem("andima_user") || "{}");
      return Boolean(user.role?.toLowerCase()?.includes("manager"));
    } catch {
      return false;
    }
  });

  // Active anchor date for calendar navigation
  const [anchorDate, setAnchorDate] = useState(() => dateForInput(jakartaDateKey()));
  const [selectedDateKey, setSelectedDateKey] = useState(() => jakartaDateKey());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("work_week");

  // On mobile screens, automatically default to Day view for optimal touch experience
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setViewMode("day");
    }
  }, []);

  // Date jump picker popover state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Data states
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slotRefresh, setSlotRefresh] = useState(0);

  // Modal & form states
  const [slotToBook, setSlotToBook] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [pastSlotNotice, setPastSlotNotice] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState<{
    customer: CustomerListItem;
    meeting: NonNullable<CustomerListItem["meetingSchedule"]>;
  } | null>(null);
  const [editingMeeting, setEditingMeeting] = useState(false);
  const [multiMeetingSlot, setMultiMeetingSlot] = useState<{
    date: string;
    hour: number;
    meetings: { customer: CustomerListItem; meeting: NonNullable<CustomerListItem["meetingSchedule"]> }[];
  } | null>(null);
  const [form, setForm] = useState<MeetingFormState>(() => newForm(jakartaDateKey(), "09:00"));

  // Close date picker popup on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }
    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDatePicker]);

  // Check role
  useEffect(() => {
    let active = true;
    fetch("/api/v1/navigation/sidebar", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (active && json?.success && typeof json.data?.isManager === "boolean") {
          setIsManager((prev) => (prev !== json.data.isManager ? json.data.isManager : prev));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Load customers & meetings
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ perPage: "500", page: "1", context: "calendar" });
      if (isManager) {
        params.set("forceAll", "true");
        if (selectedExecutive !== "all") {
          params.set("assigned_to", selectedExecutive);
        }
      }
      const response = await fetch(`/api/v1/customers?${params}`, { cache: "no-store" });
      const result: ApiResponse<CustomerListItem[]> = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.success ? "Failed to load the schedule." : result.message);
      }
      const allCustomers = [...result.data];
      if ((result.meta?.totalPages || 1) > 1) {
        const remainingPromises = [];
        for (let page = 2; page <= (result.meta?.totalPages || 1); page += 1) {
          const pageParams = new URLSearchParams(params);
          pageParams.set("page", String(page));
          remainingPromises.push(
            fetch(`/api/v1/customers?${pageParams}`, { cache: "no-store" })
              .then((res) => res.json())
              .then((json: ApiResponse<CustomerListItem[]>) => (json.success && json.data) ? json.data : [])
          );
        }
        const pagesData = await Promise.all(remainingPromises);
        for (const data of pagesData) {
          allCustomers.push(...data);
        }
      }
      setCustomers(allCustomers);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load the schedule.");
    } finally {
      setLoading(false);
    }
  }, [isManager, selectedExecutive]);

  useEffect(() => {
    void load();
  }, [load, slotRefresh]);

  // Determine which days to display based on viewMode
  const displayedDays = useMemo(() => {
    if (viewMode === "day") {
      return [anchorDate];
    }
    const monday = getMonday(anchorDate);
    const count = viewMode === "work_week" ? 5 : 7;
    return Array.from({ length: count }, (_, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      return d;
    });
  }, [anchorDate, viewMode]);

  // Formatted date range label for the top control bar
  const dateRangeLabel = useMemo(() => {
    const locale = language === "id" ? "id-ID" : "en-GB";
    const formatFull = (d: Date) =>
      d.toLocaleDateString(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

    if (viewMode === "day") {
      return formatFull(displayedDays[0]);
    }
    const first = displayedDays[0];
    const last = displayedDays[displayedDays.length - 1];
    return `${formatFull(first)} – ${formatFull(last)}`;
  }, [displayedDays, viewMode, language]);

  // Navigate dates
  const handleNavPrev = () => {
    setAnchorDate((current) => {
      const next = new Date(current);
      if (viewMode === "day") {
        next.setDate(current.getDate() - 1);
      } else {
        next.setDate(current.getDate() - 7);
      }
      return next;
    });
  };

  const handleNavNext = () => {
    setAnchorDate((current) => {
      const next = new Date(current);
      if (viewMode === "day") {
        next.setDate(current.getDate() + 1);
      } else {
        next.setDate(current.getDate() + 7);
      }
      return next;
    });
  };

  const handleNavToday = () => {
    const today = dateForInput(jakartaDateKey());
    setAnchorDate(today);
    setSelectedDateKey(jakartaDateKey());
  };

  // Get meetings occurring on a specific date key and hour
  const getMeetingsForSlot = useCallback(
    (targetDateKey: string, hour: number) => {
      const targetDate = dateForInput(targetDateKey);
      const dayOfWeekKey = dayKeys[targetDate.getDay()];

      return customers
        .flatMap((customer) =>
          (customer.meetings || []).flatMap((meeting) => {
            if (meeting.status === "cancelled") return [];
            if (meeting.effectiveStartDate && targetDateKey < meeting.effectiveStartDate) return [];

            const isScheduledToday =
              meeting.scheduleType === "one_day"
                ? meeting.meetingDate === targetDateKey
                : meeting.meetingDay === dayOfWeekKey;

            if (!isScheduledToday) return [];

            const meetingStart = Number(meeting.startTime?.slice(0, 2)) * 60 + Number(meeting.startTime?.slice(3, 5) || 0);
            const meetingEnd = Number(meeting.endTime?.slice(0, 2)) * 60 + Number(meeting.endTime?.slice(3, 5) || 0);
            const slotStart = hour * 60;
            const slotEnd = (hour + 1) * 60;

            if (meetingStart < slotEnd && meetingEnd > slotStart) {
              return [{ customer, meeting }];
            }
            return [];
          })
        )
        .sort((a, b) => (a.meeting.startTime || "").localeCompare(b.meeting.startTime || ""));
    },
    [customers]
  );

  // Begin booking a slot
  const beginAdd = (dateStr: string, timeStr: string) => {
    const today = jakartaDateKey();
    if (dateStr < today) {
      setPastSlotNotice("Tanggal sudah terlewat, tidak dapat menjadwalkan meeting.");
      setTimeout(() => setPastSlotNotice(""), 3500);
      return;
    }
    const hourNum = Number(timeStr.slice(0, 2));
    if (dateStr === today && hourNum * 60 <= jakartaMinutes()) {
      setPastSlotNotice("Jam ini sudah terlewat, tidak dapat menjadwalkan meeting.");
      setTimeout(() => setPastSlotNotice(""), 3500);
      return;
    }

    const representative = (() => {
      try {
        return JSON.parse(localStorage.getItem("andima_user") || "{}").name || "";
      } catch {
        return "";
      }
    })();

    setSelectedDateKey(dateStr);
    setForm(newForm(dateStr, timeStr, undefined, representative));
    setMutationError("");
    setSlotToBook(timeStr);
  };

  // Edit existing meeting
  const beginEdit = () => {
    if (!selectedMeeting) return;
    const meeting = selectedMeeting.meeting;
    const representative = (() => {
      try {
        return JSON.parse(localStorage.getItem("andima_user") || "{}").name || "";
      } catch {
        return "";
      }
    })();
    setForm({
      companyId: selectedMeeting.customer.id,
      date: meeting.scheduleType === "one_day" ? meeting.meetingDate || selectedDateKey : meeting.effectiveStartDate || selectedDateKey,
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

  // Save / Update Meeting
  const handleSaveMeeting = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const customer = customers.find((item) => item.id === form.companyId);
    if (!customer) {
      setMutationError("Select a company.");
      return;
    }
    if (form.meetingType === "offline" && !form.location.trim()) {
      setMutationError("Location is required for an offline meeting.");
      return;
    }
    if (form.meetingType === "online" && !form.meetingLink.trim()) {
      setMutationError("A meeting link is required for an online meeting.");
      return;
    }
    if (form.endTime <= form.startTime) {
      setMutationError("End time must be after start time.");
      return;
    }
    if (form.date < jakartaDateKey()) {
      setMutationError("Meetings cannot be scheduled on a past date.");
      return;
    }
    if (!meetingSlots.some((slot) => slot.start === form.startTime && slot.end === form.endTime)) {
      setMutationError("Select an available one-hour slot between 08:00 and 18:00.");
      return;
    }
    if (form.date === jakartaDateKey() && Number(form.startTime.slice(0, 2)) * 60 <= jakartaMinutes()) {
      setMutationError("Meetings cannot be scheduled in a time slot that has already started.");
      return;
    }

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

    setSaving(true);
    setMutationError("");
    try {
      const editMeeting = editingMeeting ? selectedMeeting : null;
      const response = await fetch(`/api/v1/customers/${editMeeting ? editMeeting.customer.id : customer.id}/meetings`, {
        method: editMeeting ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editMeeting ? { meetingId: editMeeting.meeting.id, ...payload } : payload),
      });
      const result: ApiResponse<{ meetingId: string }> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Failed to save the meeting." : result.message);

      setSelectedDateKey(form.date);
      setAnchorDate(dateForInput(form.date));
      setSlotToBook(null);
      setEditingMeeting(false);
      setSelectedMeeting(null);
      setSlotRefresh((value) => value + 1);
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : "Failed to save the meeting.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Meeting
  async function deleteSelectedMeeting() {
    if (!selectedMeeting) return;
    setSaving(true);
    setMutationError("");
    try {
      const response = await fetch(`/api/v1/customers/${selectedMeeting.customer.id}/meetings`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: selectedMeeting.meeting.id }),
      });
      const result: ApiResponse<{ meetingId: string }> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Failed to delete the meeting." : result.message);
      setSelectedMeeting(null);
      setEditingMeeting(false);
      setDeleteConfirmOpen(false);
      setSlotRefresh((value) => value + 1);
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : "Failed to delete the meeting.");
    } finally {
      setSaving(false);
    }
  }

  // Update Status
  async function changeMeetingStatus(status: "scheduled" | "completed" | "cancelled") {
    if (!selectedMeeting || selectedMeeting.meeting.status === status) return;
    setSaving(true);
    setMutationError("");
    try {
      const response = await fetch(`/api/v1/customers/${selectedMeeting.customer.id}/meetings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: selectedMeeting.meeting.id, status }),
      });
      const result: ApiResponse<{ meetingId: string }> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Failed to update the meeting status." : result.message);
      setSelectedMeeting((current) => (current ? { ...current, meeting: { ...current.meeting, status } } : null));
      setSlotRefresh((value) => value + 1);
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : "Failed to update the meeting status.");
    } finally {
      setSaving(false);
    }
  }

  const updateForm = (field: keyof MeetingFormState, value: string) =>
    setForm((current) => {
      if (field === "startTime") {
        const slot = meetingSlots.find((item) => item.start === value);
        return { ...current, startTime: value, endTime: slot?.end || current.endTime };
      }
      if (field === "date") {
        const firstAvailableSlot =
          value === jakartaDateKey()
            ? meetingSlots.find((slot) => Number(slot.start.slice(0, 2)) * 60 > jakartaMinutes())
            : meetingSlots[0];
        const currentSlot = meetingSlots.find((slot) => slot.start === current.startTime && slot.end === current.endTime);
        if (currentSlot && (value !== jakartaDateKey() || Number(currentSlot.start.slice(0, 2)) * 60 > jakartaMinutes())) {
          return { ...current, date: value };
        }
        return {
          ...current,
          date: value,
          startTime: firstAvailableSlot?.start || current.startTime,
          endTime: firstAvailableSlot?.end || current.endTime,
        };
      }
      return { ...current, [field]: value };
    });

  const selectableSlots = meetingSlots.filter(
    (slot) => form.date !== jakartaDateKey() || Number(slot.start.slice(0, 2)) * 60 > jakartaMinutes()
  );

  const availableCustomers = customers;
  const todayKey = jakartaDateKey();

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notice for past slot click */}
      {pastSlotNotice && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xl animate-fade-in">
          <span>⚠️ {pastSlotNotice}</span>
          <button type="button" onClick={() => setPastSlotNotice("")} className="ml-2 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Manager Scoping Banner */}
      {isManager && <ManagerGlobalFilterBar />}
      {isManager && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs font-medium text-amber-900 leading-relaxed shadow-2xs">
          Manager sees meetings of the selected Sales Executive plus his or her own. Add, edit, delete, and status change are only for the Manager&apos;s own meetings. A time slot is blocked only by the Manager&apos;s own meetings.
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="text-xs font-medium text-slate-500">
        <span className="text-slate-400">ANDIMA CRM</span>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-400">Sales Executive</span>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-800 font-semibold">Meeting Calendar</span>
      </nav>

      {/* Header with Title and Create Meeting Button */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{t("meetingSchedule.title", "Meeting Calendar")}</h1>
          <p className="mt-1 text-sm sm:text-base text-slate-500">{t("meetingSchedule.subtitle", "Kelola dan lihat jadwal meeting dengan customer.")}</p>
        </div>
        <button
          type="button"
          disabled={loading || customers.length === 0}
          onClick={() => {
            const firstAvailable =
              selectedDateKey === todayKey
                ? selectableSlots[0]?.start || "09:00"
                : "09:00";
            beginAdd(selectedDateKey >= todayKey ? selectedDateKey : todayKey, firstAvailable);
          }}
          className="crm-btn crm-btn-primary"
        >
          <Plus className="h-4 w-4" />
          <span>{t("meetingSchedule.createMeeting", "Create Meeting")}</span>
        </button>
      </header>

      {/* Calendar Controls Bar: Today, Navigation, Date Range, and View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        {/* Left Side: Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleNavToday}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            {t("common.today", "Today")}
          </button>

          <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs">
            <button
              type="button"
              onClick={handleNavPrev}
              aria-label="Previous range"
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-l-xl transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <button
              type="button"
              onClick={handleNavNext}
              aria-label="Next range"
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-r-xl transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Date Range Picker Display */}
          <div className="relative" ref={datePickerRef}>
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              <span>{dateRangeLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Date jump popover */}
            {showDatePicker && (
              <div className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                <label className="block text-xs font-semibold text-slate-700 mb-2">Pilih Tanggal Acuan:</label>
                <input
                  type="date"
                  value={dateKey(anchorDate)}
                  onChange={(e) => {
                    if (e.target.value) {
                      const newDate = dateForInput(e.target.value);
                      setAnchorDate(newDate);
                      setSelectedDateKey(e.target.value);
                      setShowDatePicker(false);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: View Mode Switcher */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode("day")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              viewMode === "day"
                ? "bg-white text-blue-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("meetingSchedule.day", "Day")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("work_week")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              viewMode === "work_week"
                ? "bg-[#dce7fe] text-[#1e40af] shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("meetingSchedule.workWeek", "Work Week")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              viewMode === "week"
                ? "bg-white text-blue-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("meetingSchedule.week", "Week")}
          </button>
        </div>
      </div>

      {/* Main Calendar Grid Matrix */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className={viewMode === "day" ? "w-full min-w-0" : "min-w-[760px]"}>
          {/* Header row with Days */}
          <div
            className="grid border-b border-slate-200 bg-slate-50/50 text-slate-700"
            style={{
              gridTemplateColumns:
                viewMode === "day"
                  ? "64px 1fr"
                  : `80px repeat(${displayedDays.length}, minmax(130px, 1fr))`,
            }}
          >
            {/* Blank corner above time labels */}
            <div className="flex items-center justify-center border-r border-slate-200 p-3 text-center text-xs font-semibold text-slate-400">
              {t("meetingSchedule.time", "Time")}
            </div>

            {/* Day columns */}
            {displayedDays.map((d) => {
              const dKey = dateKey(d);
              const isToday = dKey === todayKey;
              const isSelected = dKey === selectedDateKey;

              return (
                <div
                  key={dKey}
                  onClick={() => setSelectedDateKey(dKey)}
                  className="flex cursor-pointer items-stretch border-r border-slate-200 p-1.5 last:border-r-0"
                >
                  <div
                    className={`flex w-full flex-col items-center justify-center rounded-xl px-3 py-2.5 transition-all ${
                      isSelected
                        ? "border-2 border-blue-500 bg-[#dfeafe] font-bold text-blue-950 shadow-2xs"
                        : isToday
                        ? "border border-blue-200 bg-blue-50/40 text-slate-800 hover:bg-blue-50/70"
                        : "border border-transparent text-slate-700 hover:bg-slate-100/70"
                    }`}
                  >
                    <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? "text-blue-900" : "text-slate-700"}`}>
                      {d.toLocaleDateString(language === "id" ? "id-ID" : "en-GB", { weekday: "short" })}
                    </span>
                    <span className={`mt-0.5 text-sm ${isSelected ? "font-bold text-blue-950" : "font-medium text-slate-600"}`}>
                      {d.getDate()}{" "}
                      {d.toLocaleDateString(language === "id" ? "id-ID" : "en-GB", { month: "short" })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hour Rows */}
          <div>
            {hours.map((hour) => {
              const timeStr = `${String(hour).padStart(2, "0")}:00`;

              return (
                <div
                  key={hour}
                  className="group/hour grid min-h-[74px] border-b border-slate-200 transition-colors hover:bg-slate-50/25 last:border-b-0"
                  style={{
                    gridTemplateColumns:
                      viewMode === "day"
                        ? "64px 1fr"
                        : `80px repeat(${displayedDays.length}, minmax(130px, 1fr))`,
                  }}
                >
                  {/* Y-Axis Hour Label */}
                  <div className="flex items-start justify-center border-r border-slate-200 p-2.5 text-xs font-medium text-slate-400">
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-slate-400 transition-all duration-150 group-hover/hour:bg-[#4589f5] group-hover/hour:text-white group-hover/hour:shadow-2xs">
                      {timeStr}
                    </span>
                  </div>

                  {/* Day Slot Cells */}
                  {displayedDays.map((d) => {
                    const dKey = dateKey(d);
                    const isPast = dKey < todayKey || (dKey === todayKey && hour * 60 <= jakartaMinutes());
                    const slotMeetings = getMeetingsForSlot(dKey, hour);

                    return (
                      <div
                        key={`${dKey}-${hour}`}
                        className={`relative border-r border-slate-200 p-1.5 transition-colors last:border-r-0 ${
                          dKey === selectedDateKey ? "bg-blue-50/15" : ""
                        }`}
                      >
                        {slotMeetings.length > 0 ? (
                          /* If Slot has Meetings */
                          <div className="flex h-full flex-col gap-1">
                            {slotMeetings.slice(0, 1).map(({ customer, meeting }) => {
                              const meetingTitle = meeting.agenda || "Meeting";
                              const colorStyle = getMeetingColorStyle(meetingTitle, meeting.status);

                              return (
                                <div
                                  key={meeting.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMeeting({ customer, meeting });
                                    setEditingMeeting(false);
                                    setMutationError("");
                                  }}
                                  className={`flex h-full w-full cursor-pointer flex-col justify-center rounded-lg p-2 text-xs shadow-2xs transition-transform hover:-translate-y-0.5 hover:shadow-xs ${colorStyle}`}
                                >
                                  <div className="truncate font-semibold leading-tight">
                                    {meetingTitle} – {customer.companyName}
                                  </div>
                                  <div className="mt-0.5 text-[11px] opacity-80">
                                    {meeting.startTime?.slice(0, 5)} - {meeting.endTime?.slice(0, 5)}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Overlap Indicator Badge if multiple meetings in slot */}
                            {slotMeetings.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMultiMeetingSlot({ date: dKey, hour, meetings: slotMeetings });
                                }}
                                className="mt-0.5 inline-flex items-center justify-center rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-200 shadow-2xs"
                              >
                                +{slotMeetings.length - 1} meeting{slotMeetings.length > 2 ? "s" : ""}
                              </button>
                            )}
                          </div>
                        ) : isPast ? (
                          /* Past Empty Slot: Disabled with Hover Tooltip Notification */
                          <div
                            onClick={() => {
                              setPastSlotNotice(`Waktu ${timeStr} pada tanggal ini sudah terlewat.`);
                              setTimeout(() => setPastSlotNotice(""), 3500);
                            }}
                            className="group/past relative flex h-full min-h-[56px] w-full cursor-not-allowed items-center justify-center rounded-lg bg-slate-50/50 p-1 transition-colors hover:bg-slate-100/70"
                          >
                            <span className="text-[11px] font-medium text-slate-300 select-none">
                              —
                            </span>
                            {/* Hover Notification Tooltip */}
                            <div className="pointer-events-none absolute -top-9 left-1/2 z-30 -translate-x-1/2 opacity-0 group-hover/past:opacity-100 transition-opacity duration-150">
                              <div className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-xl">
                                ⚠️ Waktu sudah terlewat
                              </div>
                              <div className="mx-auto h-1.5 w-1.5 -translate-y-1 rotate-45 bg-slate-900" />
                            </div>
                          </div>
                        ) : (
                          /* Active Empty Slot: Clickable to add meeting */
                          <div
                            onClick={() => beginAdd(dKey, timeStr)}
                            className="group flex h-full min-h-[56px] w-full cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-blue-50/50"
                          >
                            <span className="opacity-0 group-hover:opacity-100 text-xs font-semibold text-blue-600 transition-opacity">
                              + Add
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CREATE / ADD MEETING MODAL */}
      {slotToBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setSlotToBook(null);
          }}
        >
          <form
            onSubmit={handleSaveMeeting}
            className="my-auto w-full max-w-5xl rounded-2xl bg-white px-6 py-6 shadow-2xl sm:px-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">{t("meetingSchedule.createMeeting", "Add Meeting")}</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSlotToBook(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {availableCustomers.length === 0 && (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
                  No assigned companies found. Please add a company in Company List first before scheduling meetings.
                </div>
              )}
              <MeetingField label="Company" required>
                <select
                  required
                  value={form.companyId}
                  onChange={(event) => {
                    const customer = customers.find((item) => item.id === event.target.value);
                    updateForm("companyId", event.target.value);
                    if (customer) updateForm("picName", customer.primaryPic?.fullName || "");
                  }}
                  className={inputClass}
                >
                  <option value="">Select company</option>
                  {availableCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.companyName}
                    </option>
                  ))}
                </select>
              </MeetingField>
              <MeetingField label="Date" required>
                <input
                  required
                  type="date"
                  min={jakartaDateKey()}
                  value={form.date}
                  onChange={(event) => updateForm("date", event.target.value)}
                  className={inputClass}
                />
              </MeetingField>
              <MeetingField label="Time" required>
                <select
                  required
                  value={form.startTime}
                  onChange={(event) => updateForm("startTime", event.target.value)}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select a time slot
                  </option>
                  {selectableSlots.map((slot) => (
                    <option key={slot.start} value={slot.start}>
                      {slot.start} - {slot.end}
                    </option>
                  ))}
                </select>
              </MeetingField>
              <MeetingField label="Agenda / Topic" required>
                <input
                  required
                  maxLength={200}
                  value={form.agenda}
                  onChange={(event) => updateForm("agenda", event.target.value)}
                  placeholder="Enter agenda (e.g. Follow Up, Meeting, Discussion)"
                  className={inputClass}
                />
              </MeetingField>
              <MeetingField label="PIC Name" required>
                <input
                  required
                  readOnly
                  value={form.picName}
                  placeholder="Select a company first"
                  className={`${inputClass} cursor-not-allowed bg-slate-50`}
                />
              </MeetingField>
              <MeetingField label="Andima Representative" required>
                <input
                  required
                  value={form.representative}
                  onChange={(event) => updateForm("representative", event.target.value)}
                  placeholder="Representative name"
                  className={inputClass}
                />
              </MeetingField>
              <MeetingField label="Meeting Type" required>
                <div className="flex flex-wrap gap-6 pt-2">
                  <RadioChoice
                    name="meeting-type"
                    checked={form.meetingType === "offline"}
                    onChange={() => updateForm("meetingType", "offline")}
                    label="Offline (Location)"
                  />
                  <RadioChoice
                    name="meeting-type"
                    checked={form.meetingType === "online"}
                    onChange={() => updateForm("meetingType", "online")}
                    label="Online (Link)"
                  />
                </div>
              </MeetingField>
              {form.meetingType === "offline" ? (
                <MeetingField label="Location" required>
                  <input
                    required
                    value={form.location}
                    onChange={(event) => updateForm("location", event.target.value)}
                    placeholder="Enter location"
                    className={inputClass}
                  />
                </MeetingField>
              ) : (
                <MeetingField label="Meeting Link" required>
                  <input
                    required
                    type="url"
                    value={form.meetingLink}
                    onChange={(event) => updateForm("meetingLink", event.target.value)}
                    placeholder="https://"
                    className={inputClass}
                  />
                </MeetingField>
              )}
              <MeetingField label="Frequency" required>
                <div className="flex flex-wrap gap-6 pt-2">
                  <RadioChoice
                    name="meeting-frequency"
                    checked={form.frequency === "one_day"}
                    onChange={() => updateForm("frequency", "one_day")}
                    label="One-time"
                  />
                  <RadioChoice
                    name="meeting-frequency"
                    checked={form.frequency === "weekly"}
                    onChange={() => updateForm("frequency", "weekly")}
                    label="Weekly (repeats until canceled)"
                  />
                </div>
              </MeetingField>
              <MeetingField label="Notes">
                <div>
                  <textarea
                    maxLength={500}
                    rows={3}
                    value={form.notes}
                    onChange={(event) => updateForm("notes", event.target.value)}
                    placeholder="Enter notes (optional)"
                    className={`${inputClass} resize-y`}
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">{form.notes.length}/500</p>
                </div>
              </MeetingField>
            </div>

            {mutationError && (
              <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                {mutationError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setSlotToBook(null)}
                className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="submit"
                disabled={saving || availableCustomers.length === 0}
                className="rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? t("customer.saving", "Saving...") : t("common.save", "Save Meeting")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MEETING DETAILS / EDIT MODAL */}
      {selectedMeeting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setSelectedMeeting(null);
              setEditingMeeting(false);
            }
          }}
        >
          {editingMeeting ? (
            <form
              onSubmit={handleSaveMeeting}
              className="my-auto w-full max-w-5xl rounded-2xl bg-white px-6 py-6 shadow-2xl sm:px-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">{t("meetingSchedule.editMeeting", "Edit Meeting")}</h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setEditingMeeting(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <MeetingField label="Company" required>
                  <select
                    required
                    disabled
                    value={form.companyId}
                    className={`${inputClass} cursor-not-allowed bg-slate-50`}
                  >
                    <option value={selectedMeeting.customer.id}>
                      {selectedMeeting.customer.companyName}
                    </option>
                  </select>
                </MeetingField>
                <MeetingField label="Date" required>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(event) => updateForm("date", event.target.value)}
                    className={inputClass}
                  />
                </MeetingField>
                <MeetingField label="Time" required>
                  <select
                    required
                    value={form.startTime}
                    onChange={(event) => updateForm("startTime", event.target.value)}
                    className={inputClass}
                  >
                    {meetingSlots.map((slot) => (
                      <option key={slot.start} value={slot.start}>
                        {slot.start} - {slot.end}
                      </option>
                    ))}
                  </select>
                </MeetingField>
                <MeetingField label="Agenda / Topic" required>
                  <input
                    required
                    maxLength={200}
                    value={form.agenda}
                    onChange={(event) => updateForm("agenda", event.target.value)}
                    placeholder="Enter agenda"
                    className={inputClass}
                  />
                </MeetingField>
                <MeetingField label="PIC Name" required>
                  <input
                    required
                    readOnly
                    value={form.picName}
                    className={`${inputClass} cursor-not-allowed bg-slate-50`}
                  />
                </MeetingField>
                <MeetingField label="Andima Representative" required>
                  <input
                    required
                    value={form.representative}
                    onChange={(event) => updateForm("representative", event.target.value)}
                    className={inputClass}
                  />
                </MeetingField>
                <MeetingField label="Meeting Type" required>
                  <div className="flex flex-wrap gap-6 pt-2">
                    <RadioChoice
                      name="edit-meeting-type"
                      checked={form.meetingType === "offline"}
                      onChange={() => updateForm("meetingType", "offline")}
                      label="Offline (Location)"
                    />
                    <RadioChoice
                      name="edit-meeting-type"
                      checked={form.meetingType === "online"}
                      onChange={() => updateForm("meetingType", "online")}
                      label="Online (Link)"
                    />
                  </div>
                </MeetingField>
                {form.meetingType === "offline" ? (
                  <MeetingField label="Location" required>
                    <input
                      required
                      value={form.location}
                      onChange={(event) => updateForm("location", event.target.value)}
                      className={inputClass}
                    />
                  </MeetingField>
                ) : (
                  <MeetingField label="Meeting Link" required>
                    <input
                      required
                      type="url"
                      value={form.meetingLink}
                      onChange={(event) => updateForm("meetingLink", event.target.value)}
                      className={inputClass}
                    />
                  </MeetingField>
                )}
                <MeetingField label="Frequency" required>
                  <div className="flex flex-wrap gap-6 pt-2">
                    <RadioChoice
                      name="edit-meeting-frequency"
                      checked={form.frequency === "one_day"}
                      onChange={() => updateForm("frequency", "one_day")}
                      label="One-time"
                    />
                    <RadioChoice
                      name="edit-meeting-frequency"
                      checked={form.frequency === "weekly"}
                      onChange={() => updateForm("frequency", "weekly")}
                      label="Weekly (repeats until canceled)"
                    />
                  </div>
                </MeetingField>
                <MeetingField label="Notes">
                  <div>
                    <textarea
                      maxLength={500}
                      rows={3}
                      value={form.notes}
                      onChange={(event) => updateForm("notes", event.target.value)}
                      placeholder="Enter notes (optional)"
                      className={`${inputClass} resize-y`}
                    />
                    <p className="mt-1 text-right text-xs text-slate-400">{form.notes.length}/500</p>
                  </div>
                </MeetingField>
              </div>

              {mutationError && (
                <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                  {mutationError}
                </p>
              )}

              <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setEditingMeeting(false)}
                  className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? t("customer.saving", "Saving...") : t("common.save", "Save Changes")}
                </button>
              </div>
            </form>
          ) : (
            <div className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <h2 className="text-xl font-bold text-slate-900">{t("meetingSchedule.meetingDetails", "Meeting Details")}</h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setSelectedMeeting(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5 px-6 py-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-[minmax(130px,0.75fr)_minmax(0,1.25fr)] gap-x-4 gap-y-5 text-sm">
                  <DetailRow label="Company" value={selectedMeeting.customer.companyName} />
                  <DetailRow
                    label="Date & Time"
                    value={`${
                      selectedMeeting.meeting.scheduleType === "one_day" && selectedMeeting.meeting.meetingDate
                        ? selectedMeeting.meeting.meetingDate
                        : selectedMeeting.meeting.meetingDay || selectedDateKey
                    }, ${selectedMeeting.meeting.startTime?.slice(0, 5)} - ${selectedMeeting.meeting.endTime?.slice(0, 5)}`}
                  />
                  <DetailRow label="Agenda / Topic" value={selectedMeeting.meeting.agenda || "Not provided"} />
                  <DetailRow
                    label="PIC"
                    value={selectedMeeting.meeting.picName || selectedMeeting.customer.primaryPic?.fullName || "Not provided"}
                  />
                  <DetailRow
                    label="PIC Phone Number"
                    value={selectedMeeting.customer.primaryPic?.phoneNumber || "Not provided"}
                  />
                  <DetailRow
                    label="Andima Representative"
                    value={selectedMeeting.meeting.representativeName || "Not provided"}
                  />
                  <DetailRow
                    label="Meeting Type"
                    value={selectedMeeting.meeting.meetingType === "online" ? "Online (Link)" : "Offline (Location)"}
                  />
                  <DetailRow
                    label={selectedMeeting.meeting.meetingType === "online" ? "Meeting Link" : "Location"}
                    value={
                      selectedMeeting.meeting.meetingType === "online"
                        ? selectedMeeting.meeting.meetingLink || "Not provided"
                        : selectedMeeting.meeting.location || selectedMeeting.customer.address || "Not provided"
                    }
                  />
                  <dt className="text-slate-500">Status</dt>
                  <dd>
                    {selectedMeeting.meeting.status === "completed" ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                        Completed
                      </span>
                    ) : (
                      <select
                        aria-label="Meeting status"
                        disabled={saving}
                        value={selectedMeeting.meeting.status || "scheduled"}
                        onChange={(event) =>
                          void changeMeetingStatus(event.target.value as "scheduled" | "completed" | "cancelled")
                        }
                        className={`rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold disabled:opacity-60 ${
                          selectedMeeting.meeting.status === "cancelled"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Canceled</option>
                      </select>
                    )}
                  </dd>
                  <DetailRow
                    label="Frequency"
                    value={selectedMeeting.meeting.scheduleType === "weekly" ? "Weekly" : "One-time"}
                  />
                  <DetailRow label="Notes" value={selectedMeeting.meeting.notes || "No notes"} />
                </div>

                {selectedMeeting.meeting.status === "completed" && (
                  <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                    This completed meeting is read-only.
                  </p>
                )}
                {mutationError && <p role="alert" className="text-sm text-rose-600">{mutationError}</p>}
              </div>

              {/* Bottom buttons: + Record Conversation, Delete, Edit */}
              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  disabled={
                    selectedMeeting.meeting.status !== "completed" &&
                    !isMeetingPast(selectedMeeting.meeting, selectedDateKey)
                  }
                  onClick={() =>
                    router.push(
                      `/dashboard/record-conversation?customer_id=${encodeURIComponent(
                        selectedMeeting.customer.id
                      )}&customer_name=${encodeURIComponent(
                        selectedMeeting.customer.companyName
                      )}&meeting_id=${encodeURIComponent(
                        selectedMeeting.meeting.id
                      )}&source_meeting_id=${encodeURIComponent(selectedMeeting.meeting.id)}`
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs"
                >
                  {t("meetingSchedule.recordConversationBtn", "+ Record Conversation")}
                </button>
                {selectedMeeting.meeting.status !== "completed" && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete", "Delete")}
                  </button>
                )}
                {selectedMeeting.meeting.status !== "completed" && (
                  <button
                    type="button"
                    onClick={beginEdit}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Pencil className="h-4 w-4" />
                    {t("common.edit", "Edit")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmOpen && selectedMeeting && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setDeleteConfirmOpen(false);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-meeting-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <h2 id="delete-meeting-title" className="text-lg font-bold text-slate-900">
                  Delete meeting?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Delete the meeting for <strong>{selectedMeeting.customer.companyName}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            {mutationError && (
              <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                {mutationError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => setDeleteConfirmOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void deleteSelectedMeeting()}
                className="inline-flex min-w-24 items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {saving ? t("common.loading", "Deleting...") : t("common.delete", "Delete")}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* MULTI-MEETING SLOT OVERLAP MODAL */}
      {multiMeetingSlot && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/75 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMultiMeetingSlot(null);
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Meetings at {String(multiMeetingSlot.hour).padStart(2, "0")}:00 ({multiMeetingSlot.date})
                </h2>
                <p className="text-xs text-slate-500">
                  {multiMeetingSlot.meetings.length} scheduled meetings in this time slot
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMultiMeetingSlot(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {multiMeetingSlot.meetings.map(({ customer, meeting }) => {
                const meetingStatus = meeting.status || "scheduled";
                const statusBadge =
                  meetingStatus === "completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : meetingStatus === "cancelled"
                    ? "bg-slate-100 text-slate-600 border-slate-200"
                    : "bg-blue-50 text-blue-700 border-blue-200";

                return (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition-colors hover:border-blue-300 hover:bg-slate-50/60"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">{customer.companyName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {meeting.startTime?.slice(0, 5)} - {meeting.endTime?.slice(0, 5)} · Topic: {meeting.agenda || "General meeting"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        PIC: {meeting.picName || customer.primaryPic?.fullName || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadge}`}>
                        {meetingStatus === "completed" ? "Completed" : meetingStatus === "cancelled" ? "Canceled" : "Scheduled"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMeeting({ customer, meeting });
                          setMultiMeetingSlot(null);
                          setEditingMeeting(false);
                        }}
                        className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-2xs"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setMultiMeetingSlot(null)}
                className="rounded-lg border border-slate-300 px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function MeetingField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(180px,0.62fr)_minmax(0,1fr)] sm:items-center">
      <label className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function RadioChoice({ name, checked, onChange, label }: { name: string; checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="h-4 w-4 accent-blue-600" />
      {label}
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-words font-semibold text-slate-800">{value}</dd>
    </>
  );
}
