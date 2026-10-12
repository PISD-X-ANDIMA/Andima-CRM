import { supabase } from './supabaseClient';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/lib/uploadLimits';

export { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB };

export interface UploadedFileMetadata {
  file_name: string;
  file_type: string;
  file_url: string;
  file_size_kb: number;
}

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'a2-record-documents';

/**
 * Validasi batas ukuran file 5 MB (semua format berkas diterima)
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran file "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal ${MAX_FILE_SIZE_MB} MB.`,
    };
  }

  return { valid: true };
}

/**
 * Mengunggah berkas percakapan langsung ke Supabase Storage (bucket: record-documents).
 */
export async function uploadConversationFile(file: File): Promise<{
  success: boolean;
  data?: UploadedFileMetadata;
  error?: string;
}> {
  try {
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const ext = (file.name.split('.').pop()?.toLowerCase() || 'bin').slice(0, 10);
    const fileSizeKb = Math.round(file.size / 1024) || 1;
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `conversations/${Date.now()}_${sanitizedFileName}`;

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
      console.error('Supabase storage upload error:', uploadError);
      const errMsg = uploadError.message || '';
      if (/mime\s*type|not\s*supported/i.test(errMsg)) {
        return {
          success: false,
          error: `Format berkas "${file.name}" belum didukung penyimpanan. Hubungi admin untuk menambahkan format ini.`,
        };
      }
      return { success: false, error: uploadError.message };
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
        file_url: publicUrlData.publicUrl,
        file_size_kb: fileSizeKb,
      },
    };
  } catch (err: any) {
    console.error('Upload exception:', err);
    return { success: false, error: err?.message || 'Gagal mengunggah berkas ke Supabase Storage' };
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
