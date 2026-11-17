import { NextResponse } from "next/server";
import {
  A3HttpError,
  a3ErrorResponse,
  getA3WriteClient,
  requireA3User,
  requireA3FieldAgent,
} from "@/lib/a3";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const BUCKET = "A3-field-agent-documents.";
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export async function POST(request: Request) {
  try {
    const scope = await requireA3User();
    requireA3FieldAgent(scope);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const rawJobNumber = (formData.get("jobNumber") as string) || "GENERAL";
    const fileCategory = (formData.get("category") as string) || "document";

    if (!file) throw new A3HttpError(400, 'File not found. Parameter "file" is required.');
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new A3HttpError(413, `File "${file.name}" exceeds the 5 MB limit.`);
    }
    if (file.type && !ALLOWED_TYPES.has(file.type)) {
      throw new A3HttpError(415, `File type "${file.type}" is not allowed.`);
    }

    const cleanJobNo = rawJobNumber.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = sanitizedFileName.split(".").pop()?.toLowerCase() || "bin";
    const fileSizeKb = Math.round(file.size / 1024) || 1;
    const storagePath = `${cleanJobNo}/${fileCategory}_${Date.now()}_${sanitizedFileName}`;

    const db = getA3WriteClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });
    if (uploadError) throw new A3HttpError(500, uploadError.message);

    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(storagePath);

    return NextResponse.json(
      {
        success: true,
        message: "File successfully uploaded.",
        data: {
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size_kb: fileSizeKb,
          file_type: ext,
          category: fileCategory,
          uploaded_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return a3ErrorResponse(error);
  }
}
