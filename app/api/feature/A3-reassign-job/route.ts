import { NextResponse } from "next/server";
import { apiError, getA3WriteClient, requireText, writeHistory } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawJobNumber = requireText(body.jobNumber, "jobNumber", 100);
    const jobNumber = rawJobNumber.trim().replace(/^#/, "");
    const targetAgentId = body.targetAgentId ? String(body.targetAgentId).trim() : null;
    const targetAgentName = body.targetAgentName ? String(body.targetAgentName).trim() : "Unassigned Pool";
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : "Kendala lapangan";
    const performedBy = typeof body.performedBy === "string" && body.performedBy.trim() ? body.performedBy.trim() : "Field Agent";

    const client = getA3WriteClient();

    // 1. Update worksheet assignment di Supabase jika ada
    try {
      const { error: updateError } = await client
        .from("a2_worksheets")
        .update({ field_agent_id: targetAgentId })
        .eq("job_no", jobNumber);

      if (updateError) {
        console.warn("[POST A3-reassign-job] Warning updating worksheet:", updateError);
      }
    } catch (dbErr) {
      console.warn("[POST A3-reassign-job] Exception updating worksheet:", dbErr);
    }

    // 2. Catat ke a3_history untuk audit trail operasional
    try {
      await writeHistory({
        jobNumber,
        activity: targetAgentId ? `Reassigned to ${targetAgentName}` : "Returned to Unassigned Pool",
        notes: `Alasan: ${reason}. Dialihkan oleh: ${performedBy}`,
        performedBy,
      });
    } catch (histErr) {
      console.warn("[POST A3-reassign-job] Warning writing history:", histErr);
    }

    return NextResponse.json({
      success: true,
      message: `Tugas berhasil dialihkan ke ${targetAgentName}.`,
      data: {
        job_number: jobNumber,
        assigned_to_id: targetAgentId,
        assigned_to_name: targetAgentName,
        reason,
        reassigned_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[POST A3-reassign-job] Error:", error);
    return apiError(error, 500);
  }
}
