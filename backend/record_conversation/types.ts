export interface CompanyItem {
  company_list_id: string;
  job_number: string;
  name: string;
  company_name: string;
  created_by: string;
  customer_code: string | null;
}

export interface EmployeeItem {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  work_location?: string | null;
  avatar_url?: string | null;
}

export interface RecordConversationItem {
  id: string;
  job_number: string | null;
  customer_id: string;
  customer_code: string | null;
  sales_pic_id: string;
  channel_type: 'WhatsApp' | 'Meeting';
  conversation_date: string;
  summary: string;
  need_assistance: boolean;
  urgency_level: 'high_priority' | 'average' | 'critical' | 'standard' | null;
  synced_to_ctrack: boolean;
  document_urls?: string[] | null;
  status: 'active' | 'archived';
  created_by: string;
  created_at?: string;
  updated_at?: string;
  // Joined relation fields for UI
  company_name?: string;
  client_contact_name?: string;
  sales_pic_name?: string;
}

export interface ConversationFileItem {
  id: string;
  conversation_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size_kb: number | null;
  uploaded_by: string;
  uploaded_at?: string;
}

export interface WorksheetPhysicalItem {
  id: string;
  worksheet_id: number;
  item_label: string;
  item_value: string;
  item_unit: string | null;
  sort_order: number;
  created_at?: string;
}

export interface WorksheetPhotoItem {
  id: string;
  worksheet_id: number;
  photo_label: string;
  photo_status: string;
  photo_url: string | null;
  file_name: string | null;
  taken_at: string | null;
  is_verified: boolean;
  sort_order: number;
  created_at?: string;
}

export interface WorksheetDocumentItem {
  id: string;
  worksheet_id: number;
  doc_name: string;
  doc_type: string;
  file_size_kb: number | null;
  doc_url: string;
  doc_description: string | null;
  is_verified: boolean;
  uploaded_by?: string | null;
  uploaded_at?: string;
  created_at?: string;
}

export interface WorksheetChecklistItem {
  id: string;
  worksheet_id: number;
  check_label: string;
  is_verified: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
  sort_order: number;
  created_at?: string;
}

export interface WorksheetItem {
  worksheet_id: number;
  transaction_no: string;
  job_no: string;
  customer_id: string;
  created_by_user_id?: number | null;
  create_date: string;
  status_kendala: 'normal' | 'kendala_terdeteksi' | string;
  field_agent_id?: string | null;
  sales_pic_id?: string | null;
  shipper?: string | null;
  consignee?: string | null;
  mawb?: string | null;
  hawb?: string | null;
  handover_datetime?: string | null;
  handover_location?: string | null;
  pihak_penyerah?: string | null;
  pihak_penerima?: string | null;
  is_dangerous_goods: boolean;
  special_handling?: string | null;
  has_issue: boolean;
  issue_note?: string | null;
  is_exported_pdf: boolean;
  updated_at?: string;
  conversation_id?: string | null;
  // Joined / UI helper fields
  company_name?: string;
  field_agent_name?: string;
  field_agent_role?: string;
  field_agent_initials?: string;
  sales_pic_name?: string;
  // Child details
  physical_items?: WorksheetPhysicalItem[];
  photos?: WorksheetPhotoItem[];
  documents?: WorksheetDocumentItem[];
  checklists?: WorksheetChecklistItem[];
}

export interface NewConversationPayload {
  customer_id: string;
  customer_code?: string;
  channel_type: 'WhatsApp' | 'Meeting';
  conversation_date?: string;
  summary: string;
  need_assistance: boolean;
  urgency_level: 'high_priority' | 'average' | 'critical' | 'standard';
  synced_to_ctrack?: boolean;
  job_number?: string;
  uploaded_file?: {
    file_name: string;
    file_type: string;
    file_url: string;
    file_size_kb: number;
  } | null;
}

export interface DashboardStats {
  totalManagedCustomers: number;
  managedCustomersGrowth: string;
  upcomingMeetingsCount: number;
  upcomingMeetingNote: string;
  activeFieldIssuesCount: number;
  activeFieldIssuesNote: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
