import { NextResponse } from "next/server";
import { apiError, getA3Client, requireText, writeHistory } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const jobNumber = new URL(request.url).searchParams.get("jobNumber");
    const client = getA3Client();
    let query = client.from("job_verifications").select("*").order("created_at", { ascending: false }).limit(1);
    if (jobNumber) query = query.eq("job_number", jobNumber);
    const { data, error } = await query;
    if (error) throw new Error("Unable to load verification.");
    return NextResponse.json({ success: true, data: data?.[0] ?? null });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const jobNumber = requireText(body.jobNumber, "jobNumber", 100);
    const documentVerification = requireText(body.documentVerification, "documentVerification", 100);
    const packageCondition = requireText(body.packageCondition, "packageCondition", 100);
    const airlineStandard = requireText(body.airlineStandard, "airlineStandard", 100);
    const specialHandling = Array.isArray(body.specialHandling) ? body.specialHandling.filter((item: unknown): item is string => typeof item === "string").slice(0, 10) : [];
    const client = getA3Client();
    const { data, error } = await client.from("job_verifications").insert({ job_number: jobNumber, document_verification: documentVerification, package_condition: packageCondition, airline_standard: airlineStandard, dangerous_goods: body.dangerousGoods === true, special_handling: specialHandling }).select().single();
    if (error) throw new Error("Unable to save verification.");
    await writeHistory({ jobNumber, activity: "Verification Completed", notes: "All checklist valid" });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) { return apiError(error, 400); }
}
