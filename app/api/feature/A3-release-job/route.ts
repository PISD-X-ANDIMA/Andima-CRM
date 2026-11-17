import { NextRequest, NextResponse } from "next/server";
import {
  A3HttpError,
  a3ErrorResponse,
  getA3WriteClient,
  requireA3User,
  requireA3FieldAgent,
} from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const scope = await requireA3User();
    const agentId = requireA3FieldAgent(scope);
    const db = getA3WriteClient();
    const body = await request.json();

    const jobNumber = typeof body.jobNumber === "string" ? body.jobNumber.trim() : "";
    if (!jobNumber) throw new A3HttpError(400, "jobNumber is required.");

    const { data: job } = await db
      .from("corp_jobs")
      .select("id")
      .eq("job_number", jobNumber)
      .maybeSingle();
    if (!job) throw new A3HttpError(404, "Job not found.");

    const { data: task } = await db
      .from("a3_tasks")
      .select("id, field_agent_id")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!task) throw new A3HttpError(404, "Task not found.");
    if (task.field_agent_id && task.field_agent_id !== agentId) {
      throw new A3HttpError(403, "This task belongs to another field agent.");
    }

    const [{ count: docCount }, { count: handoverCount }] = await Promise.all([
      db.from("a3_task_documents").select("id", { count: "exact", head: true }).eq("task_id", task.id),
      db.from("a3_task_handovers").select("id", { count: "exact", head: true }).eq("task_id", task.id),
    ]);
    if ((docCount || 0) > 0 || (handoverCount || 0) > 0) {
      throw new A3HttpError(409, "Field data already submitted; this task cannot be released.");
    }

    const { error } = await db
      .from("a3_tasks")
      .update({ field_agent_id: null, updated_at: new Date().toISOString() })
      .eq("id", task.id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Job released." });
  } catch (error) {
    return a3ErrorResponse(error);
  }
}
