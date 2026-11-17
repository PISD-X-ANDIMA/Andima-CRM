import { NextResponse } from "next/server";
import { apiError, getA3Client } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = getA3Client();
    const { data: jobsData, error: jobsError } = await client
      .from("corp_jobs")
      .select("id, job_number, origin, destination, job_type, customer_id");

    const { data: tasksData } = await client
      .from("a3_tasks")
      .select("id, job_id, status, issue_description, completed_at");

    if (jobsError) throw new Error("Unable to load dashboard.");
    const jobs = jobsData ?? [];
    const tasks = tasksData ?? [];
    const countStatus = (st: string) => tasks.filter((t: any) => t.status === st).length;

    return NextResponse.json({
      success: true,
      data: {
        total: jobs.length,
        draft: countStatus("Draft"),
        inProgress: countStatus("Assigned"),
        completed: countStatus("Completed"),
        hasIssue: countStatus("Has Issue"),
        recentJobs: jobs.slice(0, 5),
      },
    });
  } catch (error) { return apiError(error); }
}
