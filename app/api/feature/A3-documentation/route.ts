import { NextRequest, NextResponse } from "next/server";
import {
  A3HttpError,
  a3ErrorResponse,
  getA3WriteClient,
  requireA3User,
  requireA3FieldAgent,
} from "@/lib/a3";

export const dynamic = "force-dynamic";

async function findTask(db: any, jobNumber: string) {
  const { data: job } = await db
    .from("corp_jobs")
    .select("id")
    .eq("job_number", jobNumber)
    .maybeSingle();
  if (!job) return null;
  const { data: task } = await db
    .from("a3_tasks")
    .select("id, field_agent_id")
    .eq("job_id", job.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return task || null;
}

export async function GET(request: NextRequest) {
  try {
    await requireA3User();
    const db = getA3WriteClient();
    const jobNumber = (request.nextUrl.searchParams.get("jobNumber") || "").trim();
    if (!jobNumber) throw new A3HttpError(400, "jobNumber is required.");
    const task = await findTask(db, jobNumber);
    if (!task) return NextResponse.json({ success: true, data: { photos: [], documents: [] } });

    const { data } = await db
      .from("a3_task_documents")
      .select("doc_type, file_url")
      .eq("task_id", task.id)
      .order("created_at", { ascending: true });
    const rows = data || [];

    return NextResponse.json({
      success: true,
      data: {
        photos: rows.filter((r: any) => r.doc_type === "4_photos").map((r: any) => r.file_url),
        documents: rows.filter((r: any) => r.doc_type !== "4_photos").map((r: any) => r.file_url),
      },
    });
  } catch (error) {
    return a3ErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const scope = await requireA3User();
    const agentId = requireA3FieldAgent(scope);
    const db = getA3WriteClient();
    const body = await request.json();

    const jobNumber = typeof body.jobNumber === "string" ? body.jobNumber.trim() : "";
    if (!jobNumber) throw new A3HttpError(400, "jobNumber is required.");
    const task = await findTask(db, jobNumber);
    if (!task) throw new A3HttpError(404, "Task not found for this job number.");
    if (task.field_agent_id && task.field_agent_id !== agentId) {
      throw new A3HttpError(403, "This task belongs to another field agent.");
    }

    const photos: string[] = Array.isArray(body.photos) ? body.photos.filter(Boolean) : [];
    const documents: string[] = Array.isArray(body.documents) ? body.documents.filter(Boolean) : [];
    if (photos.length === 0 && documents.length === 0) {
      throw new A3HttpError(400, "photos or documents are required.");
    }

    await db.from("a3_task_documents").delete().eq("task_id", task.id);

    const rows = [
      ...photos.map((url) => ({ task_id: task.id, doc_type: "4_photos", file_url: url })),
      ...documents.map((url, index) => ({
        task_id: task.id,
        doc_type: index === 0 ? "main_doc" : "support_doc",
        file_url: url,
      })),
    ];

    const { data, error } = await db.from("a3_task_documents").insert(rows).select();
    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        data: {
          photos: photos.length,
          documents: documents.length,
          rows: data,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return a3ErrorResponse(error);
  }
}
