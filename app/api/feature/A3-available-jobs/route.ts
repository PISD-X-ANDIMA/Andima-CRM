import { NextResponse } from "next/server";
import { apiError, getA3ReadClient } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = getA3ReadClient();

    const { data, error } = await client
      .from("a2_worksheets")
      .select("job_no, shipper, consignee, a1_company_list ( company_name )")
      .is("field_agent_id", null)
      .order("worksheet_id", { ascending: true });

    if (error) {
      console.error("[GET A3-available-jobs] Error querying available jobs:", error);
      throw new Error("Gagal memuat daftar job yang tersedia.");
    }

    const availableJobs = (data || []).map((row: any) => ({
      job_no: row.job_no,
      company_name: row.a1_company_list?.company_name || "-",
      customer: row.a1_company_list?.company_name || "-",
      shipper: row.shipper || "-",
      consignee: row.consignee || "-",
    }));

    return NextResponse.json({
      success: true,
      data: availableJobs,
    });
  } catch (error) {
    console.error("[GET A3-available-jobs] Catch error:", error);
    return apiError(error);
  }
}
