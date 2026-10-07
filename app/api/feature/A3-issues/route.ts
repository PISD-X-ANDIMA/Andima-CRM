import { NextResponse } from "next/server";
import { apiError, getA3Client, requireText, writeHistory } from "@/lib/a3";

export const dynamic = "force-dynamic";

type IssueRecord = {
  id: string;
  job_number: string;
  category: string;
  classification: string;
  description: string;
  evidence_url: string | null;
  created_at: string;
};

const fallbackIssues: IssueRecord[] = [];

function fallbackResponse(data: Omit<IssueRecord, "id" | "created_at">) {
  const issue = {
    ...data,
    id: `ISSUE-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  fallbackIssues.unshift(issue);
  return NextResponse.json({ success: true, data: issue, mode: "local" }, { status: 201 });
}

export async function GET(request: Request) {
  try {
    const jobNumber = new URL(request.url).searchParams.get("jobNumber");
    let client;
    try {
      client = getA3Client();
    } catch {
      const data = jobNumber ? fallbackIssues.filter(issue => issue.job_number === jobNumber) : fallbackIssues;
      return NextResponse.json({ success: true, data, mode: "local" });
    }
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
    const classification = typeof body.classification === "string" ? body.classification.slice(0, 100) : "Non-Urgent";
    const evidenceUrl = typeof body.evidenceUrl === "string" ? body.evidenceUrl.slice(0, 2048) : null;
    let client;
    try {
      client = getA3Client();
    } catch {
      return fallbackResponse({ job_number: jobNumber, category, classification, description, evidence_url: evidenceUrl });
    }
    const { data, error } = await client.from("job_issues").insert({ job_number: jobNumber, category, description, evidence_url: evidenceUrl }).select().single();
    if (error) throw new Error("Unable to save issue.");

    // Sinkronisasi status kendala ke a2_worksheets agar otomatis tampil di Task of Field Agent (A2)
    try {
      const cleanJobNo = jobNumber.replace(/^#/, '');
      await client
        .from("a2_worksheets")
        .update({
          has_issue: true,
          status_kendala: "kendala_terdeteksi",
          issue_note: `${category}: ${description}`,
          updated_at: new Date().toISOString(),
        })
        .or(`job_no.eq.${jobNumber},job_no.eq.${cleanJobNo}`);
    } catch (syncErr) {
      console.warn("Sinkronisasi kendala ke a2_worksheets dilewati:", syncErr);
    }

    await writeHistory({ jobNumber, activity: "Issue Reported", notes: `${category} - ${classification}` });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) { return apiError(error, 400); }
}
