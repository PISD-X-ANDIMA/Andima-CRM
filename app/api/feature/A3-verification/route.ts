import { NextResponse } from "next/server";
import { apiError, getA3ReadClient, getA3WriteClient, requireText, writeHistory } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const jobNumber = new URL(request.url).searchParams.get("jobNumber");
    const client = getA3ReadClient();
    let query = client.from("a3_verifications").select("*").order("created_at", { ascending: false }).limit(1);
    if (jobNumber) query = query.eq("job_number", jobNumber.trim().replace(/^#/, ""));
    const { data, error } = await query;
    if (error) {
      console.error("[GET A3-verification] Error fetching verification:", error);
      throw new Error("Unable to load verification.");
    }
    return NextResponse.json({ success: true, data: data?.[0] ?? null });
  } catch (error) {
    console.error("[GET A3-verification] Catch error:", error);
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawJobNumber = requireText(body.jobNumber, "jobNumber", 100);
    const jobNumber = rawJobNumber.trim().replace(/^#/, "");
    const documentVerification = requireText(body.documentVerification, "documentVerification", 100);
    const packageCondition = requireText(body.packageCondition, "packageCondition", 100);
    const airlineStandard = requireText(body.airlineStandard, "airlineStandard", 100);

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

    const insertPayload: Record<string, unknown> = {
      job_number: jobNumber,
      document_verification: documentVerification,
      package_condition: packageCondition,
      airline_standard: airlineStandard,
    };

    if (body.dangerousGoods !== undefined) {
      insertPayload.dangerous_goods = body.dangerousGoods === true;
    }

    if (body.specialHandling !== undefined) {
      insertPayload.special_handling = Array.isArray(body.specialHandling)
        ? body.specialHandling.filter((item: unknown): item is string => typeof item === "string").slice(0, 10)
        : [];
    }

    const { data, error } = await client
      .from("a3_verifications")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("[POST A3-verification] Error inserting a3_verifications:", error);
      throw new Error("Unable to save verification.");
    }

    try {
      await client
        .from("a3_tasks")
        .update({
          verification_status: "VERIFIED",
          updated_at: new Date().toISOString(),
        })
        .eq('Job Number', jobNumber);
    } catch (taskUpErr) {
      console.warn("[POST A3-verification] a3_tasks verification_status update skipped:", taskUpErr);
    }

    await writeHistory({ jobNumber, activity: "Verification Completed", notes: "All checklist valid" });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[POST A3-verification] Catch error:", error);
    return apiError(error, 400);
  }
}
