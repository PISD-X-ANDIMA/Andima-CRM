import { NextRequest, NextResponse } from "next/server";
import {
  A3HttpError,
  a3ErrorResponse,
  getA3WriteClient,
  requireA3User,
  requireA3FieldAgent,
} from "@/lib/a3";

export const dynamic = "force-dynamic";

interface TaskRow {
  id: string;
  job_id: string;
  field_agent_id: string | null;
  status: string;
  issue_description: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapTask(task: TaskRow, job: any, agentName: string | null, handover: any, docs: any[]) {
  const completed = task.status === "Completed";
  const hasIssue = task.status === "Has Issue";
  const photos = docs.filter((d) => d.doc_type === "4_photos").length;
  return {
    id: task.id,
    job_number: job?.job_number || "-",
    transaction_number: null,
    task_title: job?.job_number ? `Physical Cargo Inspection - ${job.job_number}` : "Field Task",
    customer: job?.customer_name || "-",
    sales_executive: null,
    shipper: job?.customer_name || "-",
    consignee: job?.destination || "-",
    origin: job?.origin || "-",
    destination: job?.destination || "-",
    mawb_hawb: null,
    location: job?.origin || "-",
    status: completed ? "Completed" : hasIssue ? "Has Issue" : null,
    has_issue: hasIssue,
    handover_status: handover ? "COMPLETED" : "PENDING",
    actual_cargo: handover
      ? `${handover.total_koli ?? 0} Pcs · ${handover.actual_weight_kg ?? 0} Kg`
      : null,
    documentation_status: docs.length > 0 ? "COMPLETED" : "PENDING",
    supporting_documents_status: photos > 0 ? "COMPLETED" : "PENDING",
    verification_status: null,
    assigned_to: agentName,
    field_stage: null,
    field_status: null,
    created_at: task.created_at,
    updated_at: task.updated_at,
  };
}

async function loadTaskBundle(db: any, task: TaskRow) {
  const [{ data: job }, handoverRes, docsRes] = await Promise.all([
    db.from("corp_jobs").select("id, job_number, customer_id, origin, destination").eq("id", task.job_id).maybeSingle(),
    db.from("a3_task_handovers").select("*").eq("task_id", task.id).maybeSingle(),
    db.from("a3_task_documents").select("*").eq("task_id", task.id).order("created_at", { ascending: true }),
  ]);

  let customerName = "-";
  if (job?.customer_id) {
    const { data: customer } = await db
      .from("a1_customers")
      .select("company_name")
      .eq("id", job.customer_id)
      .maybeSingle();
    customerName = customer?.company_name || "-";
  }

  let agentName: string | null = null;
  if (task.field_agent_id) {
    const { data: agent } = await db
      .from("b2_register")
      .select("full_name")
      .eq("id", task.field_agent_id)
      .maybeSingle();
    agentName = agent?.full_name || null;
  }

  const jobWithCustomer = job ? { ...job, customer_name: customerName } : null;
  const docs = docsRes.data || [];
  return { job: jobWithCustomer, handover: handoverRes.data || null, docs, agentName };
}

async function findTaskByJobNumber(db: any, jobNumber: string): Promise<TaskRow | null> {
  const { data: job } = await db
    .from("corp_jobs")
    .select("id")
    .eq("job_number", jobNumber)
    .maybeSingle();
  if (!job) return null;
  const { data: task } = await db
    .from("a3_tasks")
    .select("id, job_id, field_agent_id, status, issue_description, completed_at, created_at, updated_at")
    .eq("job_id", job.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (task as TaskRow) || null;
}

export async function GET(request: NextRequest) {
  try {
    const scope = await requireA3User();
    const agentId = requireA3FieldAgent(scope);
    const db = getA3WriteClient();
    const jobNumber = (request.nextUrl.searchParams.get("jobNumber") || "").trim();

    if (jobNumber) {
      const task = await findTaskByJobNumber(db, jobNumber);
      if (!task || (task.field_agent_id && task.field_agent_id !== agentId)) {
        throw new A3HttpError(404, "Task not found.");
      }
      const { job, handover, docs, agentName } = await loadTaskBundle(db, task);
      return NextResponse.json({
        success: true,
        data: {
          task: mapTask(task, job, agentName, handover, docs),
          handover: handover
            ? {
                actual_pieces: handover.total_koli,
                actual_gross_weight: handover.actual_weight_kg,
                location: job?.origin || null,
                latitude: handover.latitude,
                longitude: handover.longitude,
                created_at: handover.handover_time,
              }
            : null,
          documentation: {
            photos: docs.filter((d: any) => d.doc_type === "4_photos").map((d: any) => d.file_url),
            documents: docs.filter((d: any) => d.doc_type !== "4_photos").map((d: any) => d.file_url),
          },
          issues: task.issue_description
            ? [{
                id: task.id,
                category: "Field Issue",
                description: task.issue_description,
                status: "Open",
                reported_at: task.updated_at,
              }]
            : [],
          history: [],
        },
      });
    }

    const { data: tasks, error } = await db
      .from("a3_tasks")
      .select("id, job_id, field_agent_id, status, issue_description, completed_at, created_at, updated_at")
      .or(`field_agent_id.eq.${agentId},field_agent_id.is.null`)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const rows = (tasks || []) as TaskRow[];
    const items = await Promise.all(
      rows.map(async (task) => {
        const { job, handover, docs, agentName } = await loadTaskBundle(db, task);
        return mapTask(task, job, agentName, handover, docs);
      })
    );

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return a3ErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const scope = await requireA3User();
    const agentId = requireA3FieldAgent(scope);
    const db = getA3WriteClient();
    const body = await request.json();

    const jobNumber = typeof body.jobNumber === "string" ? body.jobNumber.trim() : "";
    if (!jobNumber) throw new A3HttpError(400, "jobNumber is required.");
    const task = await findTaskByJobNumber(db, jobNumber);
    if (!task) throw new A3HttpError(404, "Task not found.");
    if (task.field_agent_id && task.field_agent_id !== agentId) {
      throw new A3HttpError(403, "This task belongs to another field agent.");
    }

    const rawStatus = String(body.status || "").trim().toUpperCase();
    const status = rawStatus === "HAS_ISSUE" ? "Has Issue" : rawStatus === "COMPLETED" ? "Completed" : null;
    if (!status) throw new A3HttpError(400, "status must be COMPLETED or HAS_ISSUE.");

    const update: Record<string, unknown> = {
      status,
      field_agent_id: task.field_agent_id || agentId,
      updated_at: new Date().toISOString(),
    };
    if (status === "Completed") update.completed_at = new Date().toISOString();
    if (status === "Has Issue" && typeof body.issueDescription === "string" && body.issueDescription.trim()) {
      update.issue_description = body.issueDescription.trim();
    }

    const { data, error } = await db
      .from("a3_tasks")
      .update(update)
      .eq("id", task.id)
      .select("id, status, issue_description, completed_at, updated_at")
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return a3ErrorResponse(error);
  }
}

function yymm() {
  const now = new Date();
  return `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function nextJobNumber(db: any): Promise<string> {
  const prefix = `JOB-${yymm()}-`;
  const { data } = await db
    .from("corp_jobs")
    .select("job_number")
    .like("job_number", `${prefix}%`)
    .order("job_number", { ascending: false })
    .limit(1);
  const last = data?.[0]?.job_number as string | undefined;
  const sequence = last ? Number(last.slice(prefix.length)) || 0 : 0;
  return `${prefix}${String(sequence + 1).padStart(4, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const scope = await requireA3User();
    const agentId = requireA3FieldAgent(scope);
    const db = getA3WriteClient();
    const body = await request.json();

    const customerId = typeof body.customerId === "string" ? body.customerId.trim() : "";
    if (!customerId) throw new A3HttpError(400, "customerId is required.");

    const { data: customer } = await db
      .from("a1_customers")
      .select("id, company_name")
      .eq("id", customerId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!customer) throw new A3HttpError(404, "Company not found.");

    let jobNumber = await nextJobNumber(db);
    let job: { id: string; job_number: string } | null = null;
    for (let attempt = 0; attempt < 3 && !job; attempt += 1) {
      const { data, error } = await db
        .from("corp_jobs")
        .insert({
          job_number: jobNumber,
          customer_id: customerId,
          origin: typeof body.origin === "string" ? body.origin.slice(0, 200) : null,
          destination: typeof body.destination === "string" ? body.destination.slice(0, 200) : null,
          job_type: typeof body.workType === "string" ? body.workType.slice(0, 50) : null,
        })
        .select("id, job_number")
        .single();
      if (data) {
        job = data;
        break;
      }
      if (!/duplicate|unique/i.test(error?.message || "")) throw error;
      jobNumber = await nextJobNumber(db);
    }
    if (!job) throw new A3HttpError(500, "Unable to allocate a job number.");

    const hasIssue = body.hasIssue === true || body.issueFlag === true;
    const { data: task, error: taskError } = await db
      .from("a3_tasks")
      .insert({
        job_id: job.id,
        field_agent_id: agentId,
        status: hasIssue ? "Has Issue" : "Completed",
        issue_description:
          hasIssue && typeof body.issueDescription === "string" ? body.issueDescription.slice(0, 2000) : null,
        completed_at: new Date().toISOString(),
      })
      .select("id, status, completed_at")
      .single();

    if (taskError) {
      await db.from("corp_jobs").delete().eq("id", job.id);
      throw taskError;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          task_id: task.id,
          job_number: job.job_number,
          customer: customer.company_name,
          status: task.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return a3ErrorResponse(error);
  }
}

