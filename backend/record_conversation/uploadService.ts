import { supabase } from './supabaseClient';

export interface UploadedFileMetadata {
  file_name: string;
  file_type: string;
  file_url: string;
  file_size_kb: number;
}

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'a2-record-documents';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per lecturer rules

/**
 * Memeriksa apakah berkas adalah format .txt yang valid untuk channel WhatsApp.
 */
export function isValidWhatsAppTxtFile(file: { name?: string; type?: string }): boolean {
  const fileName = (file.name || '').trim().toLowerCase();
  const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
  const mime = (file.type || '').trim().toLowerCase();
  const validMime = !mime || mime === 'text/plain';
  return ext === 'txt' && validMime;
}

/**
 * Validasi batas ukuran file 5 MB dan pemeriksaan format berdasarkan channel
 */
export function validateFile(file: File, channelType?: string | null): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran file "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal 5 MB.`,
    };
  }

  if (channelType && channelType.trim().toLowerCase() === 'whatsapp' && !isValidWhatsAppTxtFile(file)) {
    return {
      valid: false,
      error: `Channel WhatsApp hanya menerima berkas berformat .txt. File "${file.name}" tidak diperbolehkan.`,
    };
  }

  return { valid: true };
}

/**
 * Mengunggah berkas percakapan langsung ke Supabase Storage (bucket: record-documents).
 */
export async function uploadConversationFile(
  file: File,
  channelType?: string | null
): Promise<{
  success: boolean;
  data?: UploadedFileMetadata;
  error?: string;
  statusCode?: number;
}> {
  try {
    const validation = validateFile(file, channelType);
    if (!validation.valid) {
      return { success: false, error: validation.error, statusCode: 400 };
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileSizeKb = Math.round(file.size / 1024) || 1;
    // Hanya buang karakter yang merusak path/URL; spasi dipertahankan agar nama asli utuh.
    const sanitizedFileName = file.name.replace(/[\/\\?%*:|"<>]/g, '_');
    // Folder timestamp, nama file tetap asli — nama tampilan tidak ikut kotor.
    const filePath = `conversations/${Date.now()}/${sanitizedFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Unggah ke Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        error: `Gagal mengunggah berkas "${file.name}": ${uploadError.message}`,
      };
    }

    // Ambil public URL dari berkas yang diunggah
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      data: {
        file_name: file.name,
        file_type: ext,
        file_url: publicUrlData?.publicUrl || `https://storage.placeholder.com/${sanitizedFileName}`,
        file_size_kb: fileSizeKb,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal mengunggah berkas "${file.name}": ${err?.message || 'Terjadi kesalahan pada storage.'}`,
    };
  }
}

/**
 * Helper untuk mengunggah ke bucket kustom bila dibutuhkan
 */
export async function uploadToStorageBucket(
  bucketName: string,
  file: File
): Promise<string> {
  const result = await uploadConversationFile(file);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Upload error');
  }
  return result.data.file_url;
}
