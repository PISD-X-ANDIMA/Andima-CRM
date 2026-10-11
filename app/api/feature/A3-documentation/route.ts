import { NextResponse } from "next/server";
import { apiError, getA3ReadClient, getA3WriteClient, requireText, writeHistory } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const jobNumber = new URL(request.url).searchParams.get("jobNumber");
    const client = getA3ReadClient();
    let query = client.from("a3_documentation").select("*").order("created_at", { ascending: false }).limit(1);
    if (jobNumber) query = query.eq("job_number", jobNumber.trim().replace(/^#/, ""));
    const { data, error } = await query;
    if (error) {
      console.error("[GET A3-documentation] Error fetching documentation:", error);
      throw new Error("Unable to load documentation.");
    }
    return NextResponse.json({ success: true, data: data?.[0] ?? null });
  } catch (error) {
    console.error("[GET A3-documentation] Catch error:", error);
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawJobNumber = requireText(body.jobNumber, "jobNumber", 100);
    const jobNumber = rawJobNumber.trim().replace(/^#/, "");
    if (!Array.isArray(body.photos) || !Array.isArray(body.documents)) {
      throw new Error("Photos and documents must be arrays.");
    }

    const client = getA3WriteClient();

    // Validasi keberadaan job di a2_worksheets
    const { data: wsData, error: wsError } = await client
      .from("a2_worksheets")
      .select("worksheet_id, job_no")
      .eq("job_no", jobNumber)
      .limit(1);

    if (wsError) {
      console.error(`[POST A3-documentation] Error validating job_no "${jobNumber}":`, wsError);
      return apiError(new Error("Database error validating job."), 500);
    }

    if (!wsData || wsData.length === 0) {
      return apiError(new Error(`Job ${jobNumber} tidak ditemukan.`), 404);
    }

    const { data, error } = await client
      .from("a3_documentation")
      .insert({ job_number: jobNumber, photos: body.photos, documents: body.documents })
      .select()
      .single();

    if (error) {
      console.error("[POST A3-documentation] Error inserting a3_documentation:", error);
      throw new Error("Unable to save documentation.");
    }

    await writeHistory({
      jobNumber,
      activity: "Document Uploaded",
      notes: `${body.photos.length} photos, ${body.documents.length} documents`,
    });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[POST A3-documentation] Catch error:", error);
    return apiError(error, 400);
  }
}
