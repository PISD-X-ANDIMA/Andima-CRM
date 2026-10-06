export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MeetingDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ScheduleType = "weekly" | "one_day";

export interface Database {
  public: {
    Tables: {
      a1_company_list: {
        Row: {
          company_list_id: string;
          customer_code: string | null;
          company_name: string;
          name: string;
          address: string | null;
          job_number: string | null;
          created_by: string;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          company_list_id?: string;
          customer_code?: string | null;
          company_name: string;
          name: string;
          address?: string | null;
          job_number?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          company_list_id?: string;
          customer_code?: string | null;
          company_name?: string;
          name?: string | null;
          address?: string | null;
          job_number?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      a1_customer_meetings: {
        Row: {
          id: string;
          company_id: string;
          meeting_day: MeetingDay;
          schedule_type: ScheduleType;
          meeting_date: string | null;
          start_time: string;
          end_time: string;
          effective_start_date: string | null;
          is_active: boolean;
          agenda: string;
          pic_name: string;
          representative_name: string;
          meeting_type: "offline" | "online";
          location: string | null;
          meeting_link: string | null;
          notes: string | null;
          status: "scheduled" | "completed" | "cancelled";
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          meeting_day: MeetingDay;
          schedule_type: ScheduleType;
          meeting_date?: string | null;
          start_time?: string;
          end_time?: string;
          effective_start_date?: string | null;
          is_active?: boolean;
          agenda: string;
          pic_name: string;
          representative_name: string;
          meeting_type?: "offline" | "online";
          location?: string | null;
          meeting_link?: string | null;
          notes?: string | null;
          status?: "scheduled" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          meeting_day?: MeetingDay;
          schedule_type?: ScheduleType;
          meeting_date?: string | null;
          start_time?: string;
          end_time?: string;
          effective_start_date?: string | null;
          is_active?: boolean;
          agenda?: string;
          pic_name?: string;
          representative_name?: string;
          meeting_type?: "offline" | "online";
          location?: string | null;
          meeting_link?: string | null;
          notes?: string | null;
          status?: "scheduled" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      a1_meeting_minutes: {
        Row: {
          id: string;
          meeting_id: string | null;
          company_id: string;
          sales_id: string;
          meeting_date: string;
          notes: string;
          status: "draft" | "sent_to_management";
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meeting_id?: string | null;
          company_id: string;
          sales_id: string;
          meeting_date?: string;
          notes: string;
          status?: "draft" | "sent_to_management";
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string | null;
          company_id?: string;
          sales_id?: string;
          meeting_date?: string;
          notes?: string;
          status?: "draft" | "sent_to_management";
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      a1_customer_jobs: {
        Row: {
          id: string;
          company_id: string;
          transaction_no: string | null;
          job_number: string;
          title: string;
          status: string;
          agent_id: string | null;
          scheduled_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          transaction_no?: string | null;
          job_number: string;
          title: string;
          status?: string;
          agent_id?: string | null;
          scheduled_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          transaction_no?: string | null;
          job_number?: string;
          title?: string;
          status?: string;
          agent_id?: string | null;
          scheduled_date?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
