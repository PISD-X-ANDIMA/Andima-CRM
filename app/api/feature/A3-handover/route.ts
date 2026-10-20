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
      .select("worksheet_id, job_no, field_agent_id")
      .eq("job_no", jobNumber)
      .limit(1);

    if (wsError) {
      console.error(`[POST A3-handover] Error validating job_no "${jobNumber}":`, wsError);
      return apiError(new Error("Database error validating job."), 500);
    }

    if (!wsData || wsData.length === 0) {
      // Auto-insert worksheet if not present so newly created tasks by field agent can handover smoothly
      const transactionNo = `TRX-${Date.now().toString().slice(-8)}`;
      const { error: insErr } = await client
        .from("a2_worksheets")
        .insert({
          job_no: jobNumber,
          transaction_no: transactionNo,
          customer_id: "909016c5-ecc1-41ba-b57f-2ba328d006ea",
          created_by_user_id: 1,
          create_date: new Date().toISOString().split("T")[0],
          status_kendala: "normal",
          field_agent_id: body.fieldAgentId || "9c274330-44f1-474d-91c0-523aac3ea9cf",
          sales_pic_id: "9c274330-44f1-474d-91c0-523aac3ea9cf",
          shipper: deliveringParty || "PT Indofood CBP Sukses Makmur Tbk",
          consignee: receivingParty || "Singapore (SIN)",
          handover_location: typeof body.location === "string" ? body.location.slice(0, 255) : "Cengkareng, Banten, Indonesia",
          pihak_penyerah: deliveringParty,
          pihak_penerima: receivingParty,
          is_dangerous_goods: false,
          has_issue: false,
        });

      if (insErr) {
        console.warn(`[POST A3-handover] Auto-create worksheet warning for "${jobNumber}":`, insErr);
      }
    }

    // Catatan: Ini bukan transaksi database penuh (RPC); kompensasi dilakukan manual jika insert handover gagal.
    const claimJob = Boolean(body.claimJob);
    let didClaim = false;
    let fieldAgentId: string | null = null;

    if (claimJob) {
      if (!body.fieldAgentId || typeof body.fieldAgentId !== "string" || !body.fieldAgentId.trim()) {
        return apiError(new Error("fieldAgentId wajib disertakan saat klaim job."), 400);
      }
      fieldAgentId = body.fieldAgentId.trim();

      // UPDATE a2_worksheets SET field_agent_id = :fieldAgentId WHERE job_no = :job AND (field_agent_id IS NULL OR field_agent_id = :fieldAgentId)
      const { data: claimData, error: claimError } = await client
        .from("a2_worksheets")
        .update({ field_agent_id: fieldAgentId })
        .eq("job_no", jobNumber)
        .or(`field_agent_id.is.null,field_agent_id.eq.${fieldAgentId}`)
        .select("worksheet_id, field_agent_id");

      if (claimError) {
        console.error(`[POST A3-handover] Gagal klaim job "${jobNumber}":`, claimError);
        return apiError(new Error("Gagal mengklaim job karena kesalahan database."), 500);
      }

      if (!claimData || claimData.length === 0) {
        return apiError(new Error("Job sudah diklaim oleh agen lain atau tidak dapat diklaim."), 409);
      }

      didClaim = true;
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
      // Kompensasi manual: jika klaim ini yang mengubahnya, kembalikan field_agent_id ke NULL
      if (didClaim && fieldAgentId) {
        try {
          const { error: rollbackError } = await client
            .from("a2_worksheets")
            .update({ field_agent_id: null })
            .eq("job_no", jobNumber)
            .eq("field_agent_id", fieldAgentId);

          if (rollbackError) {
            console.error(`[POST A3-handover] Rollback kompensasi gagal untuk job "${jobNumber}":`, rollbackError);
          } else {
            console.warn(`[POST A3-handover] Rollback kompensasi berhasil: field_agent_id dikembalikan ke NULL untuk job "${jobNumber}".`);
          }
        } catch (rollbackEx) {
          console.error(`[POST A3-handover] Exception saat rollback kompensasi untuk job "${jobNumber}":`, rollbackEx);
        }
      }
      throw new Error("Unable to save handover.");
    }

    try {
      await client
        .from("a3_tasks")
        .update({
          handover_status: "COMPLETED",
          actual_cargo: `${pieces} Pcs · ${weight} Kg`,
          location: typeof body.location === "string" ? body.location.slice(0, 500) : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("Job Number", jobNumber);
    } catch (taskUpErr) {
      console.warn("[POST A3-handover] a3_tasks handover status update skipped:", taskUpErr);
    }

    await writeHistory({
      jobNumber,
      activity: didClaim ? "Job Claimed & Handover Completed" : "Handover Completed",
      performedBy: typeof body.performedBy === "string" ? body.performedBy : undefined,
    });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[POST A3-handover] Catch error:", error);
    return apiError(error, 400);
  }
}

