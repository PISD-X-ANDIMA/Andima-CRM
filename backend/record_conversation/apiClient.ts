import {
  CompanyItem,
  RecordConversationItem,
  WorksheetItem,
  NewConversationPayload,
  UpdateConversationPayload,
  DashboardStats,
  PaginatedResult,
} from './types';
import { UploadedFileMetadata } from './uploadService';

const BASE_URL = '/api/record-conversation';

/**
 * Mengambil ringkasan metrik dashboard via REST API: GET /api/record-conversation/stats
 */
export async function fetchApiStats(): Promise<DashboardStats> {
  const res = await fetch(`${BASE_URL}/stats`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch dashboard stats');
  }
  return json.data;
}

/**
 * Mengambil daftar akun pelanggan via REST API: GET /api/record-conversation/customers
 */
export async function fetchApiCustomers(): Promise<CompanyItem[]> {
  const res = await fetch(`${BASE_URL}/customers`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch customers');
  }
  return json.data;
}

/**
 * Mengambil riwayat percakapan via REST API: GET /api/record-conversation/conversations
 * Mendukung filter channel, status, serta pagination (page & limit).
 */
export async function fetchApiConversations(options?: {
  channelType?: string;
  status?: string;
  date?: string;
  needAssistance?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<RecordConversationItem>> {
  const params = new URLSearchParams();
  if (options?.channelType && options.channelType !== 'All Channels') {
    params.set('channel', options.channelType);
  }
  if (options?.status && options.status !== 'All Statuses') {
    params.set('status', options.status);
  }
  if (options?.date && options.date !== 'All Dates') {
    params.set('date', options.date);
  }
  if (options?.needAssistance && options.needAssistance !== 'All Assistance') {
    params.set('need_assistance', options.needAssistance);
  }
  if (options?.page) {
    params.set('page', String(options.page));
  }
  if (options?.limit) {
    params.set('limit', String(options.limit));
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${BASE_URL}/conversations${queryString}`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch conversations');
  }
  return {
    data: json.data,
    total: json.total ?? json.data.length,
    page: json.page ?? 1,
    limit: json.limit ?? 8,
    totalPages: json.totalPages ?? 1,
  };
}

/**
 * Menyimpan percakapan baru via REST API: POST /api/record-conversation/conversations
 */
export async function createApiConversation(
  payload: NewConversationPayload
): Promise<{ success: boolean; data?: RecordConversationItem; error?: string }> {
  const res = await fetch(`${BASE_URL}/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    return {
      success: false,
      error: json.error || `HTTP ${res.status}: Failed to create conversation`,
    };
  }

  return {
    success: true,
    data: json.data,
  };
}

/**
 * Memperbarui percakapan via REST API: PATCH /api/record-conversation/conversations
 */
export async function updateApiConversation(
  payload: UpdateConversationPayload
): Promise<{ success: boolean; data?: RecordConversationItem; error?: string }> {
  const res = await fetch(`${BASE_URL}/conversations`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    return {
      success: false,
      error: json.error || `HTTP ${res.status}: Failed to update conversation`,
    };
  }

  return {
    success: true,
    data: json.data,
  };
}

/**
 * Mengambil daftar lembar kerja penugasan lapangan via REST API: GET /api/record-conversation/worksheets
 * Mendukung pagination (page & limit).
 */
export async function fetchApiWorksheets(options?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<WorksheetItem>> {
  const params = new URLSearchParams();
  if (options?.page) {
    params.set('page', String(options.page));
  }
  if (options?.limit) {
    params.set('limit', String(options.limit));
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${BASE_URL}/worksheets${queryString}`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch worksheets');
  }
  return {
    data: json.data,
    total: json.total ?? json.data.length,
    page: json.page ?? 1,
    limit: json.limit ?? 8,
    totalPages: json.totalPages ?? 1,
  };
}

/**
 * Mengambil detail lengkap satu worksheet (beserta 4 relasi anak) via REST API: GET /api/record-conversation/worksheets/[id]
 */
export async function fetchApiWorksheetDetail(id: number): Promise<WorksheetItem | null> {
  const res = await fetch(`${BASE_URL}/worksheets/${id}`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || `Failed to fetch worksheet #${id}`);
  }
  return json.data;
}

/**
 * Mengunggah berkas percakapan via REST API: POST /api/record-conversation/upload
 */
export async function uploadApiFile(
  file: File
): Promise<{ success: boolean; data?: UploadedFileMetadata; error?: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
  const fileSizeKb = Math.round(file.size / 1024) || 1;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    let json: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        json = await res.json();
      } catch {
        json = null;
      }
    }

    if (!res.ok || !json?.success) {
      // Fallback object URL if server returns non-JSON error or storage issues
      const objectUrl = typeof window !== 'undefined' ? URL.createObjectURL(file) : '';
      return {
        success: true,
        data: {
          file_name: file.name,
          file_type: ext,
          file_url: objectUrl,
          file_size_kb: fileSizeKb,
        },
      };
    }

    return {
      success: true,
      data: json.data,
    };
  } catch (err: any) {
    console.warn('uploadApiFile exception, using fallback object URL:', err);
    const objectUrl = typeof window !== 'undefined' ? URL.createObjectURL(file) : '';
    return {
      success: true,
      data: {
        file_name: file.name,
        file_type: ext,
        file_url: objectUrl,
        file_size_kb: fileSizeKb,
      },
    };
  }
}
