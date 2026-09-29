"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, Phone, Users } from "lucide-react";
import { CalendarSlotMeeting, CustomerListItem, ApiResponse } from "@/types/customer";

type DayName = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const DAY_LABELS: Record<DayName, string> = {
  monday: "Senin",
  tuesday: "Selasa",
  wednesday: "Rabu",
  thursday: "Kamis",
  friday: "Jumat",
  saturday: "Sabtu",
  sunday: "Minggu",
};

const WEEKDAYS: DayName[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

function getWeekDates(offsetWeek = 0): Record<DayName, string> {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + offsetWeek * 7);

  const result: Partial<Record<DayName, string>> = {};
  WEEKDAYS.forEach((d, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + (d === "sunday" ? 6 : i));
    result[d] = date.toISOString().split("T")[0];
  });
  return result as Record<DayName, string>;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function formatWeekLabel(dates: Record<DayName, string>): string {
  const start = new Date(dates.monday + "T00:00:00");
  const end = new Date(dates.saturday + "T00:00:00");
  return `${formatDateShort(dates.monday)} – ${formatDateShort(dates.saturday)} ${end.getFullYear()}`;
}

interface MeetingEvent {
  companyId: string;
  companyName: string;
  picName: string;
  picPhone: string;
  day: DayName;
  startTime: string;
  endTime: string;
  status: "upcoming" | "completed";
  scheduleType: string;
}

export default function MeetingSchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState<MeetingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const weekDates = getWeekDates(weekOffset);
  const now = new Date();

  const loadMeetings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/customers?perPage=100");
      const json: ApiResponse<CustomerListItem[]> = await res.json();
      if (!json.success) return;

      const newEvents: MeetingEvent[] = [];
      for (const customer of json.data) {
        if (!customer.meetingSchedule) continue;
        const m = customer.meetingSchedule;

        let day = m.meetingDay as DayName;
        let meetingDateStr: string | null = null;

        if (m.scheduleType === "one_day") {
          if (!m.meetingDate) continue;
          meetingDateStr = m.meetingDate;
          // Hitung hari dari meetingDate
          const d = new Date(m.meetingDate + "T00:00:00");
          const dayNum = d.getDay();
          const dayKey = Object.entries({
            monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
            friday: 5, saturday: 6, sunday: 0,
          }).find(([, v]) => v === dayNum)?.[0] as DayName;
          if (!dayKey) continue;
          day = dayKey;

          // Apakah one_day ini jatuh pada minggu yang sedang ditampilkan?
          const weekDateStr = weekDates[day];
          if (meetingDateStr !== weekDateStr) continue;
        }

        // Tentukan status
        const endDateTime = new Date(`${weekDates[day]}T${m.endTime || "10:00"}:00`);
        const status: "upcoming" | "completed" = endDateTime > now ? "upcoming" : "completed";

        newEvents.push({
          companyId: customer.id,
          companyName: customer.companyName,
          picName: customer.primaryPic?.fullName || "—",
          picPhone: customer.primaryPic?.phoneNumber || "",
          day,
          startTime: m.startTime || "09:00",
          endTime: m.endTime || "10:00",
          status,
          scheduleType: m.scheduleType,
        });
      }

      setEvents(newEvents);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  function getEventsForSlot(day: DayName, timeSlot: string): MeetingEvent[] {
    return events.filter((e) => {
      if (e.day !== day) return false;
      const slotHour = parseInt(timeSlot.split(":")[0], 10);
      const startHour = parseInt((e.startTime || "00:00").split(":")[0], 10);
      const endHour = parseInt((e.endTime || "00:00").split(":")[0], 10);
      return slotHour >= startHour && slotHour < endHour;
    });
  }

  const todayStr = now.toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Jadwal Meeting
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kalender mingguan meeting customer Sales Executive.
          </p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-[180px] text-center">
            {formatWeekLabel(weekDates)}
          </div>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Minggu Ini
            </button>
          )}
        </div>
      </div>

      {/* Summary Strip */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="font-medium">{events.length}</span>
          <span className="text-slate-400">meeting minggu ini</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-xs text-slate-500">{events.filter(e => e.status === "upcoming").length} Akan Datang</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-500">{events.filter(e => e.status === "completed").length} Selesai</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* Day Headers */}
        <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: "72px repeat(6, 1fr)" }}>
          <div className="py-3 px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
            Jam
          </div>
          {WEEKDAYS.map((day) => {
            const dateStr = weekDates[day];
            const isToday = dateStr === todayStr;
            return (
              <div
                key={day}
                className={`py-3 px-2 text-center border-l border-slate-100 ${isToday ? "bg-blue-50/60" : ""}`}
              >
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${isToday ? "text-blue-600" : "text-slate-400"}`}>
                  {DAY_LABELS[day]}
                </p>
                <p className={`text-base font-bold mt-0.5 ${isToday ? "text-blue-700" : "text-slate-700"}`}>
                  {formatDateShort(dateStr).split(" ")[0]}
                </p>
                <p className="text-[10px] text-slate-400">
                  {formatDateShort(dateStr).split(" ")[1]}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time Slots */}
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Memuat jadwal...</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[520px]">
            {TIME_SLOTS.map((slot, slotIdx) => (
              <div
                key={slot}
                className={`grid border-b border-slate-50 min-h-[64px] ${slotIdx % 2 === 0 ? "" : "bg-slate-50/30"}`}
                style={{ gridTemplateColumns: "72px repeat(6, 1fr)" }}
              >
                {/* Time label */}
                <div className="flex items-start justify-center pt-2">
                  <span className="text-[11px] text-slate-400 font-mono">{slot}</span>
                </div>

                {/* Day cells */}
                {WEEKDAYS.map((day) => {
                  const cellEvents = getEventsForSlot(day, slot);
                  const isToday = weekDates[day] === todayStr;
                  return (
                    <div
                      key={day}
                      className={`border-l border-slate-100 px-1.5 py-1 ${isToday ? "bg-blue-50/30" : ""}`}
                    >
                      {cellEvents.map((evt, ei) => (
                        <div
                          key={`${evt.companyId}-${ei}`}
                          className={`rounded-lg px-2 py-1.5 mb-1 text-[11px] leading-snug cursor-default select-none ${
                            evt.status === "upcoming"
                              ? "bg-blue-500 text-white"
                              : "bg-emerald-500 text-white"
                          }`}
                          title={`${evt.companyName} | ${evt.picName} | ${evt.startTime}–${evt.endTime}`}
                        >
                          <p className="font-semibold truncate">{evt.companyName}</p>
                          <p className="text-white/80 truncate flex items-center gap-0.5 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {evt.startTime?.slice(0, 5)}–{evt.endTime?.slice(0, 5)}
                          </p>
                          <p className="text-white/70 truncate mt-0.5">
                            {evt.picName}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* List View Below */}
      {events.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">
              Detail Meeting Minggu Ini
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {events
              .sort((a, b) => {
                const dayOrder = WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day);
                if (dayOrder !== 0) return dayOrder;
                return (a.startTime || "").localeCompare(b.startTime || "");
              })
              .map((evt, idx) => (
                <div key={idx} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${evt.status === "upcoming" ? "bg-blue-500" : "bg-emerald-500"}`}
                  />
                  <div className="w-20 shrink-0">
                    <p className="text-xs font-semibold text-slate-700">{DAY_LABELS[evt.day]}</p>
                    <p className="text-[11px] text-slate-400">{formatDateShort(weekDates[evt.day])}</p>
                  </div>
                  <div className="w-24 shrink-0">
                    <p className="text-xs font-mono text-slate-600">
                      {evt.startTime?.slice(0, 5)} – {evt.endTime?.slice(0, 5)}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{evt.companyName}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {evt.picName}
                      {evt.picPhone && <span className="font-mono">· {evt.picPhone}</span>}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
                      evt.status === "upcoming"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {evt.status === "upcoming" ? "Akan Datang" : "Selesai"}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
