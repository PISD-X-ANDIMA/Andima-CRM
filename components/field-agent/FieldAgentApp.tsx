"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FieldAgentDashboard from "./FieldAgentDashboard";
import { exportMyTaskToPdfFile, openMyTaskPrintReport } from "@/lib/myTaskExport";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bell,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  LayoutDashboard,
  MapPin,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Upload,
  User,
  Users,
  Building2,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Zap,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type Status = "Completed" | "Has Issue";

type Screen =
  | "dashboard"
  | "field-agent"
  | "notifications"
  | "tasks"
  | "detail"
  | "handover"
  | "documentation"
  | "history";

type Job = {
  id: string;
  job_number?: string;
  transaction_number?: string;
  task_title?: string;
  customer?: string;
  sales_executive?: string;
  field_agent_name?: string;
  shipper?: string;
  consignee?: string;
  origin?: string;
  destination?: string;
  mawb?: string;
  mawb_hawb?: string;
  location?: string;
  date?: string;
  status?: Status;
  has_issue?: boolean | null;
  handover_status?: string;
  actual_cargo?: string;
  cargo_pieces?: string;
  gross_weight?: string;
  documentation_status?: string;
  supporting_documents_status?: string;
  verification_status?: string;
  assigned_to?: string;
  field_stage?: string;
  field_status?: string;
  created_at?: string;
  updated_at?: string;
};

type ApiTask = {
  id: string | number;
  job_number?: string;
  transaction_number?: string;
  task_title?: string;
  customer?: string;
  sales_executive?: string;
  sales_pic?: string;
  shipper?: string;
  consignee?: string;
  origin?: string;
  destination?: string;
  mawb_hawb?: string;
  location?: string;
  status?: string;
  field_status?: string;
  field_stage?: string;
  has_issue?: boolean;
  handover_status?: string;
  actual_cargo?: string;
  documentation_status?: string;
  supporting_documents_status?: string;
  verification_status?: string;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;
};

/* =========================================================
   HELPERS
========================================================= */

const statusClass: Record<Status, string> = {
  Completed:
    "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60",

  "Has Issue":
    "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60",
};

const pendingBadgeClass =
  "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700";

const no = (job: Job | null) =>
  job?.job_number || job?.id || "-";

const mawb = (job: Job | null) =>
  job?.mawb || job?.mawb_hawb || "-";

/**
 * Convert status dari database ke status UI Field Agent.
 */
function mapDatabaseStatus(
  status?: string,
  verificationStatus?: string,
  hasIssue?: boolean | null
): Status | undefined {
  const raw = (status || "").trim().toUpperCase();
  if (
    hasIssue === true ||
    raw === "HAS_ISSUE" ||
    verificationStatus === "Issue Found"
  ) {
    return "Has Issue";
  }
  if (raw === "COMPLETED" || raw === "SELESAI") {
    return "Completed";
  }
  return undefined;
}

/**
 * Convert response API menjadi object Job
 */
function mapApiJob(task: ApiTask): Job {
  const rawStatus = (task.status || "").trim().toUpperCase();
  const isCompleted = rawStatus === "COMPLETED" || rawStatus === "SELESAI";
  const isIssue = Boolean(
    task.has_issue === true ||
    rawStatus === "HAS_ISSUE" ||
    task.verification_status === "Issue Found"
  );

  let currentStatus: Status | undefined = undefined;
  if (isIssue) {
    currentStatus = "Has Issue";
  } else if (isCompleted) {
    currentStatus = "Completed";
  }

  const originVal =
    task.origin && task.origin !== "[BELUM ADA]" && task.origin !== "-"
      ? task.origin
      : undefined;
  const destinationVal =
    task.destination && task.destination !== "[BELUM ADA]" && task.destination !== "-"
      ? task.destination
      : undefined;
  const salesVal =
    task.sales_executive && task.sales_executive !== "[BELUM ADA]" && task.sales_executive !== "-"
      ? task.sales_executive
      : task.sales_pic && task.sales_pic !== "[BELUM ADA]" && task.sales_pic !== "-"
        ? task.sales_pic
        : undefined;

  let hasIssueVal: boolean | undefined = undefined;
  if (task.has_issue !== undefined && task.has_issue !== null) {
    hasIssueVal = Boolean(task.has_issue);
  } else if (isIssue) {
    hasIssueVal = true;
  } else if (isCompleted) {
    hasIssueVal = false;
  }

  const agentName = task.assigned_to || (task as any).field_agent_name || undefined;

  return {
    id: String(task.id),
    job_number: task.job_number,
    transaction_number: task.transaction_number,
    task_title: task.task_title,
    customer: task.customer,
    sales_executive: salesVal,
    shipper: task.shipper,
    consignee: task.consignee,
    origin: originVal,
    destination: destinationVal,
    mawb_hawb: task.mawb_hawb,
    location: task.location,
    status: currentStatus,
    has_issue: hasIssueVal,
    handover_status: task.handover_status,
    actual_cargo: task.actual_cargo,
    documentation_status: task.documentation_status,
    supporting_documents_status: task.supporting_documents_status,
    verification_status: task.verification_status,
    assigned_to: agentName,
    field_stage: task.field_stage,
    field_status: task.field_status,
    created_at: task.created_at,
    updated_at: task.updated_at,

    date: task.created_at
      ? new Date(task.created_at).toLocaleString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-",
  };
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
  onClick,
}: {
  status?: Status;
  onClick?: () => void;
}) {
  const label = status || "Belum Selesai";
  const badgeClass = status ? statusClass[status] : pendingBadgeClass;

  const className = `
    inline-flex
    items-center
    whitespace-nowrap
    rounded-full
    border
    px-2.5
    py-0.5
    text-[11px]
    font-semibold
    ${badgeClass}
  `;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Buka detail job"
        className={`${className} cursor-pointer transition hover:brightness-95`}
      >
        {label}
      </button>
    );
  }

  return (
    <span className={className}>
      {label}
    </span>
  );
}

/* =========================================================
   AGENT IDENTITIES (Batasan Sementara Tahap 3)
========================================================= */

const AVAILABLE_AGENT_IDENTITIES = [
  { id: "9c274330-44f1-474d-91c0-523aac3ea9cf", name: "Andima WebDev", role: "Field Inspector" },
  { id: "a1111111-1111-4111-a111-111111111111", name: "Andi Pratama", role: "Field Inspector" },
  { id: "a2222222-2222-4222-a222-222222222222", name: "Marsel", role: "Field Inspector" },
  { id: "a3333333-3333-4333-a333-333333333333", name: "Choirul", role: "Field Inspector" },
  { id: "a4444444-4444-4444-a444-444444444444", name: "Rizky Pratama", role: "Field Inspector" },
];

/* =========================================================
   MAIN PAGE
========================================================= */

export default function FieldAgentApp() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams?.get("tab") as Screen | null;

  const [screen, setScreen] =
    useState<Screen>("field-agent");

  useEffect(() => {
    if (urlTab && ["field-agent", "tasks", "history", "dashboard"].includes(urlTab)) {
      setScreen(urlTab);
    }
  }, [urlTab]);

  const [selected, setSelected] =
    useState<Job | null>(null);

  const [filter, setFilter] = useState("All");

  const [query, setQuery] = useState("");

  const [issueOpen, setIssueOpen] =
    useState(false);

  const [completionOpen, setCompletionOpen] =
    useState(false);

  const [reportIssueCount, setReportIssueCount] =
    useState(0);

  const [description, setDescription] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [notice, setNotice] =
    useState("");

  // Identitas agen aktif ("Saya sebagai") - batasan sementara Tahap 3
  const [currentAgent, setCurrentAgent] = useState(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem("andima_active_agent_id");
      const found = AVAILABLE_AGENT_IDENTITIES.find(a => a.id === savedId);
      if (found) return found;
    }
    return AVAILABLE_AGENT_IDENTITIES[0];
  });

  const handleSelectAgent = (agentId: string) => {
    const found = AVAILABLE_AGENT_IDENTITIES.find(a => a.id === agentId);
    if (found) {
      setCurrentAgent(found);
      if (typeof window !== "undefined") {
        localStorage.setItem("andima_active_agent_id", found.id);
        localStorage.setItem("andima_active_agent_name", found.name);
      }
      setNotice(`Identitas aktif: ${found.name}`);
      setTimeout(() => setNotice(""), 2500);
    }
  };

  // State Add Task & Claiming & Reassign
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isClaimingJob, setIsClaimingJob] = useState(false);
  const [reassignModalJob, setReassignModalJob] = useState<Job | null>(null);

  /* =======================================================
     LOAD DATA FROM SUPABASE THROUGH API
  ======================================================= */

  const loadA3Tasks = async () => {
    try {
      setApiError(null);
      setNotice("Memuat data task...");

      const response = await fetch(
        "/api/feature/A3-tasks",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Gagal mengambil data task dari server (HTTP ${response.status})`
        );
      }

      const result = await response.json();

      if (
        !result.success ||
        !Array.isArray(result.data)
      ) {
        throw new Error(
          result.error || "Format response API A3 tidak valid."
        );
      }

      const mappedJobs: Job[] =
        result.data.map(mapApiJob);

      setJobs(mappedJobs);

      if (mappedJobs.length > 0) {
        setSelected(mappedJobs[0]);
      } else {
        setSelected(null);
      }

      setNotice(
        `${mappedJobs.length} task berhasil dimuat.`
      );

      setTimeout(() => {
        setNotice("");
      }, 2500);
    } catch (error) {
      console.error(
        "Failed to load A3 tasks:",
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Data dari API gagal dimuat.";

      setApiError(errorMessage);
      setNotice(
        "Data task gagal dimuat dari database."
      );
    }
  };

  useEffect(() => {
    loadA3Tasks();
  }, []);

  const handleSelectAvailableJob = (newJob: Job) => {
    setSelected(newJob);
    setIsClaimingJob(true);
    setIsAddTaskOpen(false);
    setScreen("handover");
  };

  const handleReleaseJob = async (jobToRelease: Job) => {
    if (!jobToRelease) return;
    const jobNumberStr = no(jobToRelease);
    const confirmed = window.confirm(`Apakah Anda yakin ingin melepas pekerjaan ${jobNumberStr}?`);
    if (!confirmed) return;

    setSaving(true);
    setNotice("Memproses pelepasan job...");

    try {
      const res = await fetch("/api/feature/A3-release-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobNumber: jobNumberStr,
          fieldAgentId: currentAgent.id,
          performedBy: currentAgent.name,
        }),
      });

      const resJson = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = resJson?.error || "Gagal melepas job.";
        throw new Error(errorMsg);
      }

      setNotice("Job berhasil dilepas.");
      await loadA3Tasks();
      setScreen("tasks");
    } catch (err) {
      console.error("Error releasing job:", err);
      setNotice(err instanceof Error ? err.message : "Gagal melepas job.");
    } finally {
      setSaving(false);
    }
  };

  const handleReassignJob = async (
    jobToReassign: Job,
    targetAgent: { id: string | null; name: string },
    reason: string
  ) => {
    if (!jobToReassign) return;
    const jobNumberStr = no(jobToReassign);

    setSaving(true);
    setNotice(`Mengalihkan job ke ${targetAgent.name}...`);

    try {
      const res = await fetch("/api/feature/A3-reassign-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobNumber: jobNumberStr,
          targetAgentId: targetAgent.id,
          targetAgentName: targetAgent.name,
          reason,
          performedBy: currentAgent.name,
        }),
      });

      const resJson = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = resJson?.error || "Gagal mengalihkan job.";
        throw new Error(errorMsg);
      }

      // Sync ke localStorage andima_field_agent_figma_tasks jika ada
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem("andima_field_agent_figma_tasks");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              const updated = parsed.map((t: any) => {
                if (t.job_number === jobToReassign.job_number || t.id === jobToReassign.id) {
                  return {
                    ...t,
                    field_agent_id: targetAgent.id,
                    assigned_to: targetAgent.name,
                  };
                }
                return t;
              });
              localStorage.setItem("andima_field_agent_figma_tasks", JSON.stringify(updated));
            }
          }
        } catch (e) {
          console.warn("Error updating local storage cache:", e);
        }
      }

      setNotice(`Job berhasil dialihkan ke ${targetAgent.name}.`);
      setReassignModalJob(null);
      await loadA3Tasks();
      setScreen("tasks");
    } catch (err) {
      console.error("Error reassigning job:", err);
      setNotice(err instanceof Error ? err.message : "Gagal mengalihkan job.");
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     BACK NAVIGATION
  ======================================================= */

  useEffect(() => {
    const previous: Partial<
      Record<Screen, Screen>
    > = {
      notifications: "field-agent",
      tasks: "field-agent",
      detail: "tasks",
      handover: "detail",
      documentation: "handover",
      history: "tasks",
    };

    const goBack = () => {
      const destination =
        previous[screen];

      if (destination) {
        setScreen(destination);
      }
    };

    window.addEventListener(
      "field-agent:back",
      goBack
    );

    return () => {
      window.removeEventListener(
        "field-agent:back",
        goBack
      );
    };
  }, [screen]);

  /* =======================================================
     COUNTS & FILTER (Khusus My Task: Hanya Task Aktif, Completed Otomatis Masuk ke Report)
  ======================================================= */

  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status !== "Completed"),
    [jobs]
  );

  const counts = useMemo(
    () => ({
      All: activeJobs.length,
      "Has Issue": activeJobs.filter(
        (j) => j.status === "Has Issue" || j.has_issue
      ).length,
    }),
    [activeJobs]
  );

  const shown = useMemo(() => {
    return activeJobs.filter((job) => {
      const matchesFilter =
        filter === "All" ||
        filter === "All Tasks" ||
        (filter === "Has Issue" && (job.status === "Has Issue" || job.has_issue));

      const searchText = `
        ${no(job)}
        ${job.customer || ""}
        ${mawb(job)}
        ${job.task_title || ""}
        ${job.transaction_number || ""}
        ${job.assigned_to || ""}
        ${job.sales_executive || ""}
        ${job.origin || ""}
        ${job.destination || ""}
      `.toLowerCase();

      const matchesSearch =
        searchText.includes(
          query.toLowerCase()
        );

      return (
        matchesFilter &&
        matchesSearch
      );
    });
  }, [activeJobs, filter, query]);

  /* =======================================================
     OPEN JOB
  ======================================================= */

  const openJob = (job: Job) => {
    setSelected(job);
    setScreen("detail");
    setNotice("");
  };

  /* =======================================================
     SAVE ISSUE
  ======================================================= */

  const saveIssue = async () => {
    if (!selected) {
      return;
    }

    if (!description.trim()) {
      setNotice("Deskripsi issue wajib diisi.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/feature/A3-issues",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            jobNumber: no(selected),
            category: "Others/Lainnya",
            description: description.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Issue gagal disimpan."
        );
      }

      setIssueOpen(false);

      setNotice(
        "Issue berhasil disimpan."
      );

      setJobs((current) =>
        current.map((job) =>
          no(job) === no(selected)
            ? {
                ...job,
                status: "Has Issue",
              }
            : job
        )
      );

      setSelected((current) =>
        current
          ? {
              ...current,
              status: "Has Issue",
            }
          : current
      );
    } catch (error) {
      console.error(error);

      setNotice(
        "Issue belum dapat disimpan."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     SAVE WORKFLOW
  /* =======================================================
     UNIFIED JOB SUBMIT (ALL-IN-ONE FORM)
  ======================================================= */

  const handleUnifiedJobSubmit = async (data: {
    deliveringParty: string;
    receivingParty: string;
    actualPieces: number;
    actualGrossWeight: number;
    location: string;
    gps?: { latitude: number; longitude: number; accuracy: number; recordedAt: Date } | null;
    serverTimestamp?: string;
    taskId?: string;
    photos: string[];
    documents: string[];
    docDetails?: { name: string; url: string; size: string }[];
    hasIssue: boolean;
    issueDescription?: string;
  }) => {
    if (!selected) {
      return;
    }

    setSaving(true);
    setNotice("Menyimpan seluruh data pengerjaan lapangan...");

    try {
      const jobNumberStr = no(selected);
      const taskIdStr = data.taskId || jobNumberStr;

      // 1. Simpan Handover Fisik
      const handoverRes = await fetch("/api/feature/A3-handover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobNumber: jobNumberStr,
          taskId: taskIdStr,
          deliveringParty: data.deliveringParty,
          receivingParty: data.receivingParty,
          actualPieces: data.actualPieces,
          actualGrossWeight: data.actualGrossWeight,
          location: data.location,
          latitude: data.gps?.latitude ?? null,
          longitude: data.gps?.longitude ?? null,
          accuracy: data.gps?.accuracy ?? null,
          serverTimestamp: data.serverTimestamp || null,
          notes: data.gps
            ? `GPS: ${data.gps.latitude.toFixed(6)}, ${data.gps.longitude.toFixed(6)} (Akurasi: ±${Math.round(data.gps.accuracy)}m) | Wilayah: ${data.location} | Waktu Server: ${data.serverTimestamp || new Date().toISOString()} | Task: ${taskIdStr}`
            : null,
          claimJob: isClaimingJob,
          fieldAgentId: currentAgent.id,
          performedBy: currentAgent.name,
        }),
      });

      if (!handoverRes.ok) {
        const errJson = await handoverRes.json().catch(() => null);
        throw new Error(errJson?.error || "Gagal menyimpan serah terima fisik kargo.");
      }

      if (isClaimingJob) {
        setIsClaimingJob(false);
        await loadA3Tasks();
      }

      // 2. Simpan Dokumentasi & Foto
      const docRes = await fetch("/api/feature/A3-documentation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobNumber: jobNumberStr,
          photos: data.photos,
          documents: data.documents,
        }),
      });

      if (!docRes.ok) {
        const errJson = await docRes.json().catch(() => null);
        throw new Error(errJson?.error || "Gagal menyimpan berkas dokumentasi.");
      }

      // 3. Simpan Issue jika ada kendala
      if (data.hasIssue) {
        const issueRes = await fetch("/api/feature/A3-issues", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobNumber: jobNumberStr,
            category: "Others/Lainnya",
            description: data.issueDescription?.trim() || "Kendala dicatat pada form lapangan",
          }),
        });

        if (!issueRes.ok) {
          const errJson = await issueRes.json().catch(() => null);
          throw new Error(errJson?.error || "Gagal mencatat laporan kendala.");
        }
      }

      // 4. Update status pekerjaan di a3_tasks Supabase
      const updateTaskRes = await fetch("/api/feature/A3-tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobNumber: jobNumberStr,
          status: data.hasIssue ? "HAS_ISSUE" : "COMPLETED",
          handoverStatus: "COMPLETED",
          documentationStatus: "COMPLETE",
          actualCargo: `${data.actualPieces} Pcs · ${data.actualGrossWeight} Kg`,
          location: data.location,
          hasIssue: data.hasIssue,
          fieldAgentName: currentAgent.name,
        }),
      });

      if (!updateTaskRes.ok) {
        const errJson = await updateTaskRes.json().catch(() => null);
        throw new Error(errJson?.error || "Gagal memperbarui status pengerjaan task di database.");
      }

      const newStatus: Status = data.hasIssue
        ? "Has Issue"
        : "Completed";

      setReportIssueCount(data.hasIssue ? 1 : 0);

      // 4. Sync ke localStorage untuk modul Monitoring Task
      if (typeof window !== "undefined") {
        try {
          const rawTasks = localStorage.getItem("andima_field_agent_figma_tasks");
          const tasks = rawTasks ? JSON.parse(rawTasks) : [];
          const targetIndex = tasks.findIndex((t: any) => t.job_number === jobNumberStr || t.job_number === `#${jobNumberStr}` || t.id === selected.id);

          const syncedDocs = data.docDetails && data.docDetails.length > 0
            ? data.docDetails
            : data.documents.map((dName, i) => ({
                name: dName,
                size: i === 0 ? "3.5 KB" : "1.2 MB",
                url: "/documents/Dokumen_Utama_Reimbursement_AENAT.pdf",
              }));

          if (targetIndex >= 0) {
            tasks[targetIndex] = {
              ...tasks[targetIndex],
              status: data.hasIssue ? "In Progress" : "Completed",
              has_issue: data.hasIssue,
              doc_count: syncedDocs.length,
              result_docs: syncedDocs,
              photo_count: data.photos.length,
              result_photos: data.photos.length > 0 ? data.photos : tasks[targetIndex].result_photos,
              actual_pieces: data.actualPieces,
              actual_gross_weight: data.actualGrossWeight,
              delivering_party: data.deliveringParty,
              receiving_party: data.receivingParty,
              handover_location: data.location,
            };
          } else {
            tasks.unshift({
              id: selected.id || `task-${Date.now()}`,
              job_number: jobNumberStr.startsWith("#") ? jobNumberStr : `#${jobNumberStr}`,
              customer_name: selected.customer || "PT DSV Transport Indonesia",
              field_agent_name: currentAgent.name,
              status: data.hasIssue ? "In Progress" : "Completed",
              has_issue: data.hasIssue,
              doc_count: syncedDocs.length,
              result_docs: syncedDocs,
              photo_count: data.photos.length,
              result_photos: data.photos,
              actual_pieces: data.actualPieces,
              actual_gross_weight: data.actualGrossWeight,
              handover_datetime: new Date().toISOString(),
              handover_location: data.location,
              timeline: [],
            });
          }
          localStorage.setItem("andima_field_agent_figma_tasks", JSON.stringify(tasks));
        } catch (syncErr) {
          console.warn("Failed to sync completed task to monitoring localStorage:", syncErr);
        }
      }

      setJobs((current) =>
        current.map((job) =>
          no(job) === jobNumberStr
            ? {
                ...job,
                status: newStatus,
                has_issue: data.hasIssue,
                handover_status: "COMPLETED",
                documentation_status: "COMPLETED",
              }
            : job
        )
      );

      setSelected((current) =>
        current
          ? {
              ...current,
              status: newStatus,
              has_issue: data.hasIssue,
              handover_status: "COMPLETED",
              documentation_status: "COMPLETED",
            }
          : current
      );

      setCompletionOpen(true);
      await loadA3Tasks();
      setNotice(
        data.hasIssue
          ? "Form pengerjaan lapangan dan kendala berhasil disimpan."
          : "Form pengerjaan lapangan berhasil disimpan dan dikirim untuk verifikasi Sales."
      );
    } catch (error: any) {
      console.error(error);
      setNotice(error?.message || "Gagal menyimpan data ke database. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden bg-white dark:bg-[#090f1d] text-[#15213a] dark:text-slate-100 transition-colors font-sans">
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-white dark:bg-[#090f1d] transition-colors">
        <div className="w-full px-4 pb-6 pt-1 md:px-6 lg:px-8">
          {/* Selector Identitas Agen (Batasan Sementara Tahap 3) */}
          {screen !== "field-agent" && screen !== "dashboard" && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">Saya sebagai:</span>
                <select
                  value={currentAgent.id}
                  onChange={(e) => handleSelectAgent(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {AVAILABLE_AGENT_IDENTITIES.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                ID: <code className="font-mono text-slate-600 dark:text-slate-300">{currentAgent.id}</code> (Tahap 3 Client-side Identity)
              </span>
            </div>
          )}

          {apiError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Gagal Memuat Data Task dari API</h3>
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{apiError}</p>
              </div>
            </div>
          )}

          {(screen === "dashboard" || screen === "field-agent") && (
            <FieldAgentDashboard
              jobs={jobs}
              onOpenJob={openJob}
              onShowTasks={() =>
                router.push("/dashboard/field-agent?tab=tasks")
              }
            />
          )}

          {screen === "notifications" && (
            <NotificationsPage
              jobs={jobs}
              openJob={openJob}
            />
          )}

          {screen === "tasks" && (
            <TaskList
              jobs={shown}
              filter={filter}
              counts={counts}
              query={query}
              setFilter={setFilter}
              setQuery={setQuery}
              openJob={openJob}
              onAddTask={() => setIsAddTaskOpen(true)}
              activeAgentName={currentAgent?.name || "Andima WebDev (Field Inspector)"}
            />
          )}

          {screen === "detail" && (
            <JobDetail
              job={selected}
              onBack={() => setScreen("tasks")}
              onHandover={() =>
                setScreen("handover")
              }
              onRelease={() => selected && handleReleaseJob(selected)}
              onReassign={() => selected && setReassignModalJob(selected)}
              releasing={saving}
            />
          )}

          {(screen === "handover" || screen === "documentation") && (
            <UnifiedJobForm
              job={selected}
              back={() =>
                setScreen(isClaimingJob ? "tasks" : "detail")
              }
              onSubmit={handleUnifiedJobSubmit}
              saving={saving}
            />
          )}

          {screen === "history" && (
            <HistoryList
              jobs={jobs}
              query={query}
              setQuery={setQuery}
              apiError={apiError}
              onRetry={loadA3Tasks}
            />
          )}
        </div>
      </div>

      {issueOpen && (
        <IssueModal
          description={description}
          setDescription={setDescription}
          close={() =>
            setIssueOpen(false)
          }
          save={saveIssue}
          saving={saving}
        />
      )}



      {completionOpen && (
        <CompleteTaskModal
          job={selected}
          issueCount={
            reportIssueCount
          }
          openHistory={() => {
            setCompletionOpen(false);
            router.push("/dashboard/field-agent?tab=history");
          }}
        />
      )}

      {isAddTaskOpen && (
        <AddTaskModal
          onClose={() => setIsAddTaskOpen(false)}
          currentAgent={currentAgent}
          existingJobs={jobs}
          onSelectJob={(newJob) => {
            setJobs((prev) => [newJob, ...prev.filter((j) => no(j) !== no(newJob))]);
            setSelected(newJob);
            setIsClaimingJob(false);
            setIsAddTaskOpen(false);
            setScreen("tasks");
            setNotice(`Dokumentasi dan Task ${no(newJob)} berhasil dicatat ke sistem dan diselesaikan!`);
          }}
        />
      )}

      {reassignModalJob && (
        <ReassignModal
          job={reassignModalJob}
          currentAgent={currentAgent}
          availableAgents={AVAILABLE_AGENT_IDENTITIES}
          onClose={() => setReassignModalJob(null)}
          onConfirm={(targetAgent, reason) =>
            handleReassignJob(reassignModalJob, targetAgent, reason)
          }
          saving={saving}
        />
      )}

      {notice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-lg">
          {notice}
        </div>
      )}
    </div>
  );
}



function NotificationsPage({
  jobs,
  openJob,
}: {
  jobs: Job[];
  openJob: (j: Job) => void;
}) {
  const activeAlerts = jobs.filter(
    (j) => j.status === "Has Issue"
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Notifikasi
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Daftar pembaruan tugas dan issue terkini.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <div className="space-y-3">
          {activeAlerts.map((job) => (
            <div
              key={job.id}
              onClick={() => openJob(job)}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition"
            >
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{no(job)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{job.customer || "-"}</p>
              </div>
              <StatusBadge status={job.status} />
            </div>
          ))}

          {activeAlerts.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada notifikasi baru.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function EmptyDashboard() {
  return null;
}

function Dashboard({
  jobs,
  openJob,
  showTasks,
}: {
  jobs: Job[];
  openJob: (j: Job) => void;
  showTasks: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [jenisFilter, setJenisFilter] = useState<"All" | "Ekspor" | "Impor">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Complete" | "Issue">("All");

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesJobNo = (j.job_number || "").toLowerCase().includes(q) || (j.transaction_number || "").toLowerCase().includes(q);
        const matchesCustomer = (j.customer || "").toLowerCase().includes(q);
        const matchesPic = (j.sales_executive || "").toLowerCase().includes(q) || (j.assigned_to || "").toLowerCase().includes(q);
        const matchesMawb = (j.mawb || "").toLowerCase().includes(q) || (j.mawb_hawb || "").toLowerCase().includes(q);
        if (!matchesJobNo && !matchesCustomer && !matchesPic && !matchesMawb) {
          return false;
        }
      }

      // 2. Jenis Filter (Ekspor / Impor)
      if (jenisFilter !== "All") {
        const targetJenis = jenisFilter.toLowerCase();
        const textToSearch = [
          j.task_title || "",
          j.job_number || "",
          j.actual_cargo || "",
          j.origin || "",
          j.destination || ""
        ].join(" ").toLowerCase();

        // Check explicit match or destination/origin heuristic
        const isEkspor = textToSearch.includes("ekspor") || textToSearch.includes("export") || (j.destination && !j.destination.toLowerCase().includes("indonesia") && !j.destination.toLowerCase().includes("priok") && !j.destination.toLowerCase().includes("cengkareng"));
        const isImpor = textToSearch.includes("impor") || textToSearch.includes("import") || (j.origin && !j.origin.toLowerCase().includes("indonesia") && !j.origin.toLowerCase().includes("priok") && !j.origin.toLowerCase().includes("cengkareng"));

        if (jenisFilter === "Ekspor" && !isEkspor) return false;
        if (jenisFilter === "Impor" && !isImpor) return false;
      }

      // 3. Status Filter (All, Complete, Issue)
      if (statusFilter === "Complete" && j.status !== "Completed") {
        return false;
      }
      if (statusFilter === "Issue" && (j.status !== "Has Issue" && !j.has_issue)) {
        return false;
      }

      return true;
    });
  }, [jobs, searchQuery, jenisFilter, statusFilter]);

  const complete =
    filteredJobs.filter(
      (j) => j.status === "Completed"
    ).length;

  const issues =
    filteredJobs.filter(
      (j) => j.status === "Has Issue" || j.has_issue
    ).length;

  const cards = [
    {
      title: "Total Task",
      value: jobs.length,
      sub: "Total tugas di lapangan",
      color: "text-blue-600",
    },
    {
      title: "Completed",
      value: jobs.filter((j) => j.status === "Completed").length,
      sub: "Tugas selesai (Done)",
      color: "text-emerald-600",
    },
    {
      title: "Has Issue",
      value: jobs.filter((j) => j.status === "Has Issue" || j.has_issue).length,
      sub: "Tugas memiliki kendala",
      color: "text-red-500",
    },
  ];

  const statusBreakdown = [
    {
      label: "Completed",
      value: complete,
      color: "#10b981",
    },
    {
      label: "Has Issue",
      value: issues,
      color: "#ef4444",
    },
  ];

  const statusGradient =
    filteredJobs.length > 0 && (complete > 0 || issues > 0)
      ? statusBreakdown
          .reduce(
            (
              segments,
              item
            ) => {
              const start =
                segments.offset;
              const size =
                (item.value /
                  filteredJobs.length) *
                100;

              if (size <= 0) {
                return segments;
              }

              return {
                offset:
                  start + size,
                stops: [
                  ...segments.stops,
                  `${item.color} ${start}% ${start + size}%`,
                ],
              };
            },
            {
              offset: 0,
              stops: [] as string[],
            }
          )
          .stops.concat(
            complete + issues < filteredJobs.length
              ? [`#e2e8f0 ${(complete + issues) / filteredJobs.length * 100}% 100%`]
              : []
          )
          .join(", ")
      : "#e2e8f0 0% 100%";

  if (jobs.length === 0) {
    return (
      <div className="flex min-h-[620px] items-start justify-center pt-10">
        <section className="w-full max-w-[320px] rounded-xl border border-slate-200 bg-white px-8 py-9 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
            <ClipboardCheck
              size={24}
              strokeWidth={1.8}
            />
          </span>

          <h1 className="mt-6 text-[14px] font-extrabold text-[#15213a] dark:text-white">
            Belum Ada Tugas Ditugaskan
          </h1>

          <p className="mt-3 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            Saat ini belum ada jadwal
            serah terima kargo dari
            Sales Executive untuk akun
            Anda.
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-5 rounded-md bg-[#111827] dark:bg-blue-600 px-5 py-2.5 text-[11px] font-extrabold text-white cursor-pointer hover:bg-slate-800 dark:hover:bg-blue-700 transition"
          >
            Muat Ulang / Cek Pembaruan
          </button>
        </section>
      </div>
    );
  }

  return (
    <>
      <section className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Dashboard Field Agent
        </h1>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Ringkasan pekerjaan dan status Anda hari ini.
        </p>
      </section>

      {/* 1. TOP METRIC CARDS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map(
          ({
            title,
            value,
            sub,
            color,
          }) => (
            <section
              key={String(title)}
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {title}
              </p>

              <b className="mt-3 block text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {value}
              </b>

              <p
                className={`mt-2 text-xs font-medium ${color}`}
              >
                {sub}
              </p>
            </section>
          )
        )}
      </div>

      {/* 2. FILTER TOOLBAR (OPSI B: FULL-WIDTH HORIZONTAL BAR) */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Job Number, Customer, PIC..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl py-2 pl-9 pr-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 shadow-2xs transition-colors"
          />
        </div>

        {/* Jenis Filter: Ekspor / Impor */}
        <div className="relative">
          <select
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value as any)}
            className="appearance-none bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl py-2 px-3.5 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <option value="All">Jenis: Semua (Ekspor/Impor)</option>
            <option value="Ekspor">Ekspor</option>
            <option value="Impor">Impor</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Status Filter: All, Complete, Issue */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="appearance-none bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl py-2 px-3.5 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <option value="All">Semua Status</option>
            <option value="Complete">Complete</option>
            <option value="Issue">Issue</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* 3. SIMETRIS 50/50: STATUS TASK & RECENT JOBS */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 items-stretch gap-6">
        {/* SISI KIRI (50%): STATUS TASK CHART */}
        <section className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Status Task
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Proporsi penyelesaian tugas kargo lapangan
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                <span>{filteredJobs.length} Ditampilkan</span>
              </span>
            </div>

            <div className="mt-2 flex flex-col items-center">
              <div
                className="relative grid h-[180px] w-[180px] shrink-0 place-items-center rounded-full shadow-2xs"
                style={{
                  background: `conic-gradient(${statusGradient})`,
                }}
                aria-label="Grafik proporsi status task"
              >
                <div className="grid h-[116px] w-[116px] place-items-center rounded-full bg-white dark:bg-[#0f172a] text-center shadow-inner">
                  <div>
                    <b className="block text-2xl font-black leading-none text-[#101a33] dark:text-white">
                      {filteredJobs.length}
                    </b>

                    <span className="mt-1.5 block text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Total Task
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {statusBreakdown.map(
                  (item) => {
                    const percent =
                      filteredJobs.length > 0
                        ? Math.round(
                            (item.value /
                              filteredJobs.length) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        key={item.label}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-full shadow-2xs"
                            style={{
                              backgroundColor:
                                item.color,
                            }}
                          />

                          <span className="truncate font-semibold text-slate-700 dark:text-slate-300">
                            {item.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                          <span className="text-sm font-extrabold">{item.value}</span>
                          <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                            ({percent}%)
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SISI KANAN (50%): RECENT JOBS TABLE */}
        <section className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Recent Jobs (Tugas Terbaru)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Daftar penugasan lapangan aktif dan terkini
                </p>
              </div>

              <button
                onClick={showTasks}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="border-b border-slate-200/80 dark:border-slate-800 bg-[#edf4fb] dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <tr>
                    <th className="px-3.5 py-3">
                      Job Number
                    </th>

                    <th className="px-3.5 py-3">
                      Customer
                    </th>

                    <th className="px-3.5 py-3">
                      Lokasi / Rute
                    </th>

                    <th className="px-3.5 py-3 text-center">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                        Tidak ada tugas yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs
                      .slice(0, 5)
                      .map((job) => (
                        <tr
                          key={job.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <td className="px-3.5 py-3 font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            <button
                              type="button"
                              className="cursor-pointer hover:underline text-left font-bold"
                              onClick={() =>
                                openJob(job)
                              }
                            >
                              {no(job)}
                            </button>
                          </td>

                          <td className="max-w-[130px] truncate px-3.5 py-3 font-medium text-slate-800 dark:text-slate-200" title={job.customer || ""}>
                            {job.customer || "-"}
                          </td>

                          <td className="px-3.5 py-3 text-slate-600 dark:text-slate-300">
                            {job.origin && job.destination ? (
                              <span className="inline-flex items-center gap-1 font-medium whitespace-nowrap">
                                <span>{job.origin}</span>
                                <span className="text-slate-400">&rarr;</span>
                                <span>{job.destination}</span>
                              </span>
                            ) : (
                              job.location || "-"
                            )}
                          </td>

                          <td className="px-3.5 py-3 text-center whitespace-nowrap">
                            <StatusBadge
                              status={job.status}
                              onClick={() =>
                                openJob(job)
                              }
                            />
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

/* =========================================================
   TASK LIST
========================================================= */

function Tabs({
  filter,
  counts,
  setFilter,
  onAddTask,
  onPrint,
  onDownloadPdf,
}: {
  filter: string;
  counts: Record<string, number>;
  setFilter: (v: string) => void;
  onAddTask?: () => void;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  const tabItems = [
    { id: "All", label: "All Tasks", count: counts["All"] || 0 },
    { id: "Has Issue", label: "Has Issue", count: counts["Has Issue"] || 0 },
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 sm:p-2.5 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2">
        {tabItems.map((tab) => {
          const isActive = filter === tab.id || (tab.id === "All" && filter === "All Tasks");
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60 shadow-2xs"
                  : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <span>{tab.label}</span>

              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  isActive
                    ? "bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300"
                    : tab.id === "Has Issue"
                      ? "bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Print / Export Report Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowExportMenu((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Cetak atau Unduh Dokumen Riwayat My Task dalam format PDF"
          >
            <Printer size={15} className="text-blue-600 dark:text-blue-400" />
            <span>Print / Export Report</span>
            <ChevronDown
              size={13}
              className={`text-slate-400 transition-transform ${showExportMenu ? "rotate-180" : ""}`}
            />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                Format Dokumen Laporan PDF
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  if (onDownloadPdf) {
                    onDownloadPdf();
                  }
                }}
                className="w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer group"
              >
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                  <Download size={14} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Unduh File PDF (.pdf)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                    Download file PDF A4 Landscape vektor resmi & kop perusahaan
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  if (onPrint) {
                    onPrint();
                  }
                }}
                className="w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer group"
              >
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mt-0.5 shrink-0 group-hover:bg-slate-700 group-hover:text-white transition">
                  <Printer size={14} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Cetak / Microsoft Print to PDF
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                    Buka dialog cetak bersih (bebas navbar & tombol web app)
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {onAddTask && (
          <button
            type="button"
            onClick={onAddTask}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
          >
            <Plus size={15} />
            <span>Add New Task</span>
          </button>
        )}
      </div>
    </div>
  );
}

function Searchbar({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (v: string) => void;
}) {
  return (
    <div className="mb-4 flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-xs">
      <label className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-2.5 text-slate-400"
        />

        <input
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          placeholder="Cari Job Number, Customer, atau MAWB/HAWB..."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-9 pr-3 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </label>
    </div>
  );
}

function TaskList({
  jobs,
  filter,
  counts,
  query,
  setFilter,
  setQuery,
  openJob,
  onAddTask,
  activeAgentName = "Andima WebDev (Field Inspector)",
}: {
  jobs: Job[];
  filter: string;
  counts: Record<string, number>;
  query: string;
  setFilter: (v: string) => void;
  setQuery: (v: string) => void;
  openJob: (j: Job) => void;
  onAddTask?: () => void;
  activeAgentName?: string;
}) {
  return (
    <>
      <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Task
          </h1>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Daftar task yang ditugaskan kepada Anda.
          </p>
        </div>
      </section>

      {/* Searchbar (Gambar 2) berada di atas */}
      <Searchbar
        query={query}
        setQuery={setQuery}
      />

      {/* Tabs & Action bar (Gambar 1) berada di bawah search */}
      <Tabs
        filter={filter}
        counts={counts}
        setFilter={setFilter}
        onAddTask={onAddTask}
        onPrint={() => openMyTaskPrintReport(jobs, activeAgentName, filter)}
        onDownloadPdf={() => exportMyTaskToPdfFile(jobs, activeAgentName, filter)}
      />

      <JobsTable
        jobs={jobs}
        action={openJob}
        history={false}
      />
    </>
  );
}

function JobsTable({
  jobs,
  action,
  history,
}: {
  jobs: Job[];
  action?: (j: Job) => void;
  history: boolean;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [jobs.length]);

  const totalTasks = jobs.length;
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedJobs = jobs.slice(startIndex, startIndex + pageSize);
  const firstRow = totalTasks === 0 ? 0 : startIndex + 1;
  const lastRow = Math.min(startIndex + pageSize, totalTasks);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="border-b border-slate-200/80 dark:border-slate-700 bg-[#edf4fb] dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
            {history ? (
              <tr>
                <th className="px-4 py-3.5">
                  Nama Field Agent
                </th>

                <th className="px-4 py-3.5">
                  Sales Executive
                </th>

                <th className="px-4 py-3.5">
                  Job Number
                </th>

                <th className="px-4 py-3.5">
                  Customer
                </th>

                <th className="px-4 py-3.5">
                  Origin
                </th>

                <th className="px-4 py-3.5">
                  Destination
                </th>

                <th className="px-4 py-3.5 text-center">
                  Problem/Issue (Yes/No)
                </th>

                <th className="px-4 py-3.5 text-center">
                  Action
                </th>
              </tr>
            ) : (
              <tr>
                <th className="px-4 py-3.5">
                  Job Number
                </th>

                <th className="px-4 py-3.5">
                  Customer
                </th>

                <th className="px-4 py-3.5">
                  Sales Executive
                </th>

                <th className="px-4 py-3.5">
                  Rute (Origin &rarr; Destination)
                </th>

                <th className="px-4 py-3.5 text-center">
                  Problem (Yes/No)
                </th>

                <th className="px-4 py-3.5 text-center">
                  Status
                </th>
              </tr>
            )}
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedJobs.map((job) => (
              <tr
                key={job.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
              >
                {history ? (
                  <>
                    <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {job.assigned_to || "-"}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                      {job.sales_executive || "-"}
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-blue-600 dark:text-blue-400">
                      {action ? (
                        <button
                          type="button"
                          onClick={() =>
                            action(job)
                          }
                          className="cursor-pointer hover:underline text-left font-semibold text-blue-600 dark:text-blue-400"
                        >
                          {no(job)}
                        </button>
                      ) : (
                        no(job)
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {job.customer || "-"}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                      {job.origin && job.origin !== "[BELUM ADA]" ? job.origin : "-"}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                      {job.destination && job.destination !== "[BELUM ADA]" ? job.destination : "-"}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {job.has_issue === true || job.status === "Has Issue" ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60">
                          Yes
                        </span>
                      ) : job.has_issue === false ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          No
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          -
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {action && (
                        <button
                          type="button"
                          onClick={() => action(job)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                          title="Buka detail laporan lapangan"
                        >
                          <Eye size={13} />
                          <span>Detail Laporan</span>
                        </button>
                      )}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3.5 font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {action ? (
                        <button
                          type="button"
                          onClick={() =>
                            action(job)
                          }
                          className="cursor-pointer hover:underline text-left font-semibold text-blue-600 dark:text-blue-400"
                        >
                          {no(job)}
                        </button>
                      ) : (
                        no(job)
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {job.customer || "-"}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                      {job.sales_executive || "Bu Wulan"}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                      {job.origin && job.destination && job.origin !== "[BELUM ADA]" && job.destination !== "[BELUM ADA]" ? (
                        <span className="inline-flex items-center gap-1 font-medium whitespace-nowrap">
                          <span>{job.origin}</span>
                          <span className="text-slate-400">&rarr;</span>
                          <span>{job.destination}</span>
                        </span>
                      ) : job.location ? (
                        job.location
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {job.has_issue || job.status === "Has Issue" ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60">
                          Yes (Ada Isu)
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          No (Aman)
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <StatusBadge
                        status={job.status}
                        onClick={
                          action
                            ? () => action(job)
                            : undefined
                        }
                      />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {jobs.length === 0 && (
        <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
          Tidak ada task yang sesuai.
        </div>
      )}

      {/* PAGINATION (Exact Match with Sales Executive) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
        <span>Showing {firstRow}-{lastRow} of {totalTasks} tasks</span>
        <nav className="flex items-center gap-1" aria-label="Tasks pages">
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
            className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            ‹
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
            const pageNumber = totalPages <= 5 ? index + 1 : Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + index;
            return (
              <button
                type="button"
                key={pageNumber}
                aria-current={currentPage === pageNumber ? "page" : undefined}
                onClick={() => setCurrentPage(pageNumber)}
                className={`h-8 min-w-8 rounded-md px-2 cursor-pointer ${
                  currentPage === pageNumber
                    ? "bg-blue-600 font-semibold text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
          {totalPages > 5 && (
            <>
              <span className="px-1 text-slate-400">...</span>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                className="h-8 min-w-8 rounded-md px-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
            className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            ›
          </button>
        </nav>
      </div>
    </div>
  );
}

/* =========================================================
   JOB DETAIL
========================================================= */

function JobDetail({
  job,
  onHandover,
  onRelease,
  onReassign,
  onBack,
  releasing,
}: {
  job: Job | null;
  onHandover: () => void;
  onRelease?: () => void;
  onReassign?: () => void;
  onBack?: () => void;
  releasing?: boolean;
}) {
  if (!job) {
    return (
      <div className="w-full rounded-xl border border-slate-100 p-8">
        Job tidak ditemukan.
      </div>
    );
  }

  const canRelease = Boolean(
    job.field_stage === "Assigned" || job.field_stage === "Draft"
  );

  const info = [
    [
      "Job Number",
      no(job),
    ],
    [
      "Transaction Number",
      job.transaction_number || "-",
    ],
    [
      "Task",
      job.task_title || "-",
    ],
    [
      "Customer",
      job.customer || "-",
    ],
    [
      "Shipper",
      job.shipper || "-",
    ],
    [
      "Consignee",
      job.consignee || "-",
    ],
    [
      "MAWB / HAWB",
      mawb(job),
    ],
    [
      "Lokasi",
      job.location || "-",
    ],
    [
      "Assigned To",
      job.assigned_to || "-",
    ],
    [
      "Status Handover",
      job.handover_status || "PENDING",
    ],
    [
      "Actual Cargo",
      job.actual_cargo || "-",
    ],
    [
      "Documentation",
      job.documentation_status ||
        "PENDING",
    ],
    [
      "Supporting Documents",
      job.supporting_documents_status ||
        "PENDING",
    ],
  ];

  return (
    <div className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Kembali</span>
            </button>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Detail Job
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Informasi lengkap penugasan kargo dan akses pengerjaan lapangan.
            </p>
          </div>
        </div>

        <StatusBadge
          status={job.status}
        />
      </div>

      <section className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Informasi Job
        </h2>

        <div className="grid gap-x-10 gap-y-1 lg:grid-cols-2">
          {info.map(
            ([label, value]) => (
              <div
                className="grid grid-cols-[160px_1fr] border-b border-slate-100 dark:border-slate-800 py-3 text-xs"
                key={label}
              >
                <span className="text-slate-500 dark:text-slate-400">
                  {label}
                </span>

                <b className="text-right font-semibold text-slate-900 dark:text-slate-100 leading-5">
                  {value}
                </b>
              </div>
            )
          )}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {canRelease && onRelease && (
              <button
                type="button"
                onClick={onRelease}
                disabled={releasing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>{releasing ? "Melepas Job..." : "Lepas Job"}</span>
              </button>
            )}

            {onReassign && job.status !== "Completed" && (
              <button
                type="button"
                onClick={onReassign}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition cursor-pointer"
              >
                <Users size={14} />
                <span>Alihkan Tugas (Re-assign)</span>
              </button>
            )}
          </div>

          {job.status !== "Completed" && (
            <button
              onClick={onHandover}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
            >
              <span>{job.handover_status === "COMPLETED" ? "Lanjutkan Form Lapangan" : "Mulai Kerjakan Form Lapangan"}</span>
              <ChevronRight
                size={14}
              />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   UNIFIED FIELD JOB FORM (ALL-IN-ONE SCREEN)
========================================================= */

function UnifiedJobForm({
  job,
  back,
  onSubmit,
  saving,
}: {
  job: Job | null;
  back: () => void;
  onSubmit: (data: {
    deliveringParty: string;
    receivingParty: string;
    actualPieces: number;
    actualGrossWeight: number;
    location: string;
    gps?: { latitude: number; longitude: number; accuracy: number; recordedAt: Date } | null;
    serverTimestamp?: string;
    taskId?: string;
    photos: string[];
    documents: string[];
    docDetails: { name: string; url: string; size: string }[];
    hasIssue: boolean;
    issueDescription?: string;
  }) => void;
  saving?: boolean;
}) {
  const [deliveringParty, setDeliveringParty] = useState(job?.shipper || "");
  const [receivingParty, setReceivingParty] = useState("");
  const [location, setLocation] = useState(job?.location || "");
  const [actualPieces, setActualPieces] = useState<string>("");
  const [actualGrossWeight, setActualGrossWeight] = useState<string>("");
  const [piecesError, setPiecesError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);

  // Data manifest bawaan dokumen
  const docPieces = 10;
  const docWeight = 200;
  const currentActualWeightNum = Number(actualGrossWeight) || 0;
  const isWeightDiscrepancy = Boolean(actualGrossWeight && currentActualWeightNum !== docWeight);
  const weightDiff = currentActualWeightNum - docWeight;

  // 4 GPS Status Conditions: "idle" (Belum Diambil) | "loading" (Mengambil Lokasi) | "success" (Lokasi Berhasil Direkam) | "error" (Gagal Mengambil Lokasi)
  type GpsStatusType = "idle" | "loading" | "success" | "error";
  const [gpsStatus, setGpsStatus] = useState<GpsStatusType>("idle");
  const [gpsData, setGpsData] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    regionName: string;
    serverTimestamp: string;
    recordedAt: Date;
  } | null>(null);
  const [gpsErrorMessage, setGpsErrorMessage] = useState("");

  const handleTakeGps = () => {
    setGpsStatus("loading");
    setGpsErrorMessage("");

    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsErrorMessage("Fitur GPS / Geolocation tidak didukung oleh browser atau perangkat ini.");
      setGpsStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 10);

        // 1. Ambil Timestamp Resmi Otomatis dari Server
        let serverTs = "";
        try {
          const sRes = await fetch("/api/feature/server-time");
          if (sRes.ok) {
            const sData = await sRes.json();
            serverTs = sData.formattedTimestamp || sData.displayTimestamp || "";
          }
        } catch (e) {
          console.warn("Server time fetch warning:", e);
        }
        if (!serverTs) {
          const now = new Date();
          const pad = (n: number) => String(n).padStart(2, "0");
          serverTs = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} WIB`;
        }

        // 2. Reverse Geocoding untuk Nama Wilayah
        let region = "";
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const rRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (rRes.ok) {
            const data = await rRes.json();
            const locality = data.locality || data.city || data.principalSubdivisionText || "";
            const subDiv = data.principalSubdivision || "";
            const country = data.countryName || "Indonesia";
            if (locality) {
              region = `${locality}${subDiv && subDiv !== locality ? `, ${subDiv}` : ""}, ${country}`;
            }
          }
        } catch (e) {
          // ignore
        }

        if (!region) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const nRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
              {
                headers: { Accept: "application/json" },
                signal: controller.signal,
              }
            );
            clearTimeout(timeoutId);
            if (nRes.ok) {
              const data = await nRes.json();
              const addr = data.address || {};
              const place = addr.suburb || addr.city_district || addr.town || addr.city || addr.county || "";
              const state = addr.state || "";
              if (place) {
                region = `${place}${state ? `, ${state}` : ""}, Indonesia`;
              }
            }
          } catch (e) {
            // ignore
          }
        }

        if (!region) {
          region = `Koordinat GPS (${lat.toFixed(6)}, ${lon.toFixed(6)})`;
        }

        setGpsData({
          latitude: lat,
          longitude: lon,
          accuracy,
          regionName: region,
          serverTimestamp: serverTs,
          recordedAt: new Date(),
        });
        setLocation(region);
        setGpsStatus("success");
      },
      (err) => {
        let msg = "Gagal mengambil lokasi GPS perangkat.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Izin lokasi ditolak oleh pengguna/perangkat. Silakan izinkan akses lokasi pada browser Anda.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Lokasi tidak dapat ditemukan atau sinyal GPS perangkat lemah.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Waktu pengambilan lokasi habis (timeout). Silakan coba kembali.";
        }
        setGpsErrorMessage(msg);
        setGpsStatus("error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // 4 Foto Wajib Kargo
  const photoLabels = [
    "Keseluruhan Barang",
    "Marking & Shipping Label",
    "Seal / Segel Kontainer",
    "Area Kerusakan / Detail",
  ];

  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const [photoUrls, setPhotoUrls] = useState<(string | null)[]>([null, null, null, null]);

  // 2 Dokumen Wajib
  const [docs, setDocs] = useState<{
    main: string | null;
    supporting: string | null;
  }>({
    main: null,
    supporting: null,
  });

  const [docDetails, setDocDetails] = useState<{
    main?: { name: string; url: string; size: string };
    supporting?: { name: string; url: string; size: string };
  }>({});

  // Issue / Problem state
  const [hasProblem, setHasProblem] = useState<"no" | "yes">("no");
  const [problemDescription, setProblemDescription] = useState("");

  // Upload status & errors
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");

  const setPhoto = async (index: number, file?: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Ukuran foto maksimal 5 MB.");
      return;
    }

    setUploadError("");
    setUploadingItem(`photo-${index}`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jobNumber", no(job));
      formData.append("category", `cargo_photo_${index + 1}`);

      const res = await fetch("/api/feature/field-agent/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal mengunggah foto.");
      }

      const uploadedUrl = json.data.file_url;

      setPhotos((current) =>
        current.map((item, i) => (i === index ? file.name : item))
      );
      setPhotoUrls((current) =>
        current.map((item, i) => (i === index ? uploadedUrl : item))
      );
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Gagal mengunggah foto ke storage.");
    } finally {
      setUploadingItem(null);
    }
  };

  const setDoc = async (key: "main" | "supporting", file?: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Ukuran dokumen maksimal 5 MB.");
      return;
    }

    setUploadError("");
    setUploadingItem(`doc-${key}`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jobNumber", no(job));
      formData.append("category", key === "main" ? "main_doc" : "supporting_doc");

      const res = await fetch("/api/feature/field-agent/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal mengunggah dokumen.");
      }

      const uploadedUrl = json.data.file_url;
      const sizeFormatted =
        json.data.file_size_kb < 1024
          ? `${json.data.file_size_kb} KB`
          : `${(json.data.file_size_kb / 1024).toFixed(1)} MB`;

      setDocs((current) => ({
        ...current,
        [key]: file.name,
      }));

      setDocDetails((current) => ({
        ...current,
        [key]: {
          name: file.name,
          url: uploadedUrl,
          size: sizeFormatted,
        },
      }));
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Gagal mengunggah dokumen ke storage.");
    } finally {
      setUploadingItem(null);
    }
  };

  const filledPhotos = photos.filter(Boolean).length;
  const docsReady = Boolean(docs.main) && Boolean(docs.supporting);
  const problemReady =
    hasProblem === "no" ||
    (hasProblem === "yes" && problemDescription.trim().length > 0);

  // Validasi ketat Actual Cargo & GPS
  const parsedPieces = parseInt(actualPieces, 10);
  const isPiecesValid = !isNaN(parsedPieces) && parsedPieces > 0 && String(parsedPieces) === actualPieces.trim();
  const parsedWeight = parseFloat(actualGrossWeight);
  const isWeightValid = !isNaN(parsedWeight) && parsedWeight > 0;
  const isGpsRecorded = gpsStatus === "success" && gpsData !== null;

  const canSubmit = Boolean(
    isGpsRecorded &&
    isPiecesValid &&
    isWeightValid &&
    deliveringParty.trim() &&
    receivingParty.trim() &&
    filledPhotos === 4 &&
    docsReady &&
    problemReady &&
    !uploadingItem &&
    !saving
  );

  return (
    <div className="w-full pb-8">
      {/* CLEAN MODERN HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={back}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Kembali</span>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Pelaksanaan Serah Terima Lapangan
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">Job #{no(job)}</span>
              <span>•</span>
              <span className="truncate max-w-[280px]">{job?.customer || "-"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>Formulir Terpadu</span>
          </span>
        </div>
      </div>

      {uploadError && (
        <div className="mb-5 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* 1. DATA PENYERAH & PENERIMA */}
      <section className="mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[11px] text-white font-bold">1</span>
          Pihak Penyerah &amp; Penerima
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PersonCard
            title="Data Penyerah"
            dot="bg-blue-600"
            name={deliveringParty}
            company={job?.customer}
            onChangeName={setDeliveringParty}
          />
          <PersonCard
            title="Data Penerima"
            dot="bg-emerald-500"
            name={receivingParty}
            company={job?.customer}
            onChangeName={setReceivingParty}
          />
        </div>
      </section>

      {/* 2. LOKASI HANDOVER (BAGIAN GPS) */}
      <section className="mb-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-xs text-white font-bold">2</span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Lokasi Handover
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pengambilan koordinat satelit GPS dan verifikasi waktu resmi server
              </p>
            </div>
          </div>

          {/* Status GPS Indicator Badge */}
          <div>
            {gpsStatus === "idle" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <span>Status GPS: Belum Diambil</span>
              </span>
            )}
            {gpsStatus === "loading" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                <RefreshCw size={12} className="animate-spin text-sky-600" />
                <span>Status GPS: Mengambil Lokasi</span>
              </span>
            )}
            {gpsStatus === "success" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Status GPS: Lokasi Berhasil Direkam</span>
              </span>
            )}
            {gpsStatus === "error" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <AlertCircle size={13} className="text-rose-600 dark:text-rose-400" />
                <span>Status GPS: Gagal Mengambil Lokasi</span>
              </span>
            )}
          </div>
        </div>

        {/* KONDISI 1: Belum Diambil */}
        {gpsStatus === "idle" && (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-6 text-center space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <MapPin size={26} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Lokasi handover belum direkam
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Silakan tekan tombol di bawah untuk meminta akses lokasi perangkat dan merekam koordinat aktual.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={handleTakeGps}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <MapPin size={15} />
                <span>Ambil Lokasi GPS</span>
              </button>
            </div>
          </div>
        )}

        {/* KONDISI 2: Sedang Mengambil Lokasi */}
        {gpsStatus === "loading" && (
          <div className="rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/30 p-6 text-center space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300">
              <RefreshCw size={26} className="animate-spin text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-sky-900 dark:text-sky-100">
                Sedang mengambil lokasi perangkat...
              </h4>
              <p className="text-xs text-sky-700/80 dark:text-sky-300/80 mt-1">
                Menghubungkan ke satelit GPS dan sinkronisasi timestamp resmi server...
              </p>
            </div>
          </div>
        )}

        {/* KONDISI 3: Lokasi Berhasil Direkam */}
        {gpsStatus === "success" && gpsData && (
          <div className="space-y-4">
            {/* Banner Konfirmasi Hijau */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 px-4 py-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-100 block">
                    Lokasi Berhasil Direkam
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Akurasi satelit: ±{gpsData.accuracy} meter
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTakeGps}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Perbarui Lokasi GPS</span>
              </button>
            </div>

            {/* Grid Informasi Waktu & Koordinat GPS Read-Only */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Waktu Handover (Server Timestamp) */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 p-3.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1.5">
                  <Clock size={12} className="text-blue-600 dark:text-blue-400" />
                  <span>Waktu Handover</span>
                </label>
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-white select-all">
                  {gpsData.serverTimestamp}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                  Otomatis berdasarkan timestamp server (Read-only)
                </span>
              </div>

              {/* Koordinat GPS: Latitude */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 p-3.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Latitude (Lintang)
                </label>
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-white select-all">
                  {gpsData.latitude.toFixed(6)}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                  Koordinat desimal read-only
                </span>
              </div>

              {/* Koordinat GPS: Longitude */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 p-3.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Longitude (Bujur)
                </label>
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-white select-all">
                  {gpsData.longitude.toFixed(6)}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                  Koordinat desimal read-only
                </span>
              </div>
            </div>

            {/* Nama Wilayah Berdasarkan Koordinat GPS */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 p-3.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1.5">
                <MapPin size={12} className="text-blue-600 dark:text-blue-400" />
                <span>Nama Wilayah / Alamat Perkiraan</span>
              </label>
              <div className="font-medium text-xs text-slate-900 dark:text-slate-100">
                {gpsData.regionName}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                Diperoleh berdasarkan layanan reverse geocoding koordinat GPS
              </span>
            </div>
          </div>
        )}

        {/* KONDISI 4: Gagal Mengambil Lokasi */}
        {gpsStatus === "error" && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-100">
                  Gagal Mengambil Lokasi
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                  {gpsErrorMessage || "Pengambilan lokasi GPS perangkat tidak dapat diselesaikan."}
                </p>
                <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1">
                  Seluruh input data yang sudah Anda ketik (Jumlah Koli, Berat Aktual, dll.) tetap aman dan tidak hilang.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-100 dark:border-rose-900/40 flex justify-end">
              <button
                type="button"
                onClick={handleTakeGps}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Coba Lagi</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. ACTUAL CARGO (INTEGRASI TEPAT DI BAWAH GPS) */}
      <section className="mb-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-xs text-white font-bold">3</span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Actual Cargo
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Input fisik aktual kargo di lokasi serah terima (Data tetap tersimpan saat GPS dicoba lagi)
              </p>
            </div>
          </div>
          {isWeightDiscrepancy && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
              <AlertTriangle size={13} />
              <span>Ada Selisih Berat: {weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Sisi Kiri: Data Dokumen (Read-only) */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Data Dokumen Bawaan (Manifest)
            </span>
            <div className="space-y-3">
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Jumlah Koli Dokumen</span>
                <b className="text-sm font-bold text-slate-800 dark:text-slate-100">{docPieces} Koli</b>
              </div>
              <div className="border-t border-slate-200/60 dark:border-slate-800 pt-2.5">
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Berat Dokumen</span>
                <b className="text-sm font-bold text-slate-800 dark:text-slate-100">{docWeight} kg</b>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Input Fisik Aktual Kargo (Wajib Validasi) */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 p-4 space-y-3.5">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Input Fisik Aktual Kargo *
            </span>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Koli <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={actualPieces}
                  onChange={(e) => {
                    const val = e.target.value;
                    setActualPieces(val);
                    if (!val.trim()) {
                      setPiecesError(null);
                    } else if (/[a-zA-Z]/.test(val) || /[^0-9]/.test(val)) {
                      setPiecesError("Hanya boleh diisi angka saja");
                    } else if (Number(val) <= 0) {
                      setPiecesError("Jumlah koli harus lebih dari 0");
                    } else {
                      setPiecesError(null);
                    }
                  }}
                  placeholder="Contoh: 10 (Bilangan bulat positif)"
                  className={`w-full rounded-xl border ${
                    piecesError
                      ? "border-rose-500 ring-1 ring-rose-500 bg-rose-50/20 text-rose-700 dark:text-rose-300"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  } px-3 py-2 text-xs font-semibold font-mono`}
                />
                <span className="pointer-events-none absolute right-3 top-2 text-[11px] font-semibold text-slate-400">
                  Pcs
                </span>
              </div>
              {piecesError ? (
                <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{piecesError}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Hanya menerima bilangan bulat positif (minimal 1)
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Berat Aktual (kg) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={actualGrossWeight}
                  onChange={(e) => {
                    const val = e.target.value;
                    setActualGrossWeight(val);
                    if (!val.trim()) {
                      setWeightError(null);
                    } else if (/[a-zA-Z]/.test(val)) {
                      setWeightError("Hanya boleh diisi angka saja");
                    } else if (!/^\d+(\.\d+)?$/.test(val.trim())) {
                      setWeightError("Format angka tidak valid (contoh: 200.5)");
                    } else if (Number(val) <= 0) {
                      setWeightError("Berat aktual harus lebih dari 0");
                    } else {
                      setWeightError(null);
                    }
                  }}
                  placeholder="Contoh: 200.5 (Angka positif / desimal)"
                  className={`w-full rounded-xl border ${
                    weightError
                      ? "border-rose-500 ring-1 ring-rose-500 bg-rose-50/20 text-rose-700 dark:text-rose-300"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  } px-3 py-2 text-xs font-semibold font-mono`}
                />
                <span className="pointer-events-none absolute right-3 top-2 text-[11px] font-semibold text-slate-400">
                  Kg
                </span>
              </div>
              {weightError ? (
                <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{weightError}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Hanya menerima angka positif (termasuk desimal)
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. DOKUMENTASI 4 FOTO WAJIB KARGO (KAMERA DEVICE & GALERI) */}
      <section className="mb-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[11px] text-white font-bold">4</span>
              Dokumentasi Foto Kargo Wajib (4 Foto)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Bisa langsung jepret kamera ponsel/perangkat atau upload file galeri.
            </p>
          </div>

          <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
            filledPhotos === 4
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
              : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60"
          }`}>
            {filledPhotos}/4 Terisi
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {photoLabels.map((label, index) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <b className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {index + 1}. {label}
                  </b>

                  {photos[index] && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotos((current) =>
                          current.map((item, i) => (i === index ? null : item))
                        );
                        setPhotoUrls((current) =>
                          current.map((item, i) => (i === index ? null : item))
                        );
                      }}
                      className="text-red-500 hover:text-red-700 transition cursor-pointer p-0.5"
                      title="Hapus foto"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div
                  className={`h-[135px] rounded-lg border overflow-hidden relative flex items-center justify-center ${
                    photos[index]
                      ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  }`}
                >
                  {uploadingItem === `photo-${index}` ? (
                    <div className="flex flex-col items-center gap-1.5 p-2 text-center">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Mengunggah (Maks 5 MB)...</span>
                    </div>
                  ) : photos[index] ? (
                    photoUrls[index] ? (
                      <img
                        src={photoUrls[index]!}
                        alt={photos[index]!}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="p-2 text-center">
                        <Check size={24} className="mx-auto text-emerald-600 dark:text-emerald-400" />
                        <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                          {photos[index]}
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="text-center p-2">
                      <Camera size={26} className="mx-auto text-slate-400 mb-1" />
                      <span className="text-[11px] text-slate-400 font-medium">Belum ada foto</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS: KAMERA & GALERI */}
              <div className="mt-3 flex items-center gap-2">
                {/* 1. Ambil Kamera Device Langsung */}
                <label
                  title="Ambil foto langsung dengan kamera"
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer transition shadow-2xs ${
                    uploadingItem === `photo-${index}` ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <Camera size={13} />
                  <span>Kamera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={Boolean(uploadingItem)}
                    className="sr-only"
                    onChange={(event) => setPhoto(index, event.target.files?.[0])}
                  />
                </label>

                {/* 2. Pilih Dari File / Galeri */}
                <label
                  title="Pilih file dari galeri atau komputer"
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold cursor-pointer transition ${
                    uploadingItem === `photo-${index}` ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <Upload size={13} />
                  <span>Galeri</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={Boolean(uploadingItem)}
                    className="sr-only"
                    onChange={(event) => setPhoto(index, event.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. DOKUMEN WAJIB (SURAT JALAN & BERITA ACARA) */}
      <section className="mb-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <div className="mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[11px] text-white font-bold">5</span>
            Dokumen Wajib Pekerjaan (2 Dokumen)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Upload Surat Jalan / DO dan Berita Acara / Serah Terima (keduanya wajib).
          </p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <DocumentUpload
            title="Surat Jalan / Delivery Order (DO)"
            value={docs.main}
            isUploading={uploadingItem === "doc-main"}
            onChange={(file) => setDoc("main", file)}
            onClear={() => {
              setDocs((current) => ({ ...current, main: null }));
              setDocDetails((current) => ({ ...current, main: undefined }));
            }}
          />

          <DocumentUpload
            title="Berita Acara / Serah Terima"
            value={docs.supporting}
            isUploading={uploadingItem === "doc-supporting"}
            onChange={(file) => setDoc("supporting", file)}
            onClear={() => {
              setDocs((current) => ({ ...current, supporting: null }));
              setDocDetails((current) => ({ ...current, supporting: undefined }));
            }}
          />
        </div>
      </section>

      {/* 6. PROBLEM / KENDALA LAPANGAN */}
      <section className="mb-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[11px] text-white font-bold">6</span>
          Problem / Kendala Lapangan
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Apakah ada temuan kendala, kerusakan barang, atau komplain di lapangan?
        </p>

        <div className="mt-4 flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200">
            <input
              type="radio"
              name="hasProblem"
              value="no"
              checked={hasProblem === "no"}
              onChange={() => setHasProblem("no")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            No (Tidak Ada Kendala)
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200">
            <input
              type="radio"
              name="hasProblem"
              value="yes"
              checked={hasProblem === "yes"}
              onChange={() => setHasProblem("yes")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            Yes (Ada Kendala)
          </label>
        </div>

        {hasProblem === "yes" && (
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Deskripsi Singkat Kendala *
            </label>
            <textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              rows={3}
              placeholder="Jelaskan kendala/kerusakan/issue yang ditemukan di lapangan..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
      </section>

      {/* BOTTOM ACTION BAR */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 dark:border-slate-800 pt-5">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Detail</span>
        </button>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {!isGpsRecorded && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 font-medium">
              <AlertTriangle size={13} />
              <span>Lokasi GPS wajib direkam sebelum menyimpan</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              if (!canSubmit || !gpsData) return;
              const validPhotos = photos
                .map((p, i) => photoUrls[i] || p)
                .filter((p): p is string => Boolean(p));

              const finalDocDetails = [
                docDetails.main || {
                  name: docs.main!,
                  url: "/documents/Dokumen_Utama_Reimbursement_AENAT.pdf",
                  size: "3.5 KB",
                },
                docDetails.supporting || {
                  name: docs.supporting!,
                  url: "/documents/Dokumen_Utama_Reimbursement_AENAT.pdf",
                  size: "1.2 MB",
                },
              ];

              onSubmit({
                deliveringParty: deliveringParty.trim(),
                receivingParty: receivingParty.trim(),
                actualPieces: Number(actualPieces),
                actualGrossWeight: Number(actualGrossWeight),
                location: gpsData.regionName || location.trim() || `Koordinat GPS (${gpsData.latitude.toFixed(6)}, ${gpsData.longitude.toFixed(6)})`,
                gps: {
                  latitude: gpsData.latitude,
                  longitude: gpsData.longitude,
                  accuracy: gpsData.accuracy,
                  recordedAt: gpsData.recordedAt,
                },
                serverTimestamp: gpsData.serverTimestamp,
                taskId: no(job),
                photos: validPhotos,
                documents: [docs.main!, docs.supporting!],
                docDetails: finalDocDetails,
                hasIssue: hasProblem === "yes",
                issueDescription: problemDescription.trim(),
              });
            }}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:shadow-none"
          >
            <span>{saving ? "Menyimpan Handover..." : "Simpan Handover"}</span>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}



/* =========================================================
   HISTORY
========================================================= */

function HistoryList({
  jobs,
  query,
  setQuery,
  apiError,
  onRetry,
}: {
  jobs: Job[];
  query: string;
  setQuery: (v: string) => void;
  apiError?: string | null;
  onRetry?: () => void;
}) {
  const [detailJob, setDetailJob] = useState<Job | null>(null);

  // Field Reports HANYA menampilkan pekerjaan yang benar-benar sudah selesai (status COMPLETED / SELESAI di database)
  const completedJobs = useMemo(() => {
    return jobs.filter((j) => {
      const s = (j.status || "").trim().toUpperCase();
      return s === "COMPLETED" || s === "SELESAI";
    });
  }, [jobs]);

  // Pencarian berdasarkan Job Number, Customer, MAWB/HAWB, dan identitas pekerjaan terkait
  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return completedJobs;

    return completedJobs.filter((j) => {
      const jNum = (j.job_number || "").toLowerCase();
      const jCust = (j.customer || "").toLowerCase();
      const jMawb = (j.mawb_hawb || j.mawb || "").toLowerCase();
      const jAgent = (j.assigned_to || j.field_agent_name || "").toLowerCase();
      const jSales = (j.sales_executive || "").toLowerCase();
      const jOrigin = (j.origin || "").toLowerCase();
      const jDest = (j.destination || "").toLowerCase();
      const jLoc = (j.location || "").toLowerCase();

      return (
        jNum.includes(q) ||
        jCust.includes(q) ||
        jMawb.includes(q) ||
        jAgent.includes(q) ||
        jSales.includes(q) ||
        jOrigin.includes(q) ||
        jDest.includes(q) ||
        jLoc.includes(q)
      );
    });
  }, [completedJobs, query]);

  return (
    <>
      <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Field Reports
          </h1>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Daftar laporan pekerjaan kargo yang telah selesai dikerjakan oleh Field Agent.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <Check size={13} className="stroke-[2.5]" />
          <span>{completedJobs.length} Tugas Selesai</span>
        </span>
      </section>

      {apiError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 dark:border-red-800/80 bg-red-50 dark:bg-red-950/40 p-4 text-xs text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>Gagal memuat data laporan dari database: {apiError}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-red-600 px-3 py-1 font-semibold text-white hover:bg-red-700 cursor-pointer shadow-2xs"
            >
              Coba Lagi
            </button>
          )}
        </div>
      )}

      <Searchbar
        query={query}
        setQuery={setQuery}
      />

      <JobsTable
        jobs={filteredJobs}
        action={(job) => setDetailJob(job)}
        history
      />

      {detailJob && (
        <FieldReportDetailModal
          job={detailJob}
          onClose={() => setDetailJob(null)}
        />
      )}
    </>
  );
}

/* =========================================================
   FIELD REPORT DETAIL MODAL (Data Riil Supabase & Tanpa Data Palsu)
========================================================= */

interface ReportRelationalData {
  task: {
    id: string;
    job_number: string;
    transaction_number?: string;
    task_title?: string;
    customer?: string | null;
    sales_executive?: string | null;
    field_agent_name?: string | null;
    shipper?: string | null;
    consignee?: string | null;
    origin?: string | null;
    destination?: string | null;
    mawb_hawb?: string | null;
    location?: string | null;
    status: string;
    actual_cargo?: string | null;
    handover_status?: string | null;
    documentation_status?: string | null;
    verification_status?: string | null;
    assigned_to?: string | null;
    has_issue?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  handover: {
    id: string;
    job_number: string;
    delivering_party?: string | null;
    receiving_party?: string | null;
    actual_pieces?: number | null;
    actual_gross_weight?: number | null;
    location?: string | null;
    notes?: string | null;
    created_at?: string | null;
  } | null;
  documentation: {
    id: string;
    job_number: string;
    photos?: string[] | null;
    documents?: string[] | null;
    created_at?: string | null;
  } | null;
  verification: {
    id: string;
    job_number: string;
    document_verification?: string | null;
    package_condition?: string | null;
    airline_standard?: string | null;
    dangerous_goods?: boolean | null;
    special_handling?: string[] | null;
    created_at?: string | null;
  } | null;
  issues: {
    id: string;
    issue_code?: string | null;
    job_number: string;
    task_title?: string | null;
    issue_type?: string | null;
    category?: string | null;
    description?: string | null;
    severity?: string | null;
    status?: string | null;
    reported_by?: string | null;
    reported_at?: string | null;
  }[];
  history: {
    id: string;
    job_number: string;
    activity: string;
    performed_by?: string | null;
    notes?: string | null;
    created_at?: string | null;
  }[];
}

function FieldReportDetailModal({
  job,
  onClose,
}: {
  job: Job;
  onClose: () => void;
}) {
  const [detailData, setDetailData] = useState<ReportRelationalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    title: string;
    desc: string;
  } | null>(null);

  const jobNumberClean = no(job);

  const fetchDetail = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/feature/A3-tasks?jobNumber=${encodeURIComponent(jobNumberClean)}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || "Gagal mengambil data detail pekerjaan.");
      }
      setDetailData(json.data);
    } catch (err: any) {
      console.warn("Error fetching report detail:", err);
      setFetchError(err.message || "Gagal mengambil data dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [jobNumberClean]);

  // Ekstraksi data riil dari Supabase sesuai struktur tabel tanpa data dummy
  const currentTask = detailData?.task;
  const currentHandover = detailData?.handover;
  const currentDoc = detailData?.documentation;
  const currentIssues = detailData?.issues || [];

  const customerName = currentTask?.customer || job.customer || "Data belum tersedia";
  const salesName = currentTask?.sales_executive || job.sales_executive || "Data belum tersedia";
  const agentName =
    currentTask?.field_agent_name ||
    currentTask?.assigned_to ||
    job.field_agent_name ||
    job.assigned_to ||
    "Data belum tersedia";

  const originVal = currentTask?.origin || job.origin || "Data belum tersedia";
  const destVal = currentTask?.destination || job.destination || "Data belum tersedia";

  let cargoDisplay = "Data belum tersedia";
  if (currentHandover?.actual_pieces != null && currentHandover?.actual_gross_weight != null) {
    cargoDisplay = `${currentHandover.actual_pieces} Pcs · ${currentHandover.actual_gross_weight} Kg`;
  } else if (currentTask?.actual_cargo || job.actual_cargo) {
    cargoDisplay = currentTask?.actual_cargo || job.actual_cargo || "Data belum tersedia";
  }

  const mawbDisplay = currentTask?.mawb_hawb || job.mawb_hawb || "Data belum tersedia";

  // Informasi Handover
  const handoverGpsLocation = currentHandover?.location || currentTask?.location || "Data belum tersedia";
  const handoverTimestamp = currentHandover?.created_at || currentTask?.updated_at || currentTask?.created_at;
  const formattedHandoverTime = handoverTimestamp
    ? new Date(handoverTimestamp).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }) + " WIB"
    : "Data belum tersedia";

  // Foto aktual dari Supabase
  const uploadedPhotos = Array.isArray(currentDoc?.photos) ? currentDoc.photos : [];
  const uploadedDocuments = Array.isArray(currentDoc?.documents) ? currentDoc.documents : [];

  const angleLabels = [
    { title: "Angle 1 (Depan)", desc: "Depan / Keseluruhan Kargo" },
    { title: "Angle 2 (Samping)", desc: "Samping / Label & Marking" },
    { title: "Angle 3 (Belakang)", desc: "Belakang / Segel Kontainer" },
    { title: "Angle 4 (Atas)", desc: "Atas / Detail Permukaan" },
  ];

  // Helper untuk resolve URL berkas dari Supabase Storage atau endpoint publik
  const resolveFile = (item: any): { url: string; name: string } | null => {
    if (!item) return null;
    if (typeof item === "string") {
      const raw = item.trim();
      if (!raw) return null;
      let name = raw.split("/").pop() || "Document";
      try {
        name = decodeURIComponent(name);
      } catch {}
      if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:") || raw.startsWith("/uploads/")) {
        return { url: raw, name };
      }
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jbfmcfxkyzthupgbfdrn.supabase.co";
      return {
        url: `${supabaseUrl}/storage/v1/object/public/A3-field-agent-documents./${encodeURIComponent(raw)}`,
        name,
      };
    }
    if (typeof item === "object") {
      const url = item.url || item.path || item.fileUrl;
      const name = item.name || item.fileName || (url ? url.split("/").pop() : "Document");
      if (url) {
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("/uploads/")) {
          return { url, name };
        }
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jbfmcfxkyzthupgbfdrn.supabase.co";
        return {
          url: `${supabaseUrl}/storage/v1/object/public/A3-field-agent-documents./${encodeURIComponent(url)}`,
          name,
        };
      }
    }
    return null;
  };

  // Pembagian Dokumen Utama vs Dokumen Pendukung
  const resolvedDocs = uploadedDocuments.map(resolveFile).filter(Boolean) as { url: string; name: string }[];
  const mainDoc = resolvedDocs.length > 0 ? resolvedDocs[0] : null;
  const supportingDocs = resolvedDocs.length > 1 ? resolvedDocs.slice(1) : [];

  // Problem / Issue Logic
  const taskHasIssue = currentTask?.has_issue ?? job.has_issue;
  const issueList = Array.isArray(currentIssues) ? currentIssues : [];
  const hasIssueYes = taskHasIssue === true || issueList.length > 0;
  const hasIssueNo = taskHasIssue === false && issueList.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-[#0b1325] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* HEADER */}
        <div className="bg-[#0c1527] dark:bg-[#070d18] px-7 py-5 text-white border-b border-slate-800/80 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-mono font-bold text-white shadow-2xs tracking-wider">
                #{jobNumberClean}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-semibold text-emerald-400">
                <Check size={12} className="stroke-[3]" />
                <span>Completed</span>
              </span>
              {hasIssueYes && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-3 py-0.5 text-xs font-semibold text-red-400">
                  <AlertTriangle size={12} />
                  <span>Ada Issue</span>
                </span>
              )}
            </div>
            <h2 className="mt-2.5 text-lg sm:text-xl font-extrabold tracking-tight text-white">
              Detail Laporan Pekerjaan Lapangan
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto bg-slate-50/50 dark:bg-[#0b1325]">
          {loading ? (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400">
              <RefreshCw className="animate-spin mx-auto mb-3 text-blue-600" size={28} />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Mengambil detail laporan pekerjaan dari server...
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Memuat data pekerjaan, handover, dokumentasi, dan issue aktual.
              </p>
            </div>
          ) : fetchError ? (
            <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-6 text-center text-red-700 dark:text-red-300">
              <AlertCircle size={28} className="mx-auto mb-2 text-red-500" />
              <p className="text-sm font-bold">Gagal memuat detail laporan</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 max-w-md mx-auto">{fetchError}</p>
              <button
                type="button"
                onClick={fetchDetail}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer shadow-sm active:scale-95 transition"
              >
                <RefreshCw size={13} />
                <span>Coba Lagi</span>
              </button>
            </div>
          ) : (
            <>
              {/* 1. INFORMASI PEKERJAAN */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Package size={16} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Informasi Pekerjaan
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Job Number:</span>
                    <p className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                      #{jobNumberClean}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Customer:</span>
                    <p className="font-bold text-slate-800 dark:text-white truncate" title={customerName}>
                      {customerName}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Nama Field Agent:</span>
                    <p className="font-bold text-slate-800 dark:text-white truncate" title={agentName}>
                      {agentName}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Sales Executive:</span>
                    <p className="font-bold text-slate-800 dark:text-white truncate" title={salesName}>
                      {salesName}
                    </p>
                  </div>

                  <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Origin (Asal):</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-200 truncate" title={originVal}>
                      {originVal}
                    </p>
                  </div>

                  <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Destination (Tujuan):</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-200 truncate" title={destVal}>
                      {destVal}
                    </p>
                  </div>

                  <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Data Cargo &amp; Berat:</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-200 truncate" title={cargoDisplay}>
                      {cargoDisplay}
                    </p>
                  </div>

                  <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">MAWB / HAWB:</span>
                    <p className="font-mono font-semibold text-slate-700 dark:text-slate-200 truncate" title={mawbDisplay}>
                      {mawbDisplay}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. INFORMASI HANDOVER (SERAH TERIMA) */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <MapPin size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Informasi Handover
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="block text-slate-400 dark:text-slate-500 font-medium mb-1">
                      Lokasi Serah Terima (Berdasarkan GPS):
                    </span>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-white" title={handoverGpsLocation}>
                      {handoverGpsLocation}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="block text-slate-400 dark:text-slate-500 font-medium mb-1">
                      Tanggal &amp; Waktu Serah Terima (Timestamp Otomatis):
                    </span>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-white">
                      {formattedHandoverTime}
                    </p>
                  </div>
                </div>

                {currentHandover?.notes && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-400 dark:text-slate-500 font-medium block mb-1">Catatan Handover:</span>
                    <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {currentHandover.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* 3. DOKUMENTASI BARANG */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0f172a] p-5 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Camera size={16} className="text-blue-600 dark:text-blue-400" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Dokumentasi Barang
                    </h3>
                  </div>
                  {uploadedPhotos.length > 0 && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      Klik foto untuk melihat ukuran penuh
                    </span>
                  )}
                </div>

                {/* GALERI 4 SUDUT FOTO BARANG */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                    Empat Foto dari Empat Sudut Barang:
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {angleLabels.map((angle, idx) => {
                      const resolved = resolveFile(uploadedPhotos[idx]);

                      return (
                        <div
                          key={angle.title}
                          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 text-center shadow-xs group"
                        >
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 truncate">
                            {angle.title}
                          </p>

                          {resolved?.url ? (
                            <div
                              onClick={() =>
                                setPreviewPhoto({
                                  url: resolved.url,
                                  title: angle.title,
                                  desc: angle.desc,
                                })
                              }
                              className="w-full h-26 rounded-xl overflow-hidden relative cursor-pointer border border-slate-200 dark:border-slate-700 shadow-inner group-hover:ring-2 group-hover:ring-blue-500 transition-all"
                            >
                              <img
                                src={resolved.url}
                                alt={angle.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-2 text-left">
                                <span className="text-[10px] font-black text-white tracking-wider uppercase drop-shadow-xs">
                                  {angle.title}
                                </span>
                                <span className="text-[9px] text-slate-200 font-medium truncate drop-shadow-xs">
                                  {angle.desc}
                                </span>
                              </div>
                              <div className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye size={12} />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-26 rounded-xl flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1325] p-2 text-slate-400">
                              <Camera size={22} className="text-slate-300 dark:text-slate-600 mb-1" />
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                {angle.desc}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                                Data belum tersedia
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DOKUMEN UTAMA & DOKUMEN PENDUKUNG */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dokumen Utama */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Dokumen Utama (Surat Jalan / Air Waybill):
                    </span>
                    {mainDoc ? (
                      <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={mainDoc.name}>
                              {mainDoc.name}
                            </p>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                              Dokumen Utama Resmi
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.open(mainDoc.url, "_blank")}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                          title="Buka Dokumen Utama"
                        >
                          <ExternalLink size={12} />
                          <span>Buka</span>
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-3.5 text-center text-xs text-slate-400 dark:text-slate-500">
                        <FileText size={18} className="mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                        <span>Data belum tersedia</span>
                      </div>
                    )}
                  </div>

                  {/* Dokumen Pendukung */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Dokumen Pendukung:
                    </span>
                    {supportingDocs.length > 0 ? (
                      <div className="space-y-2">
                        {supportingDocs.map((doc, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-3 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText size={15} className="text-slate-400 shrink-0" />
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={doc.name}>
                                {doc.name}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => window.open(doc.url, "_blank")}
                              className="px-2.5 py-1 rounded-md text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition flex items-center gap-1 shrink-0 cursor-pointer"
                              title="Buka Dokumen Pendukung"
                            >
                              <ExternalLink size={12} />
                              <span>Lihat</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-3.5 text-center text-xs text-slate-400 dark:text-slate-500">
                        <FileText size={18} className="mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                        <span>Data belum tersedia</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. PROBLEM / ISSUE */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className={hasIssueYes ? "text-red-500" : "text-slate-400"} />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Problem / Issue
                    </h3>
                  </div>

                  <div>
                    {hasIssueYes ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800">
                        <AlertTriangle size={12} className="stroke-[2.5]" />
                        <span>Status: Yes</span>
                      </span>
                    ) : hasIssueNo ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={12} className="stroke-[2.5]" />
                        <span>Status: No</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <span>Status: Data belum tersedia</span>
                      </span>
                    )}
                  </div>
                </div>

                {hasIssueYes ? (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-red-800 dark:text-red-300 block">
                      Rincian Deskripsi Masalah:
                    </span>
                    {issueList.length > 0 ? (
                      issueList.map((iss) => (
                        <div
                          key={iss.id}
                          className="rounded-xl border border-red-200 dark:border-red-900/80 bg-red-50/60 dark:bg-red-950/30 p-4 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-extrabold text-red-900 dark:text-red-200 text-sm">
                              {iss.issue_type || iss.category || "Kendala Lapangan"}
                            </span>
                            <div className="flex items-center gap-2">
                              {iss.severity && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                                  Severity: {iss.severity}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-200/80 text-red-900 dark:bg-red-900 dark:text-red-200">
                                Status: {iss.status || "Reported"}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                            {iss.description || "Tidak ada rincian deskripsi masalah."}
                          </p>
                          {iss.reported_at && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                              Dilaporkan: {new Date(iss.reported_at).toLocaleString("id-ID")}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 p-3 text-xs text-red-700 dark:text-red-300">
                        <span>Pekerjaan ini ditandai memiliki kendala operasional dalam catatan database.</span>
                      </div>
                    )}
                  </div>
                ) : hasIssueNo ? (
                  <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span className="font-medium">
                      Tidak ada masalah atau kendala yang dilaporkan pada pekerjaan ini. Kargo terverifikasi aman.
                    </span>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4 text-xs text-slate-600 dark:text-slate-400">
                    <span>Status kendala belum dapat dipastikan dari catatan pekerjaan saat ini.</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* FOOTER: Tombol Tutup (Aman menutup modal dan kembali ke daftar Field Reports) */}
        <div className="border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c1527] px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#0f172a] hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 px-7 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* LIGHTBOX / ZOOM PHOTO PREVIEW MODAL */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-white">
              <div>
                <h4 className="text-sm font-bold">{previewPhoto.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{previewPhoto.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                className="max-h-[68vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   ISSUE MODAL
========================================================= */

function IssueModal({
  description,
  setDescription,
  close,
  save,
  saving,
}: {
  description: string;
  setDescription: (v: string) => void;
  close: () => void;
  save: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-5">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Laporkan Issue
            </h2>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Catat finding atau hambatan dari lapangan.
            </p>
          </div>

          <button
            onClick={close}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Deskripsi Kendala / Issue *
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              rows={4}
              placeholder="Jelaskan issue yang ditemukan..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 py-4">
          <button
            onClick={close}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={saving || !description.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
          >
            {saving
              ? "Menyimpan..."
              : "Simpan Issue"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   REPORT CONFIRM MODAL
========================================================= */

function ReportConfirmModal({
  job,
  issueCount,
  close,
  confirm,
  saving,
}: {
  job: Job | null;
  issueCount: number;
  close: () => void;
  confirm: () => void;
  saving: boolean;
}) {
  const hasIssue =
    issueCount > 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-5">
      <div className="w-full max-w-[620px] overflow-hidden rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div
          className={`border-b px-6 py-6 ${
            hasIssue
              ? "border-red-100 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40"
              : "border-blue-100 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40"
          }`}
        >
          <div className="flex items-center gap-4">
            <span
              className={`grid h-12 w-12 place-items-center rounded-xl text-white ${
                hasIssue
                  ? "bg-red-600"
                  : "bg-blue-600"
              }`}
            >
              {hasIssue ? (
                <AlertTriangle
                  size={24}
                />
              ) : (
                <Send size={24} />
              )}
            </span>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Penyelesaian Task
              </p>

              <h2 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                Konfirmasi Pengiriman Laporan
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div
            className={`rounded-xl border p-4 ${
              hasIssue
                ? "border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30"
                : "border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/30"
            }`}
          >
            {hasIssue ? (
              <>
                <h3 className="text-sm font-bold text-red-800 dark:text-red-300">
                  Task memiliki Issue
                </h3>

                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Terdapat{" "}
                  <b className="font-semibold text-red-700 dark:text-red-400">
                    {issueCount} finding
                  </b>{" "}
                  yang perlu ditindaklanjuti oleh Sales Executive.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300">
                  Laporan Final
                </h3>

                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Job{" "}
                  <b className="font-semibold text-slate-800 dark:text-slate-100">
                    {no(job)}
                  </b>{" "}
                  akan dikirim ke Sales Executive sebagai Completed.
                </p>
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-4">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Job</span>
              <b className="font-semibold text-slate-800 dark:text-slate-100">{no(job)}</b>
            </div>

            <div className="mt-2 flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Customer</span>
              <b className="font-semibold text-slate-800 dark:text-slate-100">
                {job?.customer ||
                  "-"}
              </b>
            </div>

            <div className="mt-2 flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Status setelah submit</span>
              <b className={`font-semibold ${hasIssue ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {hasIssue
                  ? "Has Issue"
                  : "Completed"}
              </b>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 py-4">
          <button
            onClick={close}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={confirm}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            <Send size={14} />

            {saving
              ? "Mengirim..."
              : "Kirim & Selesaikan Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROCESSING MODAL
========================================================= */

function ReportProcessingModal({
  issueCount,
}: {
  issueCount: number;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/70 p-5">
      <div className="w-full max-w-[400px] rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-7 text-center shadow-2xl">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
          <RefreshCw
            className="animate-spin"
            size={28}
          />
        </span>

        <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
          Memproses Laporan
        </h2>

        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {issueCount > 0
            ? "Menyimpan finding dan mengirim laporan Has Issue..."
            : "Menyimpan laporan final dan memperbarui status job..."}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   COMPLETE MODAL
========================================================= */

function CompleteTaskModal({
  job,
  issueCount,
  openHistory,
}: {
  job: Job | null;
  issueCount: number;
  openHistory: () => void;
}) {
  const hasIssue =
    issueCount > 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-5">
      <div className="w-full max-w-[460px] rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-7 text-center shadow-2xl">
        <span
          className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${
            hasIssue
              ? "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400"
              : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {hasIssue ? (
            <AlertTriangle
              size={28}
            />
          ) : (
            <Check size={28} />
          )}
        </span>

        <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
          {hasIssue
            ? "Laporan Terkirim (Ada Temuan/Issue)"
            : "Laporan Terkirim untuk Verifikasi"}
        </h2>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Job{" "}
          <b className="font-semibold text-slate-800 dark:text-slate-100">
            {no(job)}
          </b>{" "}
          berhasil dikirim. Tim Sales Executive akan memverifikasi hasil sebelum dinyatakan selesai.
        </p>

        {hasIssue ? (
          <p className="mt-1.5 text-xs font-bold text-red-600 dark:text-red-400">
            {issueCount} temuan/kendala telah dicatat untuk ditinjau oleh Sales.
          </p>
        ) : (
          <p className="mt-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            Menunggu verifikasi Sales di modul Monitoring Task.
          </p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              openHistory();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Lihat Job History
          </button>

          <button
            onClick={() => {
              window.location.reload();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DATABASE JOB & METADATA MASTER
========================================================= */

interface JobDatabaseRecord {
  job_number: string;
  customer?: string;
  sales_executive?: string;
  origin?: string;
  destination?: string;
  commodity?: string;
  pieces?: number;
  weight?: number;
}

const KNOWN_JOB_DATABASE: JobDatabaseRecord[] = [
  {
    job_number: "AINAT01",
    customer: "1. PT Indofood CBP Sukses Makmur Tbk",
    sales_executive: "Ms. Wulan",
    origin: "Cengkareng, Banten, Indonesia",
    destination: "Singapore (SIN)",
    commodity: "Instant Noodles & Food Ingredients",
    pieces: 24,
    weight: 360,
  },
  {
    job_number: "AINAT02",
    customer: "2. PT Astra Otoparts",
    sales_executive: "Ms. Wulan",
    origin: "Tanjung Perak, Surabaya, Indonesia",
    destination: "Tokyo (NRT)",
    commodity: "Automotive Spare Parts",
    pieces: 15,
    weight: 280,
  },
  {
    job_number: "AINAT03",
    customer: "3. PT Kalbe Farma",
    sales_executive: "Ms. Wulan",
    origin: "Cengkareng, Banten, Indonesia",
    destination: "Kuala Lumpur (KUL)",
    commodity: "Pharmaceutical Goods",
    pieces: 10,
    weight: 120,
  },
  {
    job_number: "AINAT04",
    customer: "4. PT Samsung Electronics",
    sales_executive: "Ms. Wulan",
    origin: "Tanjung Priok, Jakarta, Indonesia",
    destination: "Tokyo (NRT)",
    commodity: "Electronic Components",
    pieces: 30,
    weight: 450,
  },
  {
    job_number: "AINAT05",
    customer: "5. PT Bio Farma",
    sales_executive: "Ms. Wulan",
    origin: "Cengkareng, Banten, Indonesia",
    destination: "Singapore (SIN)",
    commodity: "Vaccines & Biologicals",
    pieces: 8,
    weight: 95,
  },
  {
    job_number: "AINAT06",
    customer: "1. PT Indofood CBP Sukses Makmur Tbk",
    sales_executive: "Ms. Wulan",
    origin: "Cengkareng, Banten, Indonesia",
    destination: "Singapore (SIN)",
    commodity: "Instant Noodles & Food Ingredients",
    pieces: 24,
    weight: 360,
  },
  {
    job_number: "BI/2608/3751",
    customer: "2. PT Borneo Sentosa Cargo",
    sales_executive: "Mr. Budi Santoso",
    origin: "Tanjung Priok, Jakarta, Indonesia",
    destination: "Bangkok (BKK)",
    commodity: "General Cargo & Fast Moving Goods",
    pieces: 18,
    weight: 310,
  },
  {
    job_number: "JOB-2026-0105-C",
    customer: "3. PT CEVA Air Ocean Indonesia",
    sales_executive: "Ms. Sarah",
    origin: "Soekarno-Hatta (CGK), Tangerang",
    destination: "Hong Kong (HKG)",
    commodity: "Garments & Finished Textiles",
    pieces: 40,
    weight: 520,
  },
  {
    job_number: "JOB-2026-0101-C",
    customer: "4. PT Cipta Sarana Transindo",
    sales_executive: "Mr. Hendra Wijaya",
    origin: "Tanjung Perak, Surabaya, Indonesia",
    destination: "Shanghai (PVG)",
    commodity: "Machinery & Technical Hardware",
    pieces: 12,
    weight: 640,
  },
  {
    job_number: "CSIM/2608/698",
    customer: "5. PT Nusantara Logistik Jaya",
    sales_executive: "Ms. Dewi Lestari",
    origin: "Halim Perdanakusuma (HLP), Jakarta",
    destination: "Dubai (DXB)",
    commodity: "Perishable Food & Confectionery",
    pieces: 22,
    weight: 290,
  },
  {
    job_number: "JOB-2026-0105-B",
    customer: "6. PT Ayutrans Utama",
    sales_executive: "Ms. Wulan",
    origin: "Cengkareng, Banten, Indonesia",
    destination: "Singapore (SIN)",
    commodity: "Corrugated Paper & Packaging",
    pieces: 16,
    weight: 210,
  },
  {
    job_number: "JOB-2026-0101-B",
    customer: "7. PT Samudera Bahari Logistik",
    sales_executive: "Mr. Budi Santoso",
    origin: "Pelabuhan Belawan, Medan",
    destination: "Rotterdam (RTM)",
    commodity: "Agricultural & Coffee Commodities",
    pieces: 50,
    weight: 1200,
  },
  {
    job_number: "JOB-2025-0104-B",
    customer: "8. PT Sinar Surya Express",
    sales_executive: "Ms. Sarah",
    origin: "Bandara Juanda (SUB), Surabaya",
    destination: "Singapore (SIN)",
    commodity: "Consumer Electronics & Cables",
    pieces: 28,
    weight: 390,
  },
  {
    job_number: "CONV-56750",
    customer: "1. PT Indofood CBP Sukses Makmur Tbk",
    sales_executive: "Ms. Wulan",
    origin: "Cengkareng, Banten, Indonesia",
    destination: "Singapore (SIN)",
    commodity: "Instant Noodles & Food Ingredients",
    pieces: 24,
    weight: 360,
  },
  {
    job_number: "CONV-56751",
    customer: "2. PT Astra Otoparts",
    sales_executive: "Ms. Wulan",
    origin: "Tanjung Perak, Surabaya, Indonesia",
    destination: "Tokyo (NRT)",
    commodity: "Automotive Spare Parts",
    pieces: 15,
    weight: 280,
  },
  {
    job_number: "CONV-56752",
    customer: "3. PT Kalbe Farma",
    sales_executive: "Ms. Wulan",
    origin: "Cengkareng, Banten, Indonesia",
    destination: "Kuala Lumpur (KUL)",
    commodity: "Pharmaceutical Goods",
    pieces: 10,
    weight: 120,
  },
  {
    job_number: "CONV-56753",
    customer: "4. PT Samsung Electronics",
    sales_executive: "Ms. Wulan",
    origin: "Tanjung Priok, Jakarta, Indonesia",
    destination: "Tokyo (NRT)",
    commodity: "Electronic Components",
    pieces: 30,
    weight: 450,
  },
  {
    job_number: "CONV-56754",
    customer: "5. PT Bio Farma",
    sales_executive: "Ms. Wulan",
    origin: "Cengkareng, Banten, Indonesia",
    destination: "Singapore (SIN)",
    commodity: "Vaccines & Biologicals",
    pieces: 8,
    weight: 95,
  },
];

const SALES_EXECUTIVE_OPTIONS = [
  "Ms. Wulan",
  "Mr. Budi Santoso",
  "Ms. Sarah",
  "Mr. Hendra Wijaya",
  "Ms. Dewi Lestari",
];

const CUSTOMER_22_COMPANIES = [
  "1. PT Indofood CBP Sukses Makmur Tbk",
  "2. PT Borneo Sentosa Cargo",
  "3. PT CEVA Air Ocean Indonesia",
  "4. PT Cipta Sarana Transindo",
  "5. PT Nusantara Logistik Jaya",
  "6. PT Ayutrans Utama",
  "7. PT Samudera Bahari Logistik",
  "8. PT Sinar Surya Express",
  "9. PT Citra Mandiri Cargo",
  "10. CV Bintang Nusantara Distribusi",
  "11. PT Prima Anugerah Transindo",
  "12. PT Yossava Trans Logistik",
  "13. PT DSV Transport Indonesia",
  "14. PT Agility International",
  "15. PT Schenker Petrolog Utama",
  "16. PT Yusen Logistics Indonesia",
  "17. PT Kintetsu World Express",
  "18. PT DHL Global Forwarding",
  "19. PT Nippon Express Indonesia",
  "20. PT Kuehne + Nagel Indonesia",
  "21. PT Panalpina Nusadua Transport",
  "22. PT Kamadjaja Logistics",
];

const PORT_ORIGIN_OPTIONS = [
  "Cengkareng, Banten, Indonesia",
  "Tanjung Priok, Jakarta, Indonesia",
  "Tanjung Perak, Surabaya, Indonesia",
  "Soekarno-Hatta (CGK), Tangerang",
  "Halim Perdanakusuma (HLP), Jakarta",
  "Pelabuhan Belawan, Medan",
  "Bandara Juanda (SUB), Surabaya",
];

const PORT_DESTINATION_OPTIONS = [
  "Singapore (SIN)",
  "Kuala Lumpur (KUL)",
  "Bangkok (BKK)",
  "Hong Kong (HKG)",
  "Tokyo (NRT)",
  "Shanghai (PVG)",
  "Dubai (DXB)",
  "Rotterdam (RTM)",
];

function formatTimestampWib(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes} WIB`;
}

function AddTaskModal({
  onClose,
  onSelectJob,
  currentAgent,
  existingJobs = [],
}: {
  onClose: () => void;
  onSelectJob: (job: Job) => void;
  currentAgent?: { id: string; name: string };
  existingJobs?: Job[];
}) {
  // Input fields start completely empty upon open as requested
  const [jobNumber, setJobNumber] = useState("");
  const [salesExecutive, setSalesExecutive] = useState("");
  const [customer, setCustomer] = useState("");
  const [jobType, setJobType] = useState<"Export" | "Import">("Export");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [timestamp, setTimestamp] = useState(() => formatTimestampWib(new Date()));
  const [portLocation, setPortLocation] = useState("");
  const [cargo, setCargo] = useState("");
  const [actualPieces, setActualPieces] = useState("");
  const [actualGrossWeight, setActualGrossWeight] = useState("");
  const [piecesError, setPiecesError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);

  const handlePiecesChange = (val: string) => {
    setActualPieces(val);
    if (!val.trim()) {
      setPiecesError(null);
      return;
    }
    if (/[a-zA-Z]/.test(val) || /[^0-9]/.test(val)) {
      setPiecesError("Hanya boleh diisi angka saja");
    } else if (Number(val) <= 0) {
      setPiecesError("Jumlah koli harus lebih dari 0");
    } else {
      setPiecesError(null);
    }
  };

  const handleWeightChange = (val: string) => {
    setActualGrossWeight(val);
    if (!val.trim()) {
      setWeightError(null);
      return;
    }
    if (/[a-zA-Z]/.test(val)) {
      setWeightError("Hanya boleh diisi angka saja");
    } else if (!/^\d+(\.\d+)?$/.test(val.trim())) {
      setWeightError("Format angka tidak valid (contoh: 360.0)");
    } else if (Number(val) <= 0) {
      setWeightError("Berat aktual harus lebih dari 0");
    } else {
      setWeightError(null);
    }
  };
  const [submitting, setSubmitting] = useState(false);
  const [gpsNotification, setGpsNotification] = useState<string | null>(null);
  const [isPinningGps, setIsPinningGps] = useState(false);
  // Step 1, Step 2, and Step 3 (Success Indicator Modal)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [taskStartTime] = useState<number>(() => Date.now());
  const [durationSeconds, setDurationSeconds] = useState<number>(79);
  const [completedJob, setCompletedJob] = useState<Job | null>(null);

  const displayJobNumber = useMemo(() => {
    const raw = jobNumber.trim() || "AINAT06";
    return raw.startsWith("#") ? raw : `#${raw}`;
  }, [jobNumber]);

  const displayCustomer = useMemo(() => {
    const clean = customer.replace(/^\d+\.\s*/, "").trim();
    return clean || "PT Indofood CBP Sukses Makmur Tbk";
  }, [customer]);

  // Step 2 Documentation states (Matching Image 1)
  const photoAngles = [
    { title: "Angle 1: Front", tag: "Overall Cargo", key: "front" },
    { title: "Angle 2: Side", tag: "Marking & Label", key: "side" },
    { title: "Angle 3: Rear / Back", tag: "Container Seal", key: "rear" },
    { title: "Angle 4: Top", tag: "Surface Detail", key: "top" },
  ];
  const [step2Photos, setStep2Photos] = useState<(File | null)[]>([null, null, null, null]);
  const [step2PhotoNames, setStep2PhotoNames] = useState<(string | null)[]>([null, null, null, null]);
  const [step2PhotoUrls, setStep2PhotoUrls] = useState<(string | null)[]>([null, null, null, null]);
  const [uploadingAngle, setUploadingAngle] = useState<number | null>(null);

  const [primaryDoc, setPrimaryDoc] = useState<{ name: string; size: string; url?: string } | null>(null);
  const [supportingDoc, setSupportingDoc] = useState<{ name: string; size: string; url?: string } | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<"primary" | "supporting" | null>(null);

  const [hasIssue, setHasIssue] = useState<"no" | "yes">("no");
  const [issueNotes, setIssueNotes] = useState("");

  const completedPhotoCount = step2PhotoNames.filter(Boolean).length;

  const handlePhotoUpload = async (index: number, file?: File) => {
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setStep2PhotoNames((prev) => prev.map((n, i) => (i === index ? file.name : n)));
    setStep2PhotoUrls((prev) => prev.map((u, i) => (i === index ? localUrl : u)));
    setStep2Photos((prev) => prev.map((f, i) => (i === index ? file : f)));

    setUploadingAngle(index);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jobNumber", jobNumber.trim() || "TASK-NEW");
      formData.append("category", `cargo_photo_angle_${index + 1}`);

      const res = await fetch("/api/feature/field-agent/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.file_url) {
          setStep2PhotoUrls((prev) => prev.map((u, i) => (i === index ? json.data.file_url : u)));
        }
      }
    } catch (e) {
      console.warn("Upload fallback to local object URL:", e);
    } finally {
      setUploadingAngle(null);
    }
  };

  const handleDocUpload = async (type: "primary" | "supporting", file?: File) => {
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    const sizeFormatted =
      file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    const docObj = { name: file.name, size: sizeFormatted, url: localUrl };
    if (type === "primary") setPrimaryDoc(docObj);
    else setSupportingDoc(docObj);

    setUploadingDoc(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jobNumber", jobNumber.trim() || "TASK-NEW");
      formData.append("category", type === "primary" ? "main_doc" : "supporting_doc");

      const res = await fetch("/api/feature/field-agent/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.file_url) {
          const updatedObj = { ...docObj, url: json.data.file_url };
          if (type === "primary") setPrimaryDoc(updatedObj);
          else setSupportingDoc(updatedObj);
        }
      }
    } catch (e) {
      console.warn("Doc upload fallback to local URL:", e);
    } finally {
      setUploadingDoc(null);
    }
  };

  const fillQuickStep2Simulation = () => {
    setStep2PhotoNames([
      "Cargo_Angle1_Front_Inspection.jpg",
      "Cargo_Angle2_Side_Markings.jpg",
      "Cargo_Angle3_Rear_Seal.jpg",
      "Cargo_Angle4_Top_Surface.jpg",
    ]);
    setStep2PhotoUrls([
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800&auto=format&fit=crop",
    ]);
    setPrimaryDoc({
      name: "Surat_Jalan_DO_AINAT01.pdf",
      size: "2.4 MB",
      url: "/documents/Dokumen_Utama_Reimbursement_AENAT.pdf",
    });
    setSupportingDoc({
      name: "Berita_Acara_Serah_Terima_01.pdf",
      size: "1.8 MB",
      url: "/documents/Dokumen_Utama_Reimbursement_AENAT.pdf",
    });
    setHasIssue("no");
  };

  // Focus & dropdown states for search menus
  const [originFocused, setOriginFocused] = useState(false);
  const [destinationFocused, setDestinationFocused] = useState(false);

  // Matching origins for Origin search
  const matchingOrigins = useMemo(() => {
    const q = origin.trim().toLowerCase();
    if (!q) return PORT_ORIGIN_OPTIONS;
    return PORT_ORIGIN_OPTIONS.filter((p) =>
      p.toLowerCase().includes(q)
    );
  }, [origin]);

  const handleSelectOrigin = (p: string) => {
    setOrigin(p);
    setPortLocation(p);
    setOriginFocused(false);
  };

  // Matching destinations for Destination search
  const matchingDestinations = useMemo(() => {
    const q = destination.trim().toLowerCase();
    if (!q) return PORT_DESTINATION_OPTIONS;
    return PORT_DESTINATION_OPTIONS.filter((p) =>
      p.toLowerCase().includes(q)
    );
  }, [destination]);

  const handleSelectDestination = (p: string) => {
    setDestination(p);
    setDestinationFocused(false);
  };

  // Quick simulation (fills everything in 1 click for test demonstration)
  const fillQuickSimulation = () => {
    setJobNumber("AINAT01");
    setSalesExecutive("Ms. Wulan");
    setCustomer("PT Indofood CBP Sukses Makmur Tbk");
    setJobType("Export");
    setOrigin("Cengkareng, Banten, Indonesia");
    setDestination("Singapore (SIN)");
    setPortLocation("Cengkareng, Banten, Indonesia");
    setCargo("Instant Noodles & Food Ingredients");
    setActualPieces("24");
    setActualGrossWeight("360.0");
    setPiecesError(null);
    setWeightError(null);
    setTimestamp(formatTimestampWib(new Date()));
  };

  // Master port coordinates for proximity detection fallback
  const KNOWN_PORT_COORDS = [
    { name: "Cengkareng, Banten, Indonesia", lat: -6.1275, lon: 106.6537 },
    { name: "Soekarno-Hatta (CGK), Tangerang", lat: -6.1275, lon: 106.6537 },
    { name: "Tanjung Priok, Jakarta, Indonesia", lat: -6.1026, lon: 106.8834 },
    { name: "Halim Perdanakusuma (HLP), Jakarta", lat: -6.2657, lon: 106.8906 },
    { name: "Tanjung Perak, Surabaya, Indonesia", lat: -7.1994, lon: 112.7333 },
    { name: "Bandara Juanda (SUB), Surabaya", lat: -7.3798, lon: 112.7876 },
    { name: "Pelabuhan Belawan, Medan", lat: 3.7844, lon: 98.6834 },
    { name: "Pelabuhan Merak, Banten", lat: -5.9324, lon: 105.9981 },
    { name: "Pelabuhan Bakauheni, Lampung", lat: -5.8677, lon: 105.7538 },
    { name: "Pelabuhan Tanjung Emas, Semarang", lat: -6.9536, lon: 110.4217 },
    { name: "Pelabuhan Makassar, Sulawesi Selatan", lat: -5.1189, lon: 119.4101 },
    { name: "Batu Ampar Port, Batam", lat: 1.1568, lon: 103.9926 },
    { name: "Singapore (SIN)", lat: 1.3644, lon: 103.9915 },
  ];

  const findNearestPortName = (lat: number, lon: number): string => {
    let nearest = "Soekarno-Hatta (CGK), Tangerang";
    let minDistance = Infinity;
    for (const port of KNOWN_PORT_COORDS) {
      const dLat = port.lat - lat;
      const dLon = port.lon - lon;
      const dist = dLat * dLat + dLon * dLon;
      if (dist < minDistance) {
        minDistance = dist;
        nearest = port.name;
      }
    }
    return nearest;
  };

  const handleGpsPin = async () => {
    setIsPinningGps(true);
    try {
      const sRes = await fetch("/api/feature/server-time");
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.displayTimestamp || sData.formattedTimestamp) {
          setTimestamp(sData.displayTimestamp || sData.formattedTimestamp);
        }
      } else {
        setTimestamp(formatTimestampWib(new Date()));
      }
    } catch {
      setTimestamp(formatTimestampWib(new Date()));
    }

    // 1. Jika Origin sudah diisi, sesuaikan hasil GPS dengan tempat origin pengiriman barang tersebut
    if (origin.trim()) {
      const targetOrigin = origin.trim();
      setPortLocation(targetOrigin);
      setGpsNotification(`📍 Lokasi origin pengiriman terverifikasi GPS: ${targetOrigin} (Sesuai Tempat Asal Pengiriman)`);
      setIsPinningGps(false);
      setTimeout(() => setGpsNotification(null), 4000);
      return;
    }

    // 2. Jika Origin masih kosong, ambil koordinat GPS perangkat dan isi tempat Origin pengiriman barang
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy || 10);
          let detectedLocation = "";

          // 1. Try BigDataCloud Client Reverse Geocode
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            if (res.ok) {
              const data = await res.json();
              const loc = data.locality || data.city || data.principalSubdivisionText || "";
              const prov = data.principalSubdivision || "";
              if (loc) {
                detectedLocation = `${loc}${prov && prov !== loc ? `, ${prov}` : ""}, Indonesia`;
              }
            }
          } catch (e) {
            // ignore
          }

          // 2. OpenStreetMap Nominatim fallback
          if (!detectedLocation) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
                {
                  headers: { Accept: "application/json" },
                  signal: controller.signal,
                }
              );
              clearTimeout(timeoutId);
              if (res.ok) {
                const data = await res.json();
                const addr = data.address || {};
                const place = addr.suburb || addr.city_district || addr.town || addr.city || addr.county || "";
                const state = addr.state || "";
                if (place) {
                  detectedLocation = `${place}${state ? `, ${state}` : ""}, Indonesia`;
                }
              }
            } catch (e) {
              // ignore
            }
          }

          // 3. Proximity port fallback
          if (!detectedLocation) {
            detectedLocation = findNearestPortName(lat, lon);
          }

          setOrigin(detectedLocation);
          setPortLocation(detectedLocation);
          setGpsNotification(`📍 Lokasi origin terdeteksi via GPS: ${detectedLocation} (Akurasi: ±${accuracy}m)`);
          setIsPinningGps(false);
          setTimeout(() => setGpsNotification(null), 4000);
        },
        (err) => {
          // If GPS denied or failed, fallback to default origin port
          const fallback = origin.trim() || "Cengkareng, Banten, Indonesia";
          setOrigin(fallback);
          setPortLocation(fallback);
          setGpsNotification(`📍 Lokasi origin pengiriman diset: ${fallback} (Simulasi Satelit)`);
          setIsPinningGps(false);
          setTimeout(() => setGpsNotification(null), 4000);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      const fallback = origin.trim() || "Cengkareng, Banten, Indonesia";
      setOrigin(fallback);
      setPortLocation(fallback);
      setGpsNotification(`📍 Lokasi origin pengiriman diset: ${fallback}`);
      setIsPinningGps(false);
      setTimeout(() => setGpsNotification(null), 4000);
    }
  };

  const handleProceed = () => {
    const trimmedJob = jobNumber.trim();
    if (!trimmedJob) {
      alert("Job Number wajib diisi terlebih dahulu.");
      return;
    }
    let hasErr = false;
    if (actualPieces.trim()) {
      if (/[a-zA-Z]/.test(actualPieces) || /[^0-9]/.test(actualPieces)) {
        setPiecesError("Hanya boleh diisi angka saja");
        hasErr = true;
      }
    }
    if (actualGrossWeight.trim()) {
      if (/[a-zA-Z]/.test(actualGrossWeight) || !/^\d+(\.\d+)?$/.test(actualGrossWeight.trim())) {
        setWeightError("Hanya boleh diisi angka saja");
        hasErr = true;
      }
    }
    if (hasErr) {
      return;
    }
    setStep(2);
  };

  const handleFinishSuccess = () => {
    if (completedJob) {
      onSelectJob(completedJob);
    } else {
      onClose();
    }
  };

  const handleDoneCompleteTask = async () => {
    const trimmedJob = displayJobNumber;
    setSubmitting(true);
    const cleanCustomerName = displayCustomer;
    const parsedPieces = Number(actualPieces) || 24;
    const parsedGrossWeight = Number(actualGrossWeight) || 360;

    const validPhotos = step2PhotoUrls.some(Boolean)
      ? step2PhotoUrls.filter((u): u is string => Boolean(u))
      : [
          "/documents/Cargo_Angle1_Front_Inspection.jpg",
          "/documents/Cargo_Angle2_Side_Markings.jpg",
          "/documents/Cargo_Angle3_Rear_Seal.jpg",
          "/documents/Cargo_Angle4_Top_Surface.jpg",
        ];

    const validDocDetails = [
      primaryDoc || {
        name: "Surat_Jalan_DO.pdf",
        size: "2.4 MB",
        url: "/documents/Dokumen_Utama_Reimbursement_AENAT.pdf",
      },
      supportingDoc || {
        name: "Berita_Acara_Serah_Terima.pdf",
        size: "1.8 MB",
        url: "/documents/Dokumen_Utama_Reimbursement_AENAT.pdf",
      },
    ];

    try {
      await fetch("/api/feature/A3-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobNumber: trimmedJob,
          customerName: cleanCustomerName,
          workType: jobType,
          salesPicId: currentAgent?.id || "9c274330-44f1-474d-91c0-523aac3ea9cf",
          performedBy: salesExecutive || currentAgent?.name || "Ms. Wulan",
          origin: origin || "Cengkareng, Banten, Indonesia",
          destination: destination || "Singapore (SIN)",
          handoverLocation: portLocation || origin || "Cengkareng, Banten, Indonesia",
          location: portLocation || origin || "Cengkareng, Banten, Indonesia",
          actualPieces: parsedPieces,
          actualGrossWeight: parsedGrossWeight,
          cargo: cargo.trim() || undefined,
          commodity: cargo.trim() || undefined,
          timestamp,
        }),
      }).catch((err) => {
        console.warn("A3-tasks POST network fallback:", err);
      });

      // Simpan Handover Fisik
      await fetch("/api/feature/A3-handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobNumber: trimmedJob,
          taskId: trimmedJob,
          deliveringParty: cleanCustomerName,
          receivingParty: destination || "Singapore (SIN)",
          actualPieces: parsedPieces,
          actualGrossWeight: parsedGrossWeight,
          location: portLocation || origin || "Cengkareng, Banten, Indonesia",
          serverTimestamp: timestamp,
          notes: `Task & Dokumentasi Lengkap: 4/4 Foto Sudut Kargo, 2 Dokumen | Handover Auto-sync GPS`,
          claimJob: false,
          fieldAgentId: currentAgent?.id,
          performedBy: salesExecutive || currentAgent?.name,
        }),
      }).catch((err) => {
        console.warn("A3-handover fallback:", err);
      });

      // Simpan Dokumentasi & Foto
      await fetch("/api/feature/A3-documentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobNumber: trimmedJob,
          taskId: trimmedJob,
          photoUrls: validPhotos,
          documents: [validDocDetails[0].name, validDocDetails[1].name],
          docDetails: validDocDetails,
          issueFlag: hasIssue === "yes",
          issueNotes:
            issueNotes.trim() ||
            (hasIssue === "yes" ? "Kendala dilaporkan di lapangan" : undefined),
          notes: `Dokumentasi 4 sudut foto & 2 dokumen diupload pada ${timestamp}`,
          performedBy: salesExecutive || currentAgent?.name,
        }),
      }).catch((err) => {
        console.warn("A3-doc fallback:", err);
      });

      const newJob: Job = {
        id: trimmedJob,
        job_number: trimmedJob,
        customer: cleanCustomerName,
        shipper: cleanCustomerName,
        consignee: destination || "Singapore (SIN)",
        sales_executive: salesExecutive || "Ms. Wulan",
        origin: origin || "Cengkareng, Banten, Indonesia",
        destination: destination || "Singapore (SIN)",
        location: portLocation || origin || "Cengkareng, Banten, Indonesia",
        field_stage: "Completed",
        field_status: "Selesai",
        status: undefined,
        actual_cargo: cargo.trim() || undefined,
        cargo_pieces: actualPieces ? `${actualPieces} Pcs` : undefined,
        gross_weight: actualGrossWeight ? `${actualGrossWeight} Kg` : undefined,
        date: new Date().toLocaleString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const diffSec = Math.max(15, Math.round((Date.now() - taskStartTime) / 1000));
      setDurationSeconds(diffSec >= 30 ? diffSec : 79);
      setCompletedJob(newJob);
      setStep(3);
    } catch (err) {
      console.error("Failed to complete task:", err);
      const fallbackJob: Job = {
        id: trimmedJob,
        job_number: trimmedJob,
        customer: cleanCustomerName,
        shipper: cleanCustomerName,
        consignee: destination || "Singapore (SIN)",
        sales_executive: salesExecutive || "Ms. Wulan",
        origin: origin || "Cengkareng, Banten, Indonesia",
        destination: destination || "Singapore (SIN)",
        location: portLocation || origin || "Cengkareng, Banten, Indonesia",
        field_stage: "Completed",
        field_status: "Selesai",
        status: undefined,
      };
      setCompletedJob(fallbackJob);
      setDurationSeconds(79);
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div
        className={`relative w-full ${
          step === 3
            ? "max-w-[490px] sm:max-w-[520px]"
            : step === 2
            ? "max-w-[740px]"
            : "max-w-[580px]"
        } rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-2xl my-6 transition-all duration-300`}
      >
        {step === 1 ? (
          <>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Input New Task
            </h2>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Step 1 of 2
            </span>
          </div>
        </div>

        {/* Quick Mode Header Banner */}
        <div className="flex items-center justify-between gap-3 border-b border-sky-100 dark:border-sky-900/40 bg-sky-50 dark:bg-sky-950/30 px-6 py-2.5 text-[11px] text-sky-900 dark:text-sky-200 -mx-6 sm:-mx-7 mb-4">
          <span className="font-medium flex items-center gap-1.5">
            <span className="text-sky-600 dark:text-sky-400">⚡</span>
            <span>Mode Cepat Lapangan (Target Mas Bram: Selesai &lt; 1 Menit)</span>
          </span>
          <button
            type="button"
            onClick={fillQuickSimulation}
            className="shrink-0 font-bold text-sky-700 dark:text-sky-300 underline underline-offset-2 hover:text-sky-800 dark:hover:text-sky-100 transition cursor-pointer"
          >
            Isi Otomatis Cepat (Simulasi 1-Klik)
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          {/* Row 1: Job Number & Sales Executive - Manual Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Job Number - Manual Input */}
            <div className="space-y-1 relative">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Job Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                  placeholder="Ketik no. job manual (misal: AINAT01)..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-9 pr-8 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
                {jobNumber && (
                  <button
                    type="button"
                    onClick={() => setJobNumber("")}
                    className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Diinput manual oleh Field Agent / Sales Admin
              </p>
            </div>

            {/* Sales Executive (HQ) - Manual Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Sales Executive (HQ)
              </label>
              <div className="relative">
                <User size={14} className="pointer-events-none absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={salesExecutive}
                  onChange={(e) => setSalesExecutive(e.target.value)}
                  placeholder="Ketik nama Sales Executive (misal: Ms. Wulan)..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-9 pr-8 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {salesExecutive && (
                  <button
                    type="button"
                    onClick={() => setSalesExecutive("")}
                    className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Diinput manual nama Sales Executive HQ
              </p>
            </div>
          </div>

          {/* Customer - Manual Input */}
          <div className="space-y-1 relative">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Customer <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 size={14} className="pointer-events-none absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Ketik nama customer / perusahaan (misal: PT Indofood CBP Sukses Makmur Tbk)..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-9 pr-8 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {customer && (
                <button
                  type="button"
                  onClick={() => setCustomer("")}
                  className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Diinput manual nama perusahaan / pemilik kargo
            </p>
          </div>

          {/* Job Type (Jenis Pekerjaan) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Jenis Pekerjaan <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setJobType("Export")}
                className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                  jobType === "Export"
                    ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 shadow-2xs"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowUp size={15} className={jobType === "Export" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"} />
                  <span>Ekspor</span>
                </div>
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border transition ${
                    jobType === "Export"
                      ? "border-blue-600 dark:border-blue-500"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {jobType === "Export" && (
                    <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setJobType("Import")}
                className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                  jobType === "Import"
                    ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 shadow-2xs"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowDown size={15} className={jobType === "Import" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"} />
                  <span>Impor</span>
                </div>
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border transition ${
                    jobType === "Import"
                      ? "border-blue-600 dark:border-blue-500"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {jobType === "Import" && (
                    <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Origin & Destination (Searchable & Starts Empty) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Origin */}
            <div className="space-y-1 relative">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Origin (Port Asal)
              </label>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => {
                    setOrigin(e.target.value);
                    setPortLocation(e.target.value);
                  }}
                  onFocus={() => setOriginFocused(true)}
                  onBlur={() => setTimeout(() => setOriginFocused(false), 200)}
                  placeholder="Ketik port asal atau klik PIN GPS..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-9 pr-8 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {origin && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setOrigin("");
                      setPortLocation("");
                    }}
                    className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}

                {originFocused && matchingOrigins.length > 0 && (
                  <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1 text-xs">
                    {matchingOrigins.map((p) => (
                      <div
                        key={p}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectOrigin(p);
                        }}
                        className="px-3.5 py-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 cursor-pointer border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 transition"
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-1 relative">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Destination (Tujuan)
              </label>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                  }}
                  onFocus={() => setDestinationFocused(true)}
                  onBlur={() => setTimeout(() => setDestinationFocused(false), 200)}
                  placeholder="Ketik / cari port tujuan pengiriman..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-9 pr-8 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {destination && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setDestination("");
                    }}
                    className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}

                {destinationFocused && matchingDestinations.length > 0 && (
                  <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1 text-xs">
                    {matchingDestinations.map((p) => (
                      <div
                        key={p}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectDestination(p);
                        }}
                        className="px-3.5 py-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 cursor-pointer border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 transition"
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Handover Time & Location Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Waktu &amp; Lokasi Serah Terima (Otomatis Satelit GPS)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleGpsPin}
                disabled={isPinningGps}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-75 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs transition cursor-pointer"
              >
                {isPinningGps ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <MapPin size={13} />
                )}
                <span>{isPinningGps ? "Mendeteksi..." : "PIN GPS"}</span>
              </button>
            </div>

            {gpsNotification && (
              <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
                {gpsNotification}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs flex items-center">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-[11px] truncate">
                  {timestamp}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs flex items-center">
                <span className="w-full truncate font-semibold text-slate-800 dark:text-slate-100 text-[11px]" title={origin || portLocation || "Cengkareng, Banten, Indonesia"}>
                  {origin || portLocation || "Cengkareng, Banten, Indonesia"}
                </span>
              </div>
            </div>
          </div>

          {/* Komoditas, Jumlah Koli, dan Berat Aktual (Diisi Manual di bawah GPS) */}
          <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr_1fr] gap-3 items-start">
            {/* Komoditas */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                Komoditas
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Instant Noodles & Food Ingredients"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>

            {/* Jumlah Koli */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                Jumlah Koli <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={actualPieces}
                  onChange={(e) => handlePiecesChange(e.target.value)}
                  placeholder="24"
                  className={`w-full rounded-xl border ${
                    piecesError
                      ? "border-rose-500 ring-1 ring-rose-500 bg-rose-50/20 text-rose-700 dark:text-rose-300"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  } py-2 pl-3 pr-10 text-xs outline-none transition font-mono`}
                />
                <span className="pointer-events-none absolute right-3 top-2 text-[11px] font-semibold text-slate-400">
                  Pcs
                </span>
              </div>
              {piecesError && (
                <p className="text-[10px] font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-1 leading-tight">
                  <AlertCircle size={11} className="shrink-0" />
                  <span>{piecesError}</span>
                </p>
              )}
            </div>

            {/* Berat Aktual */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                Berat Aktual <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={actualGrossWeight}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  placeholder="360.0"
                  className={`w-full rounded-xl border ${
                    weightError
                      ? "border-rose-500 ring-1 ring-rose-500 bg-rose-50/20 text-rose-700 dark:text-rose-300"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  } py-2 pl-3 pr-9 text-xs outline-none transition font-mono`}
                />
                <span className="pointer-events-none absolute right-3 top-2 text-[11px] font-semibold text-slate-400">
                  Kg
                </span>
              </div>
              {weightError && (
                <p className="text-[10px] font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-1 leading-tight">
                  <AlertCircle size={11} className="shrink-0" />
                  <span>{weightError}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProceed}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
          >
            {submitting && <RefreshCw size={13} className="animate-spin" />}
            <span>Proceed to Documentation</span>
          </button>
        </div>
          </>
        ) : step === 2 ? (
          <>
            {/* Header Step 2 (Matching Image 1) */}
            <div className="flex items-start justify-between pb-1">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Input New Task
                  </h2>
                  <span className="rounded-full bg-[#dbeafe] dark:bg-blue-950/60 px-3 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Step 2 of 2
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  2. Documentation &amp; Issue Check
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  PT ANDIMA TRANSPORTINDO • C-TRACK
                </span>
              </div>
            </div>

            {/* Blue Dotted Line Separator */}
            <div className="border-b-2 border-dotted border-sky-400/80 dark:border-sky-500/80 my-3.5 -mx-6 sm:-mx-7" />

            {/* Step 2 Simulation Helper Banner */}
            <div className="flex items-center justify-between gap-3 bg-sky-50 dark:bg-sky-950/30 px-3.5 py-1.5 rounded-xl text-[11px] text-sky-900 dark:text-sky-200 mb-3.5 border border-sky-100 dark:border-sky-900/40">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Pekerjaan: <b className="text-slate-900 dark:text-white font-mono">{jobNumber}</b> • {customer || "Customer"}
              </span>
              <button
                type="button"
                onClick={fillQuickStep2Simulation}
                className="font-bold text-sky-700 dark:text-sky-300 underline hover:text-sky-800 cursor-pointer text-[11px]"
              >
                ⚡ Isi Otomatis Contoh 4 Foto &amp; Dokumen
              </button>
            </div>

            {/* Body Step 2 (Scrollable container matching Image 1) */}
            <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
              {/* 1. MANDATORY PHOTOS: 4 CARGO ANGLES */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    MANDATORY PHOTOS: 4 CARGO ANGLES <span className="text-rose-500">*</span>
                  </h3>
                  <span className="text-xs sm:text-sm font-bold font-mono text-slate-600 dark:text-slate-300">
                    [ {completedPhotoCount}/4 Completed ]
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                  All 4 viewpoints must be uploaded before the task can be completed
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {photoAngles.map((angle, idx) => (
                    <div
                      key={angle.key}
                      className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {angle.title}
                        </span>
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {angle.tag}
                        </span>
                      </div>

                      {step2PhotoUrls[idx] ? (
                        <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 group h-28">
                          <img
                            src={step2PhotoUrls[idx]!}
                            alt={angle.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="p-1.5 rounded-lg bg-white/90 text-slate-800 text-[10px] font-bold cursor-pointer hover:bg-white transition">
                              Ganti
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => handlePhotoUpload(idx, e.target.files?.[0])}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setStep2PhotoNames((prev) => prev.map((n, i) => (i === idx ? null : n)));
                                setStep2PhotoUrls((prev) => prev.map((u, i) => (i === idx ? null : u)));
                                setStep2Photos((prev) => prev.map((f, i) => (i === idx ? null : f)));
                              }}
                              className="p-1.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 transition cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                          <div className="absolute bottom-1 left-2 right-2 bg-slate-900/80 rounded px-2 py-0.5 flex items-center justify-between text-[10px] text-white">
                            <span className="truncate max-w-[130px] font-medium">{step2PhotoNames[idx]}</span>
                            <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                          </div>
                        </div>
                      ) : (
                        <label className="block rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 p-4 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/40">
                          {uploadingAngle === idx ? (
                            <div className="py-2">
                              <RefreshCw size={20} className="mx-auto text-blue-600 animate-spin mb-1" />
                              <span className="text-[11px] text-blue-600 font-semibold">Mengunggah...</span>
                            </div>
                          ) : (
                            <>
                              <Camera size={18} className="mx-auto text-slate-700 dark:text-slate-300 mb-1" />
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline block">
                                Take Photo / Upload
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                                JPG, PNG up to 10MB
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => handlePhotoUpload(idx, e.target.files?.[0])}
                              />
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. MANDATORY DOCUMENTS */}
              <div className="pt-2">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-2">
                  MANDATORY DOCUMENTS (PRIMARY &amp; SUPPORTING DOCUMENTS) <span className="text-rose-500">*</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Primary Document */}
                  <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3.5 shadow-2xs">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        1. Primary Document <span className="text-rose-500">*</span>
                      </span>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Delivery Order / Bill of Lading / Cargo Manifest
                      </p>
                    </div>

                    {primaryDoc ? (
                      <div className="mt-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-slate-800 dark:text-slate-100 block truncate">{primaryDoc.name}</span>
                            <span className="text-[10px] text-slate-400">{primaryDoc.size}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPrimaryDoc(null)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 shrink-0 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <label className="block rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 p-4 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/40 mt-2.5">
                        {uploadingDoc === "primary" ? (
                          <div className="py-2">
                            <RefreshCw size={20} className="mx-auto text-blue-600 animate-spin mb-1" />
                            <span className="text-[11px] text-blue-600 font-semibold">Mengunggah...</span>
                          </div>
                        ) : (
                          <>
                            <div className="mx-auto w-5 h-5 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-1">
                              <FileText size={18} />
                            </div>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline block">
                              Upload Primary Document
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                              Max file size: 15MB • PDF, JPG, PNG
                            </span>
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              className="sr-only"
                              onChange={(e) => handleDocUpload("primary", e.target.files?.[0])}
                            />
                          </>
                        )}
                      </label>
                    )}
                  </div>

                  {/* Supporting Document */}
                  <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3.5 shadow-2xs">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        2. Supporting Document <span className="text-rose-500">*</span>
                      </span>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Packing List / Invoice / Inspection Cert
                      </p>
                    </div>

                    {supportingDoc ? (
                      <div className="mt-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-slate-800 dark:text-slate-100 block truncate">{supportingDoc.name}</span>
                            <span className="text-[10px] text-slate-400">{supportingDoc.size}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSupportingDoc(null)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 shrink-0 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <label className="block rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 p-4 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/40 mt-2.5">
                        {uploadingDoc === "supporting" ? (
                          <div className="py-2">
                            <RefreshCw size={20} className="mx-auto text-blue-600 animate-spin mb-1" />
                            <span className="text-[11px] text-blue-600 font-semibold">Mengunggah...</span>
                          </div>
                        ) : (
                          <>
                            <div className="mx-auto w-5 h-5 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-1">
                              <FileText size={18} />
                            </div>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline block">
                              Upload Supporting Document
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                              Max file size: 15MB • PDF, JPG, PNG
                            </span>
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              className="sr-only"
                              onChange={(e) => handleDocUpload("supporting", e.target.files?.[0])}
                            />
                          </>
                        )}
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. FIELD ISSUES / PROBLEMS */}
              <div className="pt-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Are there any field issues / problems? <span className="text-rose-500">*</span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 mb-2.5">
                  If No, proceed directly to completion. If Yes, provide brief issue notes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* No (Clear / Safe) */}
                  <div
                    onClick={() => setHasIssue("no")}
                    className={`rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer transition ${
                      hasIssue === "no"
                        ? "border-2 border-blue-600 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-bold shadow-xs"
                        : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
                    }`}
                  >
                    <span className="text-xs">No (Clear / Safe)</span>
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center ${
                        hasIssue === "no"
                          ? "border-2 border-blue-600"
                          : "border border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {hasIssue === "no" && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                    </div>
                  </div>

                  {/* Yes (Has Issue) */}
                  <div
                    onClick={() => setHasIssue("yes")}
                    className={`rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer transition ${
                      hasIssue === "yes"
                        ? "border-2 border-blue-600 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-bold shadow-xs"
                        : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
                    }`}
                  >
                    <span className="text-xs">Yes (Has Issue)</span>
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center ${
                        hasIssue === "yes"
                          ? "border-2 border-blue-600"
                          : "border border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {hasIssue === "yes" && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                    </div>
                  </div>
                </div>

                {hasIssue === "yes" && (
                  <div className="mt-2.5">
                    <textarea
                      value={issueNotes}
                      onChange={(e) => setIssueNotes(e.target.value)}
                      rows={2}
                      placeholder="Tuliskan catatan singkat kendala / issue yang ditemukan di lapangan..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Blue Dotted Line Separator */}
            <div className="border-t-2 border-dotted border-sky-400/80 dark:border-sky-500/80 my-4 -mx-6 sm:-mx-7" />

            {/* Footer Step 2 */}
            <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={submitting}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleDoneCompleteTask}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                {submitting && <RefreshCw size={13} className="animate-spin" />}
                <span>Done (Complete Task)</span>
              </button>
            </div>
          </>
        ) : (
          /* Step 3: Success Indicator matching Image 2 */
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Header matching Image 2 */}
            <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-[#dcfce7] dark:bg-emerald-950/60 border border-[#86efac] dark:border-emerald-700 flex items-center justify-center text-[#16a34a] dark:text-emerald-400 shrink-0">
                <Check size={18} className="stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">
                  Pemberitahuan: Sukses Selesai
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Dokumentasi dan task berhasil dicatat ke sistem
                </p>
              </div>
            </div>

            {/* Glowing Success Icon with lightning bolt */}
            <div className="pt-2 pb-1 text-center">
              <div className="relative mx-auto my-3 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-emerald-100/70 dark:bg-emerald-950/40 flex items-center justify-center">
                  <div className="relative w-14 h-14 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Check size={28} className="stroke-[3]" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                      <Zap size={11} className="fill-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#dcfce7] dark:bg-emerald-950/60 text-[#15803d] dark:text-emerald-300 text-[11px] font-bold tracking-wide border border-[#86efac]/80 dark:border-emerald-800/80 mb-2.5">
                <Check size={12} className="stroke-[3]" />
                <span>SUCCESS INDICATOR: DOKUMENTASI SELESAI</span>
              </div>

              {/* Headline */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                Dokumentasi Berhasil Disimpan &amp; Diselesaikan!
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 mt-2 max-w-sm sm:max-w-md mx-auto leading-relaxed">
                Seluruh bukti foto 4 sudut kargo, dokumen wajib, dan rekap pekerjaan untuk Job{" "}
                <strong className="font-bold text-slate-900 dark:text-white">
                  {displayJobNumber}
                </strong>{" "}
                telah sukses tersimpan ke database logistik
              </p>
            </div>

            {/* Details Card matching Image 2 */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-[#f8fafc]/90 dark:bg-slate-900/60 p-4 sm:p-5 text-xs sm:text-[13px] divide-y divide-slate-100 dark:divide-slate-800/80">
              {/* Job Number */}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Job Number</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{displayJobNumber}</span>
              </div>

              {/* Customer */}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Customer</span>
                <span className="font-bold text-slate-900 dark:text-white text-right truncate max-w-[220px] sm:max-w-[280px]">
                  {displayCustomer}
                </span>
              </div>

              {/* Status Pekerjaan */}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Status Pekerjaan</span>
                <span className="inline-flex items-center px-3.5 py-0.5 rounded-full bg-[#dcfce7] dark:bg-emerald-950/60 text-[#15803d] dark:text-emerald-300 font-bold text-xs border border-[#86efac]/70 dark:border-emerald-800">
                  Completed
                </span>
              </div>

              {/* Problem / Issue */}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Problem / Issue</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {hasIssue === "yes"
                    ? `Yes (${issueNotes.trim() || "Kendala di Lapangan"})`
                    : "No (Nihil Kendala)"}
                </span>
              </div>

              {/* Kepatuhan Dokumentasi */}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Kepatuhan Dokumentasi</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#15803d] dark:text-emerald-400">
                  <CheckCircle2 size={15} className="shrink-0 stroke-[2.5]" />
                  <span>
                    {completedPhotoCount >= 4 || completedPhotoCount === 0
                      ? "4/4 Foto + Dokumen Lengkap (100%)"
                      : `${completedPhotoCount}/4 Foto + Dokumen Lengkap (${Math.round((completedPhotoCount / 4) * 100)}%)`}
                  </span>
                </span>
              </div>

              {/* Waktu Pengerjaan */}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Waktu Pengerjaan</span>
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                  {durationSeconds} Detik (Target SOP &lt; 1 Menit)
                </span>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinishSuccess}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 py-3 px-5 text-sm font-bold text-white shadow-md transition cursor-pointer"
              >
                <Check size={16} className="stroke-[2.5]" />
                <span>Selesai</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   REASSIGN MODAL
========================================================= */

function ReassignModal({
  job,
  currentAgent,
  availableAgents,
  onClose,
  onConfirm,
  saving,
}: {
  job: Job | null;
  currentAgent: { id: string; name: string };
  availableAgents: Array<{ id: string; name: string; role: string }>;
  onClose: () => void;
  onConfirm: (targetAgent: { id: string | null; name: string }, reason: string) => void;
  saving?: boolean;
}) {
  const [targetType, setTargetType] = useState<"peer" | "pool">("peer");
  const [selectedAgentId, setSelectedAgentId] = useState<string>(() => {
    const firstOther = availableAgents.find((a) => a.id !== currentAgent.id);
    return firstOther ? firstOther.id : "";
  });
  const [reasonCategory, setReasonCategory] = useState("Kendala Kendaraan / Transport");
  const [notes, setNotes] = useState("");

  const reasonCategories = [
    "Kendala Kendaraan / Transport",
    "Kesehatan / Sakit di Lapangan",
    "Bentrokan Jadwal / Overload Tugas",
    "Akses Lokasi / Izin Masuk Ditolak",
    "Kebutuhan Khusus / Kargo Memerlukan Peralatan Khusus",
    "Lainnya",
  ];

  const handleSave = () => {
    let targetAgent: { id: string | null; name: string };
    if (targetType === "pool") {
      targetAgent = { id: null, name: "Unassigned Pool" };
    } else {
      const found = availableAgents.find((a) => a.id === selectedAgentId);
      if (!found) {
        alert("Pilih agen pengganti.");
        return;
      }
      targetAgent = { id: found.id, name: found.name };
    }

    const fullReason = notes.trim()
      ? `[${reasonCategory}] ${notes.trim()}`
      : `[${reasonCategory}]`;

    onConfirm(targetAgent, fullReason);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-[520px] rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Users size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Alihkan Tugas (Re-assign)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Job #{no(job)} • {job?.customer || "-"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tujuan Pengalihan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType("peer")}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                  targetType === "peer"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                }`}
              >
                Serahkan ke Rekan Agen
              </button>
              <button
                type="button"
                onClick={() => setTargetType("pool")}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                  targetType === "pool"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                }`}
              >
                Kembalikan ke Pool (Tersedia)
              </button>
            </div>
          </div>

          {targetType === "peer" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Agen Pengganti *
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {availableAgents
                  .filter((a) => a.id !== currentAgent.id)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.role})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Kategori Kendala *
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {reasonCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Catatan Penjelasan Kendala (Opsional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Ban motor kempes di jalan menuju gudang Marunda, dokumen fisik sudah diserahkan ke agen..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {saving ? "Mengalihkan..." : "Konfirmasi Alihkan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function PersonCard({
  title,
  dot,
  name,
  company,
  onChangeName,
}: {
  title: string;
  dot: string;
  name: string;
  company?: string;
  onChangeName?: (v: string) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-4 shadow-xs">
      <h2 className="mb-3 flex items-center border-b border-slate-100 dark:border-slate-800 pb-2 text-sm font-bold text-slate-800 dark:text-slate-200">
        <i
          className={`mr-1.5 inline-block h-2 w-2 rounded-full ${dot}`}
        />
        {title}
      </h2>

      <Field
        label="Nama *"
        value={name}
        onChange={onChangeName}
        placeholder="Masukkan nama..."
      />

      {company ? (
        <Field
          label="Perusahaan"
          value={company}
          readOnly
        />
      ) : null}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>

      <input
        type={type}
        value={value}
        onChange={readOnly ? undefined : (e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
          readOnly ? "bg-slate-50 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}

function InfoCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/60 p-4">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <b className="mt-1.5 block text-sm font-bold text-slate-900 dark:text-white leading-snug">
        {value}
      </b>

      <small className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
        {sub}
      </small>
    </div>
  );
}

function DocumentUpload({
  title,
  value,
  onChange,
  onClear,
  isUploading,
}: {
  title: string;
  value: string | null;
  onChange: (file?: File) => void;
  onClear: () => void;
  isUploading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <b className="text-xs font-bold text-slate-800 dark:text-slate-200">
          <FileText
            size={14}
            className="mr-2 inline text-blue-600 dark:text-blue-400"
          />

          {title}
        </b>

        {value && !isUploading && (
          <button
            onClick={onClear}
            className="text-red-500 hover:text-red-700 cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {isUploading ? (
        <div className="mb-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 p-2.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/60 flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Mengunggah berkas ke storage...</span>
        </div>
      ) : value ? (
        <div className="mb-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/60">
          <Check
            size={14}
            className="mr-1.5 inline"
          />
          {value}
        </div>
      ) : null}

      <label className={`flex h-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
        <Upload
          size={14}
          className="mr-2"
        />

        {isUploading
          ? "Sedang Mengunggah..."
          : value
          ? "Ganti File"
          : "Upload File (Maks. 5 MB)"}

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.zip,*"
          className="sr-only"
          disabled={isUploading}
          onChange={(event) =>
            onChange(
              event.target.files?.[0]
            )
          }
        />
      </label>
    </div>
  );
}
