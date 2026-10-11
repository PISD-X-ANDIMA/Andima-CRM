import { NextResponse } from "next/server";
import { apiError, getA3ReadClient, getA3WriteClient, requireText, writeHistory } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const jobNumber = new URL(request.url).searchParams.get("jobNumber");
    const client = getA3ReadClient();
    let query = client.from("a3_handovers").select("*").order("created_at", { ascending: false }).limit(1);
    if (jobNumber) query = query.eq("job_number", jobNumber.trim().replace(/^#/, ""));
    const { data, error } = await query;
    if (error) {
      console.error("[GET A3-handover] Error fetching handover:", error);
      throw new Error("Unable to load handover.");
    }
    return NextResponse.json({ success: true, data: data?.[0] ?? null });
  } catch (error) {
    console.error("[GET A3-handover] Catch error:", error);
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawJobNumber = requireText(body.jobNumber, "jobNumber", 100);
    const jobNumber = rawJobNumber.trim().replace(/^#/, "");
    const deliveringParty = requireText(body.deliveringParty, "deliveringParty", 120);
    const receivingParty = requireText(body.receivingParty, "receivingParty", 120);
    const pieces = Number(body.actualPieces);
    const weight = Number(body.actualGrossWeight);
    if (!Number.isFinite(pieces) || pieces < 0 || !Number.isFinite(weight) || weight < 0) {
      throw new Error("Invalid cargo quantity.");
    }

    const client = getA3WriteClient();

    // Validasi keberadaan job di a2_worksheets
    const { data: wsData, error: wsError } = await client
      .from("a2_worksheets")
      .select("worksheet_id, job_no")
      .eq("job_no", jobNumber)
      .limit(1);

    if (wsError) {
      console.error(`[POST A3-handover] Error validating job_no "${jobNumber}":`, wsError);
      return apiError(new Error("Database error validating job."), 500);
    }

    if (!wsData || wsData.length === 0) {
      return apiError(new Error(`Job ${jobNumber} tidak ditemukan.`), 404);
    }

    const { data, error } = await client
      .from("a3_handovers")
      .insert({
        job_number: jobNumber,
        delivering_party: deliveringParty,
        receiving_party: receivingParty,
        actual_pieces: pieces,
        actual_gross_weight: weight,
        location: typeof body.location === "string" ? body.location.slice(0, 500) : null,
        notes: typeof body.notes === "string" ? body.notes.slice(0, 1000) : null,
      })
      .select()
      .single();

    if (error) {
      console.error(`[POST A3-handover] Error inserting a3_handovers:`, error);
      throw new Error("Unable to save handover.");
    }

    await writeHistory({ jobNumber, activity: "Handover Completed" });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[POST A3-handover] Catch error:", error);
    return apiError(error, 400);
  }
}
