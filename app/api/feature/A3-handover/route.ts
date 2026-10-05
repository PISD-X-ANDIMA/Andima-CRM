import { NextResponse } from "next/server";
import { apiError, getA3Client, requireText, writeHistory } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const jobNumber = new URL(request.url).searchParams.get("jobNumber");
    const client = getA3Client();
    let query = client.from("job_handovers").select("*").order("created_at", { ascending: false }).limit(1);
    if (jobNumber) query = query.eq("job_number", jobNumber);
    const { data, error } = await query;
    if (error) throw new Error("Unable to load handover.");
    return NextResponse.json({ success: true, data: data?.[0] ?? null });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const jobNumber = requireText(body.jobNumber, "jobNumber", 100);
    const deliveringParty = requireText(body.deliveringParty, "deliveringParty", 120);
    const receivingParty = requireText(body.receivingParty, "receivingParty", 120);
    const pieces = Number(body.actualPieces);
    const weight = Number(body.actualGrossWeight);
    if (!Number.isFinite(pieces) || pieces < 0 || !Number.isFinite(weight) || weight < 0) throw new Error("Invalid cargo quantity.");
    const client = getA3Client();
    const { data, error } = await client.from("job_handovers").insert({ job_number: jobNumber, delivering_party: deliveringParty, receiving_party: receivingParty, actual_pieces: pieces, actual_gross_weight: weight, location: typeof body.location === "string" ? body.location.slice(0, 500) : null, notes: typeof body.notes === "string" ? body.notes.slice(0, 1000) : null }).select().single();
    if (error) throw new Error("Unable to save handover.");
    await writeHistory({ jobNumber, activity: "Handover Completed" });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) { return apiError(error, 400); }
}
