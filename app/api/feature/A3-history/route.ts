import { NextRequest, NextResponse } from "next/server";
import { A3HttpError, a3ErrorResponse, getA3WriteClient, requireA3User } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireA3User();
    const db = getA3WriteClient();
    const jobNumber = (request.nextUrl.searchParams.get("jobNumber") || "").trim();
    if (!jobNumber) throw new A3HttpError(400, "jobNumber is required.");

    const { data: job } = await db
      .from("corp_jobs")
      .select("id, job_number")
      .eq("job_number", jobNumber)
      .maybeSingle();
    if (!job) return NextResponse.json({ success: true, data: [] });

    const { data: task } = await db
      .from("a3_tasks")
      .select("id, status, issue_description, completed_at, created_at, updated_at")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const events: Array<{ activity: string; notes: string; created_at: string | null }> = [];
    if (task) {
      events.push({
        activity: "Task Created",
        notes: `Task assigned for ${job.job_number}`,
        created_at: task.created_at,
      });
      if (task.completed_at) {
        events.push({
          activity: "Task Completed",
          notes: `Status: ${task.status}`,
          created_at: task.completed_at,
        });
      }
      if (task.issue_description) {
        events.push({
          activity: "Issue Reported",
          notes: task.issue_description,
          created_at: task.updated_at,
        });
      }
    }

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    return a3ErrorResponse(error);
  }
}
