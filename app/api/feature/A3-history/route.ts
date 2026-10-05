import { NextResponse } from "next/server";
import { apiError, getA3Client } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const jobNumber = new URL(request.url).searchParams.get("jobNumber");
    const client = getA3Client();
    let query = client.from("job_history").select("*").order("created_at", { ascending: true });
    if (jobNumber) query = query.eq("job_number", jobNumber);
    const { data, error } = await query;
    if (error) throw new Error("Unable to load job history.");
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) { return apiError(error); }
}
