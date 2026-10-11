import { NextResponse } from "next/server";
import { apiError, getA3WriteClient, requireText, writeHistory } from "@/lib/a3";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawJobNumber = requireText(body.jobNumber, "jobNumber", 100);
    const jobNumber = rawJobNumber.trim().replace(/^#/, "");
    const rawFieldAgentId = requireText(body.fieldAgentId, "fieldAgentId", 120);
    const fieldAgentId = rawFieldAgentId.trim();

    const client = getA3WriteClient();

    // 1. Periksa apakah terdapat aktivitas di a3_handovers, a3_documentation, atau a3_field_issues
    const [
      { data: handoverData, error: handoverError },
      { data: docData, error: docError },
      { data: issueData, error: issueError },
    ] = await Promise.all([
      client.from("a3_handovers").select("id").eq("job_number", jobNumber).limit(1),
      client.from("a3_documentation").select("id").eq("job_number", jobNumber).limit(1),
      client.from("a3_field_issues").select("id").eq("job_number", jobNumber).limit(1),
    ]);

    if (handoverError || docError || issueError) {
      console.error("[POST A3-release-job] Error checking field activities:", {
        handoverError,
        docError,
        issueError,
      });
      return apiError(new Error("Gagal memverifikasi riwayat aktivitas lapangan."), 500);
    }

    const hasHandover = Boolean(handoverData && handoverData.length > 0);
    const hasDoc = Boolean(docData && docData.length > 0);
    const hasIssue = Boolean(issueData && issueData.length > 0);

    if (hasHandover || hasDoc || hasIssue) {
      return apiError(new Error("Job sudah ada aktivitas lapangan, tidak bisa dilepas."), 409);
    }

    // 2. Lepas job jika fieldAgentId cocok
    const { data: updateData, error: updateError } = await client
      .from("a2_worksheets")
      .update({ field_agent_id: null })
      .eq("job_no", jobNumber)
      .eq("field_agent_id", fieldAgentId)
      .select("worksheet_id");

    if (updateError) {
      console.error("[POST A3-release-job] Database error updating a2_worksheets:", updateError);
      return apiError(new Error("Gagal mengosongkan penugasan lapangan."), 500);
    }

    if (!updateData || updateData.length === 0) {
      return apiError(new Error("Gagal melepas job: Anda bukan pemilik job ini atau job tidak ditemukan."), 409);
    }

    await writeHistory({
      jobNumber,
      activity: "Job Released",
      notes: `Job dilepas oleh agen ${fieldAgentId}`,
      performedBy: typeof body.performedBy === "string" ? body.performedBy : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Job berhasil dilepas.",
    });
  } catch (error) {
    console.error("[POST A3-release-job] Catch error:", error);
    return apiError(error, 400);
  }
}
