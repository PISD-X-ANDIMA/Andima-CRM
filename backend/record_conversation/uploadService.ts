export interface UploadedFileMetadata {
  file_name: string;
  file_type: string;
  file_url: string;
  file_size_kb: number;
}

/**
 * Service simulasi upload file untuk modal REC.
 * Dirancang modular agar siap dialihkan ke service bucket storage asli
 * (Supabase Storage, AWS S3, atau Cloudflare R2) di masa depan.
 */
export async function simulateFileUpload(file: File): Promise<UploadedFileMetadata> {
  // Simulasi network latency upload (300ms)
  await new Promise((resolve) => setTimeout(resolve, 300));

  const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
  const fileSizeKb = Math.round(file.size / 1024) || 1;

  // URL fallback online standar publik yang aman & bebas hak cipta
  let sampleOnlineUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  if (ext === 'txt') {
    sampleOnlineUrl = 'https://raw.githubusercontent.com/mathiasbynens/utf8.js/master/tests/tests.js';
  }

  return {
    file_name: file.name,
    file_type: ext,
    file_url: sampleOnlineUrl,
    file_size_kb: fileSizeKb,
  };
}

/**
 * Helper untuk mengunggah berkas percakapan dengan penanganan respons standar.
 */
export async function uploadConversationFile(file: File): Promise<{
  success: boolean;
  data?: UploadedFileMetadata;
  error?: string;
}> {
  try {
    const data = await simulateFileUpload(file);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengunggah file' };
  }
}

/**
 * Placeholder untuk integrasi bucket storage nyata nantinya.
 */
export async function uploadToStorageBucket(
  _bucketName: string,
  file: File
): Promise<string> {
  // Nanti dapat diganti dengan client.storage.from(bucket).upload(...)
  const metadata = await simulateFileUpload(file);
  return metadata.file_url;
}
