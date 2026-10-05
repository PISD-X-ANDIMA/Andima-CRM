import { NextResponse } from "next/server";
import { apiError, getA3Client } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = getA3Client();
    const { data, error } = await client.from("jobs").select("id, job_number, customer, date, status").order("date", { ascending: false });
    if (error) throw new Error("Unable to load dashboard.");
    const jobs = data ?? [];
    const count = (status: string) => jobs.filter((job) => job.status === status).length;
    return NextResponse.json({ success: true, data: { total: jobs.length, draft: count("Draft"), inProgress: count("In Progress"), completed: count("Completed"), hasIssue: count("Has Issue"), recentJobs: jobs.slice(0, 5) } });
  } catch (error) { return apiError(error); }
}
