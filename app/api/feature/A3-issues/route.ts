import { NextResponse } from "next/server";
import { apiError, getA3ReadClient, getA3WriteClient, requireText, writeHistory } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const jobNumber = new URL(request.url).searchParams.get("jobNumber");
    const client = getA3ReadClient();
    let query = client.from("a3_issues").select("*").order("created_at", { ascending: false });
    if (jobNumber) query = query.eq("job_number", jobNumber.trim().replace(/^#/, ""));
    const { data, error } = await query;
    if (error) {
      console.error("[GET A3-issues] Error fetching issues:", error);
      throw new Error("Unable to load issues.");
    }
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("[GET A3-issues] Catch error:", error);
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawJobNumber = requireText(body.jobNumber, "jobNumber", 100);
    const jobNumber = rawJobNumber.trim().replace(/^#/, "");
    const category = requireText(body.category, "category", 100);
    const description = requireText(body.description, "description", 500);
    const classification = typeof body.classification === "string" ? body.classification.slice(0, 100) : "Non-Urgent";
    const evidenceUrl = typeof body.evidenceUrl === "string" ? body.evidenceUrl.slice(0, 2048) : null;

    const client = getA3WriteClient();

    // Validasi keberadaan job di a3_tasks atau a2_worksheets
    const { data: a3Data } = await client
      .from("a3_tasks")
      .select('id, "Job Number"')
      .eq('Job Number', jobNumber)
      .limit(1);

    const { data: wsData } = await client
      .from("a2_worksheets")
      .select("worksheet_id, job_no")
      .eq("job_no", jobNumber)
      .limit(1);

    if ((!a3Data || a3Data.length === 0) && (!wsData || wsData.length === 0)) {
      return apiError(new Error(`Job ${jobNumber} tidak ditemukan.`), 404);
    }

    const { data, error } = await client
      .from("a3_issues")
      .insert({
        job_number: jobNumber,
        category,
        classification,
        description,
        evidence_url: evidenceUrl,
      })
      .select()
      .single();

    if (error) {
      console.error("[POST A3-issues] Error inserting a3_issues:", error);
      throw new Error("Unable to save issue.");
    }

    try {
      await client
        .from("a3_tasks")
        .update({
          "Has Issue": true,
          status: "HAS_ISSUE",
          updated_at: new Date().toISOString(),
        })
        .eq('Job Number', jobNumber);
    } catch (taskUpErr) {
      console.warn("[POST A3-issues] a3_tasks Has Issue update skipped:", taskUpErr);
    }

    await writeHistory({
      jobNumber,
      activity: "Issue Reported",
      notes: `${category} - ${classification}`,
    });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[POST A3-issues] Catch error:", error);
    return apiError(error, 400);
  }
}
