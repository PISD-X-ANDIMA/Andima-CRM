import { NextResponse } from "next/server";
import { apiError, getA3Client, requireText, writeHistory } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const jobNumber = new URL(request.url).searchParams.get("jobNumber");
    const client = getA3Client();
    let query = client.from("job_documentation").select("*").order("created_at", { ascending: false }).limit(1);
    if (jobNumber) query = query.eq("job_number", jobNumber);
    const { data, error } = await query;
    if (error) throw new Error("Unable to load documentation.");
    return NextResponse.json({ success: true, data: data?.[0] ?? null });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const jobNumber = requireText(body.jobNumber, "jobNumber", 100);
    if (!Array.isArray(body.photos) || !Array.isArray(body.documents)) throw new Error("Photos and documents must be arrays.");
    const client = getA3Client();
    const { data, error } = await client.from("job_documentation").insert({ job_number: jobNumber, photos: body.photos, documents: body.documents }).select().single();
    if (error) throw new Error("Unable to save documentation.");
    await writeHistory({ jobNumber, activity: "Document Uploaded", notes: `${body.photos.length} photos, ${body.documents.length} documents` });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) { return apiError(error, 400); }
}
