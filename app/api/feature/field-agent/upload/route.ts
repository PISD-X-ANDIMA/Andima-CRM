import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET_CANDIDATES = ['A3-field-agent-documents.', 'A3-field-agent-documents', 'a3-cargo-files'];

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  // Gunakan service role key jika ada untuk bypass RLS storage, atau anon key
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'placeholder-key';

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawJobNumber = (formData.get('jobNumber') as string) || 'GENERAL';
    const fileCategory = (formData.get('category') as string) || (formData.get('fileType') as string) || 'document';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Berkas tidak ditemukan. Parameter "file" wajib disertakan.' },
        { status: 400 }
      );
    }

    // 1. Validasi Batas Ukuran File (Maksimal 5 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          success: false,
          error: `Ukuran berkas "${file.name}" (${fileSizeMb} MB) melebihi batas maksimal 5 MB.`,
        },
        { status: 413 }
      );
    }

    const cleanJobNo = rawJobNumber.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = sanitizedFileName.split('.').pop()?.toLowerCase() || 'bin';
    const fileSizeKb = Math.round(file.size / 1024) || 1;
    const storagePath = `${cleanJobNo}/${fileCategory}_${Date.now()}_${sanitizedFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Coba Unggah ke Supabase Storage (Bucket: A3-field-agent-documents)
    const supabase = getSupabaseClient();
    let fileUrl: string | null = null;
    let uploadMethod: 'supabase-storage' | 'local-fallback' = 'supabase-storage';

    let supabaseErrorMessage: string | null = null;
    let successfulBucket = BUCKET_CANDIDATES[0];

    for (const candidateBucket of BUCKET_CANDIDATES) {
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(candidateBucket)
          .upload(storagePath, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: true,
          });

        if (uploadError) {
          supabaseErrorMessage = uploadError.message;
          console.warn(`[FieldAgent Upload] Warning uploading to bucket "${candidateBucket}":`, uploadError.message);
          continue;
        }

        if (uploadData) {
          const { data: urlData } = supabase.storage.from(candidateBucket).getPublicUrl(storagePath);
          if (urlData?.publicUrl) {
            fileUrl = urlData.publicUrl;
            successfulBucket = candidateBucket;
            uploadMethod = 'supabase-storage';
            supabaseErrorMessage = null;
            break;
          }
        }
      } catch (storageErr: any) {
        supabaseErrorMessage = storageErr?.message;
        console.warn(`[FieldAgent Upload] Exception during upload to "${candidateBucket}":`, storageErr?.message);
      }
    }

    // 3. Fallback Aman: Simpan ke public/uploads jika storage cloud mengalami kendala
    if (!fileUrl) {
      try {
        uploadMethod = 'local-fallback';
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const localFileName = `${Date.now()}_${sanitizedFileName}`;
        const localFilePath = path.join(uploadsDir, localFileName);
        fs.writeFileSync(localFilePath, buffer);
        fileUrl = `/uploads/${localFileName}`;
      } catch (localErr) {
        console.error('[FieldAgent Upload] Local fallback failed:', localErr);
        throw new Error('Gagal menyimpan berkas ke storage maupun penyimpanan server.');
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Berkas berhasil diunggah.',
        data: {
          file_name: file.name,
          file_url: fileUrl,
          file_size_kb: fileSizeKb,
          file_type: ext,
          category: fileCategory,
          bucket: successfulBucket,
          storage_method: uploadMethod,
          ...(uploadMethod === 'local-fallback' && supabaseErrorMessage ? { fallback_reason: supabaseErrorMessage } : {}),
          uploaded_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[FieldAgent Upload] Handler error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Terjadi kesalahan server saat memproses upload berkas.' },
      { status: 500 }
    );
  }
}
