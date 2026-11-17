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
  return task ? { jobId: job.id, ...task } : null;
}

export async function GET(request: NextRequest) {
  try {
    await requireA3User();
    const db = getA3WriteClient();
    const jobNumber = (request.nextUrl.searchParams.get("jobNumber") || "").trim();
    if (!jobNumber) throw new A3HttpError(400, "jobNumber is required.");
    const task = await findTask(db, jobNumber);
    if (!task) return NextResponse.json({ success: true, data: null });
    const { data } = await db
      .from("a3_task_handovers")
      .select("*")
      .eq("task_id", task.id)
      .maybeSingle();
    return NextResponse.json({
      success: true,
      data: data
        ? {
            actual_pieces: data.total_koli,
            actual_gross_weight: data.actual_weight_kg,
            latitude: data.latitude,
            longitude: data.longitude,
            created_at: data.handover_time,
          }
        : null,
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

    const pieces = Number(body.actualPieces);
    const weight = Number(body.actualGrossWeight);
    if (!Number.isFinite(pieces) || pieces < 0) throw new A3HttpError(400, "actualPieces is invalid.");
    if (!Number.isFinite(weight) || weight < 0) throw new A3HttpError(400, "actualGrossWeight is invalid.");

    const handoverRow = {
      task_id: task.id,
      total_koli: pieces,
      actual_weight_kg: weight,
      latitude: body.gps?.latitude ?? null,
      longitude: body.gps?.longitude ?? null,
      handover_time: new Date().toISOString(),
    };

    const { data: existing } = await db
      .from("a3_task_handovers")
      .select("id")
      .eq("task_id", task.id)
      .maybeSingle();

    const { data, error } = existing
      ? await db.from("a3_task_handovers").update(handoverRow).eq("id", existing.id).select().single()
      : await db.from("a3_task_handovers").insert(handoverRow).select().single();
    if (error) throw error;

    // Claiming keeps the task with this agent; unassigned tasks become owned here.
    if (!task.field_agent_id) {
      await db
        .from("a3_tasks")
        .update({ field_agent_id: agentId, updated_at: new Date().toISOString() })
        .eq("id", task.id);
    }

    if (typeof body.location === "string" && body.location.trim()) {
      await db.from("a2_field_task_notes").insert({
        task_id: task.id,
        sales_id: null,
        notes: `Handover location: ${body.location.trim().slice(0, 400)}`,
      });
    }

    return NextResponse.json({ success: true, data }, { status: existing ? 200 : 201 });
  } catch (error) {
    return a3ErrorResponse(error);
  }
}
