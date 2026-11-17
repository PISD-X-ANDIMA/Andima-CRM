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
    .select("id, field_agent_id, issue_description, status, updated_at")
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
    return NextResponse.json({
      success: true,
      data: task?.issue_description
        ? [{
            id: task.id,
            category: "Field Issue",
            description: task.issue_description,
            status: "Open",
            reported_at: task.updated_at,
          }]
        : [],
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
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : "Issue recorded on field form";

    const task = await findTask(db, jobNumber);
    if (!task) throw new A3HttpError(404, "Task not found for this job number.");
    if (task.field_agent_id && task.field_agent_id !== agentId) {
      throw new A3HttpError(403, "This task belongs to another field agent.");
    }

    const { data, error } = await db
      .from("a3_tasks")
      .update({
        issue_description: description.slice(0, 2000),
        status: "Has Issue",
        field_agent_id: task.field_agent_id || agentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id)
      .select("id, status, issue_description, updated_at")
      .single();
    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: data.id,
          category: typeof body.category === "string" ? body.category : "Others/Lainnya",
          description: data.issue_description,
          status: "Open",
          reported_at: data.updated_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return a3ErrorResponse(error);
  }
}
