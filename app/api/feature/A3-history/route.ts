import { NextResponse } from "next/server";
import { apiError, getA3ReadClient } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const jobNumber = new URL(request.url).searchParams.get("jobNumber");
    const client = getA3ReadClient();
    let query = client.from("a3_history").select("*").order("created_at", { ascending: true });
    if (jobNumber) query = query.eq("job_number", jobNumber.trim().replace(/^#/, ""));
    const { data, error } = await query;
    if (error) {
      console.error("[GET A3-history] Error fetching history:", error);
      throw new Error("Unable to load job history.");
    }
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("[GET A3-history] Catch error:", error);
    return apiError(error);
  }
}
