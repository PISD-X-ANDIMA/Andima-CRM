import { NextResponse } from "next/server";
import { apiError, getA3Client } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = getA3Client();
    const [totalRes, draftRes, assignedRes, completedRes, hasIssueRes, recentRes] = await Promise.all([
      client.from("corp_jobs").select("id", { count: "exact", head: true }),
      client.from("a3_tasks").select("id", { count: "exact", head: true }).eq("status", "Draft"),
      client.from("a3_tasks").select("id", { count: "exact", head: true }).eq("status", "Assigned"),
      client.from("a3_tasks").select("id", { count: "exact", head: true }).eq("status", "Completed"),
      client.from("a3_tasks").select("id", { count: "exact", head: true }).eq("status", "Has Issue"),
      client.from("corp_jobs").select("id, job_number, origin, destination, job_type, customer_id").limit(5),
    ]);

    if (totalRes.error) throw new Error("Unable to load dashboard.");

    return NextResponse.json({
      success: true,
      data: {
        total: totalRes.count ?? 0,
        draft: draftRes.count ?? 0,
        inProgress: assignedRes.count ?? 0,
        completed: completedRes.count ?? 0,
        hasIssue: hasIssueRes.count ?? 0,
        recentJobs: recentRes.data ?? [],
      },
    });
  } catch (error) { return apiError(error); }
}
