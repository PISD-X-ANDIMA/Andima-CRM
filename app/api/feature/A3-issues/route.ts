import { NextResponse } from "next/server";
import { apiError, getA3Client, requireText, writeHistory } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const jobNumber = new URL(request.url).searchParams.get("jobNumber");
    const client = getA3Client();
    let query = client.from("job_issues").select("*").order("created_at", { ascending: false });
    if (jobNumber) query = query.eq("job_number", jobNumber);
    const { data, error } = await query;
    if (error) throw new Error("Unable to load issues.");
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const jobNumber = requireText(body.jobNumber, "jobNumber", 100);
    const category = requireText(body.category, "category", 100);
    const description = requireText(body.description, "description", 500);
    const evidenceUrl = typeof body.evidenceUrl === "string" ? body.evidenceUrl.slice(0, 2048) : null;
    const client = getA3Client();
    const { data, error } = await client.from("job_issues").insert({ job_number: jobNumber, category, description, evidence_url: evidenceUrl }).select().single();
    if (error) throw new Error("Unable to save issue.");
    await writeHistory({ jobNumber, activity: "Issue Reported", notes: category });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) { return apiError(error, 400); }
}
