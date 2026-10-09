import { MeetingDay, ScheduleType } from "./database";

export type { MeetingDay, ScheduleType };

export interface PrimaryContact {
  id: string;
  fullName: string;
  phoneNumber?: string;
  isPrimary?: boolean;
}

export interface ActiveMeeting {
  id: string;
  meetingDay: MeetingDay;
  scheduleType: ScheduleType;
  meetingDate?: string | null;
  startTime?: string;
  endTime?: string;
  effectiveStartDate?: string | null;
  agenda?: string | null;
  picName?: string | null;
  representativeName?: string | null;
  meetingType?: "offline" | "online";
  location?: string | null;
  meetingLink?: string | null;
  notes?: string | null;
  status?: "scheduled" | "completed" | "cancelled";
  occurrenceDate?: string | null;
  formattedSchedule: string;
}

export interface CustomerListItem {
  id: string;
  companyName: string;
  customerCode?: string | null;
  address?: string | null;
  /** Customer code from the existing customer_code field. */
  transactionNo?: string | null;
  /** Job number from the job_number field. */
  jobNumber?: string | null;
  /** Sales representative or creator from the created_by field. */
  createdBy?: string | null;
  /** Formatted creation date. */
  createdDate?: string | null;
  primaryPic: PrimaryContact | null;
  /** All active one-time and recurring meeting schedules for this company. */
  meetings?: ActiveMeeting[];
  /** Next upcoming active schedule, kept for compact Company List summaries. */
  meetingSchedule: ActiveMeeting | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerMeetingItem {
  id: string;
  companyId: string;
  meetingDay: MeetingDay;
  scheduleType: ScheduleType;
  meetingDate: string | null;
  startTime: string;
  endTime: string;
  effectiveStartDate: string | null;
  agenda?: string | null;
  picName?: string | null;
  representativeName?: string | null;
  meetingType?: "offline" | "online";
  location?: string | null;
  meetingLink?: string | null;
  notes?: string | null;
  status?: "scheduled" | "completed" | "cancelled";
  isActive: boolean;
  formattedSchedule: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerJobItem {
  id: string;
  companyId: string;
  transactionNo?: string | null;
  jobNumber: string;
  title: string;
  status: string;
  agentId?: string | null;
  agentName?: string | null;
  scheduledDate?: string | null;
  createdAt: string;
}

export interface CustomerDetailItem {
  id: string;
  companyName: string;
  customerCode?: string | null;
  transactionNo?: string | null;
  jobNumber?: string | null;
  createdBy?: string | null;
  address: string;
  salesId?: string | null;
  createdAt: string;
  updatedAt: string;
  primaryPic: PrimaryContact | null;
  activeMeeting: CustomerMeetingItem | null;
  meetings: CustomerMeetingItem[];
  jobs: CustomerJobItem[];
}

export interface DashboardSummaryData {
  totalCustomer: number;
  meetingThisWeek: {
    total: number;
    completed: number;
    upcoming: number;
  };
  unminutedMeetingsCount: number;
  sentMinutesCount: number;
}

export interface CalendarSlotMeeting {
  id: string;
  companyId: string;
  companyName: string;
  picName: string;
  picPhone: string;
  meetingDay: MeetingDay;
  scheduleType: ScheduleType;
  meetingDate?: string | null;
  startTime: string;
  endTime: string;
  status: "upcoming" | "completed"; // biru = upcoming, hijau = completed
}

export interface CalendarSlot {
  day: MeetingDay;
  dayLabel: string;
  dateStr: string; // YYYY-MM-DD
  timeSlot: string; // HH:00
  meeting: CalendarSlotMeeting | null;
}

export interface CreateCustomerInput {
  company_name: string;
  address: string;
  pic_full_name: string;
  pic_phone_number: string;
}

export interface UpdateCustomerInput {
  company_name?: string;
  address?: string;
  pic_full_name?: string;
  pic_phone_number?: string;
}

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    perPage?: number;
    totalPages?: number;
    format?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
  };
}

export interface ApiResponseError {
  success: false;
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;
