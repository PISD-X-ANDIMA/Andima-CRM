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
      a1_customers: {
        Row: {
          id: string;
          company_name: string;
          address: string | null;
          pic_name: string | null;
          pic_phone: string | null;
          created_by: string | null;
          created_by_name: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          address?: string | null;
          pic_name?: string | null;
          pic_phone?: string | null;
          created_by?: string | null;
          created_by_name?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          address?: string | null;
          pic_name?: string | null;
          pic_phone?: string | null;
          created_by?: string | null;
          created_by_name?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      a1_meetings: {
        Row: {
          id: string;
          customer_id: string;
          created_by: string | null;
          agenda: string;
          meeting_date: string | null;
          start_time: string;
          end_time: string | null;
          meeting_day: string | null;
          schedule_type: ScheduleType;
          effective_start_date: string | null;
          pic_name: string | null;
          representative_name: string | null;
          meeting_type: "offline" | "online";
          location: string | null;
          meeting_link: string | null;
          notes: string | null;
          status: "scheduled" | "completed" | "cancelled";
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          created_by?: string | null;
          agenda: string;
          meeting_date?: string | null;
          start_time: string;
          end_time?: string | null;
          meeting_day?: string | null;
          schedule_type?: ScheduleType;
          effective_start_date?: string | null;
          pic_name?: string | null;
          representative_name?: string | null;
          meeting_type?: "offline" | "online";
          location?: string | null;
          meeting_link?: string | null;
          notes?: string | null;
          status?: "scheduled" | "completed" | "cancelled";
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          created_by?: string | null;
          agenda?: string;
          meeting_date?: string | null;
          start_time?: string;
          end_time?: string | null;
          meeting_day?: string | null;
          schedule_type?: ScheduleType;
          effective_start_date?: string | null;
          pic_name?: string | null;
          representative_name?: string | null;
          meeting_type?: "offline" | "online";
          location?: string | null;
          meeting_link?: string | null;
          notes?: string | null;
          status?: "scheduled" | "completed" | "cancelled";
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      a2_record_conversations: {
        Row: {
          id: string;
          customer_id: string;
          meeting_id: string | null;
          created_by: string | null;
          channel: string;
          summary: string;
          need_assist: boolean;
          attachment_url: string | null;
          conversation_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          meeting_id?: string | null;
          created_by?: string | null;
          channel?: string;
          summary: string;
          need_assist?: boolean;
          attachment_url?: string | null;
          conversation_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          meeting_id?: string | null;
          created_by?: string | null;
          channel?: string;
          summary?: string;
          need_assist?: boolean;
          attachment_url?: string | null;
          conversation_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      a2_conversation_alerts: {
        Row: {
          id: string;
          conversation_id: string;
          manager_id: string | null;
          status: "Pending" | "Reviewed";
          alerted_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          manager_id?: string | null;
          status?: "Pending" | "Reviewed";
          alerted_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          manager_id?: string | null;
          status?: "Pending" | "Reviewed";
          alerted_at?: string;
        };
      };
      corp_jobs: {
        Row: {
          id: string;
          job_number: string;
          customer_id: string | null;
          origin: string | null;
          destination: string | null;
          job_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_number: string;
          customer_id?: string | null;
          origin?: string | null;
          destination?: string | null;
          job_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_number?: string;
          customer_id?: string | null;
          origin?: string | null;
          destination?: string | null;
          job_type?: string | null;
          created_at?: string;
        };
      };
      a3_tasks: {
        Row: {
          id: string;
          job_id: string;
          field_agent_id: string | null;
          status: "Completed" | "Has Issue";
          issue_description: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          field_agent_id?: string | null;
          status?: "Completed" | "Has Issue";
          issue_description?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          field_agent_id?: string | null;
          status?: "Completed" | "Has Issue";
          issue_description?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      a3_task_handovers: {
        Row: {
          id: string;
          task_id: string;
          latitude: number | null;
          longitude: number | null;
          actual_weight_kg: number | null;
          total_koli: number | null;
          handover_time: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          latitude?: number | null;
          longitude?: number | null;
          actual_weight_kg?: number | null;
          total_koli?: number | null;
          handover_time?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          latitude?: number | null;
          longitude?: number | null;
          actual_weight_kg?: number | null;
          total_koli?: number | null;
          handover_time?: string;
        };
      };
      a3_task_documents: {
        Row: {
          id: string;
          task_id: string;
          doc_type: "4_photos" | "main_doc" | "support_doc" | "msds";
          file_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          doc_type: "4_photos" | "main_doc" | "support_doc" | "msds";
          file_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          doc_type?: "4_photos" | "main_doc" | "support_doc" | "msds";
          file_url?: string;
          created_at?: string;
        };
      };
      a2_field_task_notes: {
        Row: {
          id: string;
          task_id: string;
          sales_id: string | null;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          sales_id?: string | null;
          notes: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          sales_id?: string | null;
          notes?: string;
          created_at?: string;
        };
      };
    };
  };
}
