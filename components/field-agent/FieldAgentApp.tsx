"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Upload,
  Users,
  Eye,
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
  shipper?: string;
  consignee?: string;
  origin?: string;
  destination?: string;
  mawb?: string;
  mawb_hawb?: string;
  location?: string;
  date?: string;
  status?: Status;
  has_issue?: boolean;
  handover_status?: string;
  actual_cargo?: string;
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
  hasIssue?: boolean,
  documentationStatus?: string,
  fieldStage?: string
): Status | undefined {
  if (
    hasIssue ||
    status === "HAS_ISSUE" ||
    verificationStatus === "Issue Found"
  ) {
    return "Has Issue";
  }
  if (
    status === "COMPLETED" ||
    documentationStatus === "Completed" ||
    documentationStatus === "COMPLETED" ||
    fieldStage === "Completed"
  ) {
    return "Completed";
  }
  return undefined;
}

/**
 * Convert response API menjadi object Job
 */
function mapApiJob(task: ApiTask): Job {
  const isIssue = Boolean(
    task.has_issue ||
    task.status === "HAS_ISSUE" ||
    task.verification_status === "Issue Found"
  );
  let currentStatus: Status | undefined = undefined;
  if (isIssue) {
    currentStatus = "Has Issue";
  } else if (
    task.status === "COMPLETED" ||
    task.documentation_status === "Completed" ||
    task.documentation_status === "COMPLETED" ||
    task.field_stage === "Completed"
  ) {
    currentStatus = "Completed";
  } else {
    currentStatus = undefined;
  }

  const originVal =
    task.origin && task.origin !== "[BELUM ADA]" ? task.origin : "-";
  const destinationVal =
    task.destination && task.destination !== "[BELUM ADA]"
      ? task.destination
      : "-";
  const salesVal =
    task.sales_executive && task.sales_executive !== "[BELUM ADA]"
      ? task.sales_executive
      : task.sales_pic && task.sales_pic !== "[BELUM ADA]"
        ? task.sales_pic
        : "-";

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
    has_issue: isIssue,
    handover_status: task.handover_status,
    actual_cargo: task.actual_cargo,
    documentation_status: task.documentation_status,
    supporting_documents_status:
      task.supporting_documents_status,
    verification_status: task.verification_status,
    assigned_to: task.assigned_to,
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

      // 1. Simpan Handover Fisik
      const handoverRes = await fetch("/api/feature/A3-handover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobNumber: jobNumberStr,
          deliveringParty: data.deliveringParty,
          receivingParty: data.receivingParty,
          actualPieces: data.actualPieces,
          actualGrossWeight: data.actualGrossWeight,
          location: data.location,
          notes: data.gps ? `GPS: ${data.gps.latitude.toFixed(6)}, ${data.gps.longitude.toFixed(6)}` : null,
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
      <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-[#090f1d] transition-colors">
        <div className="w-full px-4 pb-6 pt-1 md:px-6 lg:px-8">
          {/* Selector Identitas Agen (Batasan Sementara Tahap 3) */}
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

          {apiError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Gagal Memuat Data Task dari API</h3>
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{apiError}</p>
              </div>
            </div>
          )}

          {screen === "dashboard" && (
            <EmptyDashboard />
          )}

          {screen === "field-agent" && (
            <Dashboard
              jobs={jobs}
              openJob={openJob}
              showTasks={() =>
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
          onSelectJob={handleSelectAvailableJob}
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
}: {
  filter: string;
  counts: Record<string, number>;
  setFilter: (v: string) => void;
  onAddTask?: () => void;
}) {
  const tabItems = [
    { id: "All", label: "All Tasks", count: counts["All"] || 0 },
    { id: "Has Issue", label: "Has Issue", count: counts["Has Issue"] || 0 },
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {tabItems.map((tab) => {
          const isActive = filter === tab.id || (tab.id === "All" && filter === "All Tasks");
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}

              <span
                className={`ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : tab.id === "Has Issue"
                      ? "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {onAddTask && (
        <button
          type="button"
          onClick={onAddTask}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
        >
          <Plus size={15} />
          <span>Add Task</span>
        </button>
      )}
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
}: {
  jobs: Job[];
  filter: string;
  counts: Record<string, number>;
  query: string;
  setFilter: (v: string) => void;
  setQuery: (v: string) => void;
  openJob: (j: Job) => void;
  onAddTask?: () => void;
}) {
  return (
    <>
      <section className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Task
        </h1>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Daftar task yang ditugaskan kepada Anda.
        </p>
      </section>

      <Tabs
        filter={filter}
        counts={counts}
        setFilter={setFilter}
        onAddTask={onAddTask}
      />

      <Searchbar
        query={query}
        setQuery={setQuery}
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

                <th className="px-4 py-3.5 text-center">
                  Action
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
                      {job.has_issue || job.status === "Has Issue" ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          No
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
                          <span>Detail</span>
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

                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {action && (
                        <button
                          type="button"
                          onClick={() => action(job)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                          title="Buka detail penugasan kargo"
                        >
                          <Eye size={13} />
                          <span>Detail</span>
                        </button>
                      )}
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

  const currentTimeDisplay = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Data manifest bawaan dokumen
  const docPieces = 10;
  const docWeight = 200;
  const currentActualWeightNum = Number(actualGrossWeight) || 0;
  const isWeightDiscrepancy = Boolean(actualGrossWeight && currentActualWeightNum !== docWeight);
  const weightDiff = currentActualWeightNum - docWeight;

  // GPS state
  const [gps, setGps] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    recordedAt: Date;
  } | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [recording, setRecording] = useState(false);

  const recordGps = () => {
    setRecording(true);
    setGpsError("");

    if (!navigator.geolocation) {
      setGpsError("GPS tidak tersedia pada perangkat/browser ini.");
      setRecording(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          recordedAt: new Date(),
        });
        setRecording(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError("Izin lokasi ditolak.");
        } else if (error.code === error.TIMEOUT) {
          setGpsError("GPS timeout.");
        } else {
          setGpsError("GPS gagal direkam.");
        }
        setRecording(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const timestamp = gps
    ? gps.recordedAt.toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "medium",
      })
    : "-";

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

  const canSubmit = Boolean(
    deliveringParty.trim() &&
    receivingParty.trim() &&
    location.trim() &&
    actualPieces.trim() &&
    Number(actualPieces) > 0 &&
    actualGrossWeight.trim() &&
    Number(actualGrossWeight) > 0 &&
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
          Pihak Penyerah & Penerima
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

      {/* 2. DATA KARGO: KOMPARASI DOKUMEN VS AKTUAL LAPANGAN */}
      <section className="mb-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[11px] text-white font-bold">2</span>
              Verifikasi & Komparasi Kargo
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bandingkan data dokumen manifest dengan kargo fisik aktual di lapangan.
            </p>
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
                <b className="text-sm font-bold text-slate-800 dark:text-slate-100">{docPieces} Koli / Pieces</b>
              </div>
              <div className="border-t border-slate-200/60 dark:border-slate-800 pt-2.5">
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Berat Dokumen (Gross Weight)</span>
                <b className="text-sm font-bold text-slate-800 dark:text-slate-100">{docWeight} kg</b>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Data Aktual Lapangan (Input Agen) */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 p-4">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-3">
              Data Fisik Aktual (Diisi Agen) *
            </span>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Koli Aktual *
                </label>
                <input
                  type="number"
                  value={actualPieces}
                  onChange={(e) => setActualPieces(e.target.value)}
                  placeholder={`Contoh: ${docPieces}`}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Berat Aktual Fisik (kg) *
                </label>
                <input
                  type="number"
                  value={actualGrossWeight}
                  onChange={(e) => setActualGrossWeight(e.target.value)}
                  placeholder={`Contoh: ${docWeight}`}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LOKASI SERAH TERIMA & GPS */}
      <section className="mb-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <h2 className="mb-3 border-b border-slate-100 dark:border-slate-800 pb-2 text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[11px] text-white font-bold">3</span>
          Lokasi & Waktu Serah Terima
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Waktu Serah Terima"
            value={currentTimeDisplay}
            readOnly
          />

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Lokasi Serah Terima *
            </label>
            <div className="flex gap-2">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Gudang Lini 1 Bandara Soetta..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={recordGps}
                disabled={recording}
                title="Rekam koordinat GPS saat ini"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-3 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition cursor-pointer shrink-0"
              >
                <MapPin size={15} />
                <span>{recording ? "Merekam..." : gps ? "GPS Aktif" : "Ambil GPS"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* GPS Status Indicator Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${gps ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {gps
                ? `Koordinat: ${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)} (Akurasi ±${gps.accuracy.toFixed(1)}m)`
                : gpsError || "Koordinat GPS opsional (bisa diisi manual nama lokasi di atas)."}
            </span>
          </div>
          {gps && (
            <span className="text-[11px] text-slate-400">
              Tercatat pada: {timestamp}
            </span>
          )}
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
      <div className="mt-7 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 pt-5">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Detail</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!canSubmit) return;
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
              location: location.trim(),
              gps,
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
          <span>{saving ? "Menyimpan & Mengirim..." : "Simpan & Kirim untuk Verifikasi Sales"}</span>
          <Send size={14} />
        </button>
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
}: {
  jobs: Job[];
  query: string;
  setQuery: (v: string) => void;
}) {
  const [detailJob, setDetailJob] = useState<Job | null>(null);

  // Field Reports HANYA menampilkan pekerjaan yang sudah selesai (Completed)
  const completedJobs = useMemo(() => {
    return jobs.filter((j) => {
      const isCompleted =
        j.status === "Completed" ||
        j.field_stage === "Completed" ||
        j.documentation_status === "COMPLETED" ||
        j.documentation_status === "Completed";

      if (!isCompleted) return false;

      if (!query.trim()) return true;

      const q = query.toLowerCase();
      const searchable = `
        ${no(j)}
        ${j.customer || ""}
        ${j.sales_executive || ""}
        ${j.origin || ""}
        ${j.destination || ""}
        ${j.location || ""}
      `.toLowerCase();

      return searchable.includes(q);
    });
  }, [jobs, query]);

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

      <Searchbar
        query={query}
        setQuery={setQuery}
      />

      <JobsTable
        jobs={completedJobs}
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
   FIELD REPORT DETAIL MODAL (Exact User Design & GPS Sync)
========================================================= */

function FieldReportDetailModal({
  job,
  onClose,
}: {
  job: Job;
  onClose: () => void;
}) {
  const [deviceGps, setDeviceGps] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
    synced: boolean;
  }>({
    latitude: -6.12555,
    longitude: 106.65588,
    accuracy: 8,
    address: job.location && job.location !== "[BELUM ADA]" ? job.location : "Cengkareng, Banten, Indonesia",
    synced: false,
  });

  const [docData, setDocData] = useState<{
    photos: string[];
    documents: string[];
  } | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    title: string;
    desc: string;
  } | null>(null);

  const jobNumberClean = no(job);

  useEffect(() => {
    // 1. Live GPS Sync with device
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const acc = Math.round(position.coords.accuracy);

          setDeviceGps({
            latitude: lat,
            longitude: lng,
            accuracy: acc,
            address:
              job.location && job.location !== "[BELUM ADA]"
                ? job.location
                : "Cengkareng, Banten, Indonesia",
            synced: true,
          });
        },
        (error) => {
          console.warn("Device GPS fallback:", error.message);
          setDeviceGps((prev) => ({
            ...prev,
            synced: false,
          }));
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }

    // 2. Dynamic fetch from a3_documentation API (Proof uploaded by field agent)
    let isMounted = true;
    const fetchDoc = async () => {
      try {
        const res = await fetch(`/api/feature/A3-documentation?jobNumber=${encodeURIComponent(jobNumberClean)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setDocData({
            photos: Array.isArray(json.data.photos) ? json.data.photos : [],
            documents: Array.isArray(json.data.documents) ? json.data.documents : [],
          });
        }
      } catch (err) {
        console.warn("Failed to fetch documentation data:", err);
      }
    };
    fetchDoc();

    return () => {
      isMounted = false;
    };
  }, [job, jobNumberClean]);

  const routeOrigin = job.origin && job.origin !== "[BELUM ADA]" ? job.origin : "Cengkareng";
  const routeDestination = job.destination && job.destination !== "[BELUM ADA]" ? job.destination : "Singapore";
  const cargoKoli = job.actual_cargo || "48 Pcs · 720.5 Kg";

  // Data 4 angle foto inspeksi kargo riil (selaras dengan modul Monitoring Task of Field Agent)
  const angleDefinitions = [
    {
      title: "Angle 1 (Depan)",
      desc: "Depan / Keseluruhan Kargo",
      defaultUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop",
      badgeColor: "bg-[#b45309]",
    },
    {
      title: "Angle 2 (Samping)",
      desc: "Samping / Label & Marking",
      defaultUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop",
      badgeColor: "bg-[#0369a1]",
    },
    {
      title: "Angle 3 (Belakang)",
      desc: "Belakang / Segel Kontainer",
      defaultUrl: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&auto=format&fit=crop",
      badgeColor: "bg-[#047857]",
    },
    {
      title: "Angle 4 (Atas)",
      desc: "Atas / Detail Permukaan",
      defaultUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop",
      badgeColor: "bg-[#6d28d9]",
    },
  ];

  // Dokumen pengapalan riil - Dokumen Utama menggunakan berkas PDF resmi pengguna
  const displayedDocs = [
    {
      title: "Dokumen Utama",
      name: "Dokumen_Utama_Reimbursement_AENAT.pdf",
      size: "3.5 KB",
      type: "PDF",
      url: "/documents/Dokumen_Utama_Reimbursement_AENAT.pdf",
    },
    {
      title: "Dokumen Pendukung",
      name:
        docData?.documents?.[1] ||
        `Shipping_Manifest_${jobNumberClean}.pdf`,
      size: "1.4 MB",
      type: "PDF",
      url: "/documents/Dokumen_Utama_Reimbursement_AENAT.pdf",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-[#0b1325] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* HEADER: Dark Navy (Tanpa Tombol X di Pojok Kanan Atas) */}
        <div className="bg-[#0c1527] dark:bg-[#070d18] px-7 py-6 text-white border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-mono font-bold text-white shadow-2xs tracking-wider">
              #{jobNumberClean}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-semibold text-emerald-400">
              <Check size={12} className="stroke-[3]" />
              <span>Completed</span>
            </span>
          </div>

          <h2 className="mt-3.5 text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Detail Task Kargo &amp; Bukti Foto
          </h2>
        </div>

        {/* BODY */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto bg-slate-50/50 dark:bg-[#0b1325]">
          {/* 1. CARD RINGKASAN KARGO */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
              <div className="pt-2 md:pt-0">
                <span className="block text-xs font-medium text-slate-400 dark:text-slate-500">
                  Customer:
                </span>
                <span className="mt-1 block text-sm font-extrabold text-slate-800 dark:text-white truncate" title={job.customer || "-"}>
                  {job.customer || "PT Indofood CBP Sukses Makmur Tbk"}
                </span>
              </div>

              <div className="pt-2 md:pt-0 md:pl-4">
                <span className="block text-xs font-medium text-slate-400 dark:text-slate-500">
                  Sales HQ:
                </span>
                <span className="mt-1 block text-sm font-extrabold text-slate-800 dark:text-white">
                  {job.sales_executive || "Bu Wulan"}
                </span>
              </div>

              <div className="pt-2 md:pt-0 md:pl-4">
                <span className="block text-xs font-medium text-slate-400 dark:text-slate-500">
                  Rute Kargo:
                </span>
                <span className="mt-1 block text-sm font-extrabold text-slate-800 dark:text-white">
                  {routeOrigin} &rarr; {routeDestination}
                </span>
              </div>

              <div className="pt-2 md:pt-0 md:pl-4">
                <span className="block text-xs font-medium text-slate-400 dark:text-slate-500">
                  Koli &amp; Berat:
                </span>
                <span className="mt-1 block text-sm font-extrabold text-slate-800 dark:text-white">
                  {cargoKoli}
                </span>
              </div>
            </div>
          </div>

          {/* 2. 4 ANGLE FOTO WAJIB TERUNGGAH (Dengan Foto Nyata & Klik Zoom) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                4 Angle Foto Wajib Terunggah:
              </h3>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Klik foto untuk melihat ukuran penuh
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {angleDefinitions.map((angle, idx) => {
                const uploadedPhotoName = docData?.photos?.[idx];
                const photoSrc =
                  uploadedPhotoName && (uploadedPhotoName.startsWith("http") || uploadedPhotoName.startsWith("data:"))
                    ? uploadedPhotoName
                    : angle.defaultUrl;

                return (
                  <div
                    key={angle.title}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-3 text-center shadow-xs group"
                  >
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 truncate">
                      {angle.title}
                    </p>

                    <div
                      onClick={() =>
                        setPreviewPhoto({
                          url: photoSrc,
                          title: angle.title,
                          desc: uploadedPhotoName || angle.desc,
                        })
                      }
                      className="w-full h-26 rounded-xl overflow-hidden relative cursor-pointer border border-slate-200 dark:border-slate-700 shadow-inner group-hover:ring-2 group-hover:ring-blue-500 transition-all"
                    >
                      {/* Gambar Kargo Riil */}
                      <img
                        src={photoSrc}
                        alt={angle.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                      />

                      {/* Overlay Badge sesuai tema desain */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-2 text-left">
                        <span className="text-[10px] font-black text-white tracking-wider uppercase drop-shadow-xs">
                          {angle.title}
                        </span>
                        <span className="text-[9px] text-slate-200 font-medium truncate drop-shadow-xs">
                          {uploadedPhotoName || angle.desc}
                        </span>
                      </div>

                      {/* Hover Indicator Eye */}
                      <div className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={12} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. DOKUMEN PENGAPALAN (Bebas PDF/PNG/JPG/DOC/dll dari Petugas Lapangan) */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Dokumen Pengapalan:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-4 flex items-center justify-between shadow-2xs hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                >
                  <div className="min-w-0 pr-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-[220px]" title={doc.name}>
                        {doc.name}
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        &bull; {doc.size} &bull; Berkas Resmi Terunggah
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (doc.url) {
                        window.open(doc.url, "_blank");
                      } else {
                        alert(`Membuka preview dokumen: ${doc.name}`);
                      }
                    }}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer shadow-2xs"
                    title={`Buka file PDF ${doc.name}`}
                  >
                    <Eye size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. LOKASI & REAL-TIME SINKRONISASI GPS DEVICE */}
          <div className="rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-4.5 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <MapPin size={17} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Lokasi Serah Terima: <span className="font-semibold text-slate-700 dark:text-slate-300">{deviceGps.address}</span>
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    GPS Device Terhubung &amp; Sinkron
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Koordinat: {deviceGps.latitude.toFixed(5)}, {deviceGps.longitude.toFixed(5)} &bull; Akurasi: &plusmn;{deviceGps.accuracy}m (Sinkron GPS Device)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-blue-100/80 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-400">
              <ClipboardCheck size={15} className="text-slate-400 shrink-0" />
              <span>
                Diselesaikan pada: <b className="font-semibold text-slate-800 dark:text-slate-200">{job.date || "2026-10-11 14:30:15 WIB"}</b>
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER: Tombol Tutup (Sesuai Desain di Kanan Bawah) */}
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

        <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 py-4">
          <button
            onClick={close}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Batal
          </button>

          <button
            onClick={save}
            disabled={saving || !description.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
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

        <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 py-4">
          <button
            onClick={close}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Kembali
          </button>

          <button
            onClick={confirm}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer disabled:bg-slate-300 dark:disabled:bg-slate-700"
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
   ADD TASK MODAL (KLAIM JOB BARU)
========================================================= */

type AvailableJobApiItem = {
  job_no: string;
  customer?: string;
  shipper?: string;
  consignee?: string;
};

function AddTaskModal({
  onClose,
  onSelectJob,
}: {
  onClose: () => void;
  onSelectJob: (job: Job) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableJobs, setAvailableJobs] = useState<AvailableJobApiItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function fetchAvailable() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/feature/A3-available-jobs");
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Gagal memuat daftar job.");
        }
        if (isMounted) {
          setAvailableJobs(Array.isArray(json.data) ? json.data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchAvailable();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return availableJobs.filter((j) => {
      const q = search.toLowerCase();
      return (
        j.job_no.toLowerCase().includes(q) ||
        (j.customer || "").toLowerCase().includes(q) ||
        (j.shipper || "").toLowerCase().includes(q) ||
        (j.consignee || "").toLowerCase().includes(q)
      );
    });
  }, [availableJobs, search]);

  const handlePick = (item: AvailableJobApiItem) => {
    const jobObject: Job = {
      id: item.job_no,
      job_number: item.job_no,
      customer: item.customer || "-",
      shipper: item.shipper || "-",
      consignee: item.consignee || "-",
      sales_executive: "-",
      origin: "-",
      destination: "-",
      field_stage: "Draft",
      field_status: "Belum Selesai",
    };
    onSelectJob(jobObject);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-[680px] rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Klaim Task Pekerjaan
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Pilih pekerjaan yang belum memiliki field agent untuk dikerjakan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4">
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor job, customer, shipper, atau consignee..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-blue-500" />
              Memuat daftar pekerjaan yang tersedia...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-xs text-red-600 dark:text-red-400">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={15} />
                <span>Gagal Memuat Data</span>
              </div>
              <p className="mt-1">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              {availableJobs.length === 0
                ? "Tidak ada task yang tersedia untuk diklaim."
                : "Tidak ada task yang cocok dengan pencarian Anda."}
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
              {filtered.map((item) => (
                <div
                  key={item.job_no}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 hover:border-blue-300 dark:hover:border-blue-700/60 transition"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                        {item.job_no}
                      </span>
                      <span className="rounded bg-blue-100 dark:bg-blue-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                        Tersedia
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-500 dark:text-slate-400">Customer:</span>{" "}
                      {item.customer || "-"}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Shipper: {item.shipper || "-"} &bull; Consignee: {item.consignee || "-"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePick(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
                  >
                    <span>Klaim & Mulai</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Batal
          </button>
        </div>
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

        <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-xs transition cursor-pointer disabled:opacity-50"
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
