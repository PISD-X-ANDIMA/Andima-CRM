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

  // State Add Task & Claiming
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isClaimingJob, setIsClaimingJob] = useState(false);

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
     COUNTS
  ======================================================= */

  const counts = useMemo(
    () => ({
      All: jobs.length,

      Completed: jobs.filter(
        (j) => j.status === "Completed"
      ).length,

      "Has Issue": jobs.filter(
        (j) => j.status === "Has Issue"
      ).length,
    }),
    [jobs]
  );

  /* =======================================================
     FILTER
  ======================================================= */

  const shown = useMemo(() => {
    return jobs.filter((job) => {
      const matchesFilter =
        filter === "All" || job.status === filter;

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
  }, [jobs, filter, query]);

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
  ======================================================= */

  const saveWorkflow = async (
    endpoint: string,
    payload: Record<string, unknown>,
    next: Screen
  ) => {
    if (!selected) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/feature/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            jobNumber: no(selected),
            ...payload,
          }),
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error || "Workflow gagal disimpan.";
        throw new Error(errMsg);
      }

      if (endpoint === "A3-handover" && isClaimingJob) {
        setIsClaimingJob(false);
        await loadA3Tasks();
      }

      setScreen(next);

      setNotice(
        "Data berhasil disimpan."
      );
    } catch (error) {
      console.error(error);

      setNotice(
        error instanceof Error ? error.message : "Workflow gagal disimpan. Silakan coba lagi."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentationDone = async (data: {
    photos: string[];
    documents: string[];
    hasIssue: boolean;
    issueDescription?: string;
  }) => {
    if (!selected) {
      return;
    }

    setSaving(true);
    setNotice("");

    try {
      const docResponse = await fetch(
        "/api/feature/A3-documentation",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            jobNumber: no(selected),
            photos: data.photos,
            documents: data.documents,
          }),
        }
      );

      if (!docResponse.ok) {
        throw new Error(
          "Dokumentasi gagal disimpan."
        );
      }

      if (data.hasIssue) {
        const issueResponse = await fetch(
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
              description:
                data.issueDescription?.trim() ||
                "Issue dilaporkan saat dokumentasi",
            }),
          }
        );

        if (!issueResponse.ok) {
          throw new Error(
            "Issue gagal disimpan."
          );
        }
      }

      const newStatus: Status = data.hasIssue
        ? "Has Issue"
        : "Completed";

      setReportIssueCount(data.hasIssue ? 1 : 0);

      setJobs((current) =>
        current.map((job) =>
          no(job) === no(selected)
            ? {
                ...job,
                status: newStatus,
                has_issue: data.hasIssue,
                documentation_status:
                  "COMPLETED",
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
              documentation_status:
                "COMPLETED",
            }
          : current
      );

      setCompletionOpen(true);
      setNotice(
        data.hasIssue
          ? "Dokumentasi dan kendala berhasil disimpan."
          : "Dokumentasi berhasil disimpan. Tugas selesai."
      );
    } catch (error) {
      console.error(error);
      setNotice(
        "Gagal menyimpan data ke database. Silakan coba lagi."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="w-full bg-white dark:bg-[#090f1d] text-[#15213a] dark:text-slate-100 transition-colors">
      <main className="min-h-screen bg-white dark:bg-[#090f1d] transition-colors">
        <div className="mx-auto max-w-[1280px] px-5 pb-10 pt-2 md:px-9">
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

          {screen !== "dashboard" &&
            screen !== "field-agent" &&
            screen !== "tasks" &&
            screen !== "history" && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new Event("field-agent:back")
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Kembali</span>
              </button>
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
              onHandover={() =>
                setScreen("handover")
              }
              onRelease={() => selected && handleReleaseJob(selected)}
              releasing={saving}
            />
          )}

          {screen === "handover" && (
            <Handover
              job={selected}
              back={() =>
                setScreen(isClaimingJob ? "tasks" : "detail")
              }
              next={(payload) =>
                saveWorkflow(
                  "A3-handover",
                  {
                    ...payload,
                    claimJob: isClaimingJob,
                    fieldAgentId: currentAgent.id,
                    performedBy: currentAgent.name,
                  },
                  "documentation"
                )
              }
            />
          )}

          {screen === "documentation" && (
            <Documentation
              back={() =>
                setScreen("handover")
              }
              onDone={handleDocumentationDone}
              saving={saving}
            />
          )}

          {screen === "history" && (
            <HistoryList
              jobs={shown}
              filter={filter}
              query={query}
              setFilter={setFilter}
              setQuery={setQuery}
              openJob={openJob}
            />
          )}
        </div>
      </main>

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
  const complete =
    jobs.filter(
      (j) => j.status === "Completed"
    ).length;

  const issues =
    jobs.filter(
      (j) => j.status === "Has Issue"
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
      value: complete,
      sub: "Tugas selesai (Done)",
      color: "text-emerald-600",
    },
    {
      title: "Has Issue",
      value: issues,
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
    jobs.length > 0 && (complete > 0 || issues > 0)
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
                  jobs.length) *
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
            complete + issues < jobs.length
              ? [`#e2e8f0 ${(complete + issues) / jobs.length * 100}% 100%`]
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

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[460px_minmax(0,1fr)]">
        <section className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Status Task
          </h2>

          <div className="mt-8 flex flex-col items-center">
            <div
              className="relative grid h-[244px] w-[244px] shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(${statusGradient})`,
              }}
              aria-label="Grafik proporsi status task"
            >
              <div className="grid h-[148px] w-[148px] place-items-center rounded-full bg-white dark:bg-[#0f172a] text-center">
                <div>
                  <b className="block text-[28px] leading-none text-[#101a33] dark:text-white">
                    {jobs.length}
                  </b>

                  <span className="mt-2 block text-[13px] font-medium text-slate-500 dark:text-slate-400">
                    Total Task
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-10 w-full min-w-0 space-y-7">
              {statusBreakdown.map(
                (item) => {
                  const percent =
                    jobs.length > 0
                      ? Math.round(
                          (item.value /
                            jobs.length) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      key={item.label}
                      className="grid grid-cols-[minmax(0,1fr)_48px_54px] items-center gap-5 text-[14px]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-4 w-4 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              item.color,
                          }}
                        />

                        <span className="truncate font-bold text-slate-700 dark:text-slate-300">
                          {item.label}
                        </span>
                      </div>

                      <span className="text-center font-extrabold text-slate-950 dark:text-white">
                        {item.value}
                      </span>

                      <span className="text-right text-[12px] font-medium text-slate-500 dark:text-slate-400">
                        ({percent}%)
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs xl:mt-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Recent Jobs
            </h2>

            <button
              onClick={showTasks}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200/80 dark:border-slate-700 bg-[#edf4fb] dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                <tr>
                  <th className="px-3 py-2.5">
                    Job Number
                  </th>

                  <th className="px-3 py-2.5">
                    Customer
                  </th>

                  <th className="px-3 py-2.5">
                    MAWB/HAWB
                  </th>

                  <th className="px-3 py-2.5">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {jobs
                  .slice(0, 4)
                  .map((job) => (
                    <tr
                      key={job.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="px-3 py-3 font-semibold text-blue-600 dark:text-blue-400">
                        <button
                          type="button"
                          className="cursor-pointer hover:underline text-left"
                          onClick={() =>
                            openJob(job)
                          }
                        >
                          {no(job)}
                        </button>
                      </td>

                      <td className="max-w-[140px] px-3 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {job.customer ||
                          "-"}
                      </td>

                      <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                        {mawb(job)}
                      </td>

                      <td className="px-3 py-3">
                        <StatusBadge
                          status={job.status}
                          onClick={() =>
                            openJob(job)
                          }
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
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
}: {
  filter: string;
  counts: Record<string, number>;
  setFilter: (v: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {[
        "All",
        "Completed",
        "Has Issue",
      ].map((tab) => (
        <button
          key={tab}
          onClick={() =>
            setFilter(tab)
          }
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            filter === tab
              ? "border-blue-600 bg-blue-600 text-white shadow-xs"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          {tab}

          <span
            className={`ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              filter === tab
                ? "bg-white/20 text-white"
                : tab === "Has Issue"
                  ? "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400"
                  : tab === "Completed"
                    ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            {counts[tab] || 0}
          </span>
        </button>
      ))}
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
      <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Task
          </h1>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Daftar task yang ditugaskan kepada Anda.
          </p>
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
      </section>

      <Tabs
        filter={filter}
        counts={counts}
        setFilter={setFilter}
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

                <th className="px-4 py-3.5">
                  Problem/Issue (Yes/No)
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
                  MAWB/HAWB
                </th>

                <th className="px-4 py-3.5">
                  Tanggal Penugasan
                </th>

                <th className="px-4 py-3.5">
                  Assigned To
                </th>

                <th className="px-4 py-3.5">
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

                    <td className="px-4 py-3.5">
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
                  </>
                ) : (
                  <>
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

                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {mawb(job)}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                      {job.date || "-"}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                      {job.assigned_to || "-"}
                    </td>

                    <td className="px-4 py-3.5">
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
  releasing,
}: {
  job: Job | null;
  onHandover: () => void;
  onRelease?: () => void;
  releasing?: boolean;
}) {
  if (!job) {
    return (
      <div className="rounded-xl border border-slate-100 p-8">
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

  const steps = [
    [
      "1",
      "Detail Job",
      "Selesai",
    ],
    [
      "2",
      "Handover",
      job.handover_status ===
      "COMPLETED"
        ? "Selesai"
        : "Sedang dikerjakan",
    ],
    [
      "3",
      "Dokumentasi",
      job.documentation_status ===
      "COMPLETED"
        ? "Selesai"
        : "Belum dikerjakan",
    ],
    [
      "4",
      "Complete",
      job.status === "Completed" || job.status === "Has Issue"
        ? "Selesai"
        : "Belum dikerjakan",
    ],
  ];

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Detail Job
          </h1>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Informasi lengkap pekerjaan dan progress pengerjaan.
          </p>
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Progress Tracker
          </h2>

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Workflow Field Agent
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {steps.map(
            ([number, title, caption], index) => (
              <button
                key={title}
                onClick={
                  index === 1
                    ? onHandover
                    : undefined
                }
                className={`flex min-h-[100px] items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                  index === 0
                    ? "border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                    : index === 1
                      ? "border-blue-500 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    index === 0
                      ? "bg-emerald-500 text-white"
                      : index === 1
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300"
                  }`}
                >
                  {index === 0 ? (
                    <Check size={20} />
                  ) : (
                    number
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <b className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                    {title}
                  </b>

                  <small className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    {caption}
                  </small>
                </span>

                <ChevronRight
                  size={16}
                  className="text-slate-400"
                />
              </button>
            )
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <div>
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
          </div>

          <button
            onClick={onHandover}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
          >
            Lanjutkan ke Handover
            <ChevronRight
              size={14}
            />
          </button>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   HANDOVER
========================================================= */

function Handover({
  job,
  back,
  next,
}: {
  job: Job | null;
  back: () => void;
  next: (payload: {
    deliveringParty: string;
    receivingParty: string;
    actualPieces: number;
    actualGrossWeight: number;
    location: string;
  }) => void;
}) {
  const [deliveringParty, setDeliveringParty] = useState("");
  const [receivingParty, setReceivingParty] = useState("");
  const [location, setLocation] = useState(job?.location || "");
  const [actualPieces, setActualPieces] = useState<string>("");
  const [actualGrossWeight, setActualGrossWeight] = useState<string>("");

  const currentTimeDisplay = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const [gps, setGps] =
    useState<{
      latitude: number;
      longitude: number;
      accuracy: number;
      recordedAt: Date;
    } | null>(null);

  const [gpsError, setGpsError] =
    useState("");

  const [recording, setRecording] =
    useState(false);

  const recordGps = () => {
    setRecording(true);
    setGpsError("");

    if (!navigator.geolocation) {
      setGpsError(
        "GPS tidak tersedia."
      );
      setRecording(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude:
            position.coords.latitude,
          longitude:
            position.coords.longitude,
          accuracy:
            position.coords.accuracy,
          recordedAt: new Date(),
        });

        setRecording(false);
      },
      (error) => {
        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          setGpsError(
            "Izin lokasi ditolak."
          );
        } else if (
          error.code ===
          error.TIMEOUT
        ) {
          setGpsError(
            "GPS timeout."
          );
        } else {
          setGpsError(
            "GPS gagal direkam."
          );
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
    ? gps.recordedAt.toLocaleString(
        "id-ID",
        {
          dateStyle: "short",
          timeStyle: "medium",
        }
      )
    : "-";

  const canSubmit = Boolean(
    deliveringParty.trim() &&
    receivingParty.trim() &&
    location.trim() &&
    actualPieces.trim() &&
    Number(actualPieces) > 0 &&
    actualGrossWeight.trim() &&
    Number(actualGrossWeight) > 0
  );

  return (
    <div className="max-w-[1050px] pb-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Handover
      </h1>

      <p className="mt-1 mb-5 text-xs text-slate-500 dark:text-slate-400">
        Isi data penyerah dan penerima serta data aktual kargo.
      </p>

      <div className="grid grid-cols-2 gap-4">
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

      <section className="mt-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <h2 className="mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Detail Handover
        </h2>

        <div className="grid grid-cols-2 gap-4">
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
                placeholder="Masukkan lokasi serah terima..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <button
                onClick={recordGps}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-950/40 px-3 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition cursor-pointer"
              >
                <MapPin
                  size={16}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <h2 className="mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Data Kargo Aktual
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Jumlah Koli (Pieces) *"
            value={actualPieces}
            onChange={setActualPieces}
            type="number"
            placeholder="Contoh: 10"
          />

          <Field
            label="Berat Aktual (kg) *"
            value={actualGrossWeight}
            onChange={setActualGrossWeight}
            type="number"
            placeholder="Contoh: 250"
          />
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <MapPin size={22} />
          </span>

          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Perekaman Lokasi GPS
            </h2>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Lokasi direkam untuk validasi handover.
            </p>
          </div>

          <button
            onClick={recordGps}
            disabled={recording}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/40 px-3.5 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition cursor-pointer disabled:opacity-60"
          >
            <RefreshCw
              size={14}
            />

            {recording
              ? "Merekam GPS..."
              : "Refresh GPS"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <InfoCard
            label="Koordinat"
            value={
              gps
                ? `${gps.latitude.toFixed(
                    5
                  )}, ${gps.longitude.toFixed(
                    5
                  )}`
                : "GPS belum tersedia"
            }
            sub={
              gps
                ? `Akurasi ±${gps.accuracy.toFixed(
                    1
                  )} meter`
                : gpsError ||
                  "Menunggu GPS"
            }
          />

          <InfoCard
            label="Timestamp"
            value={timestamp}
            sub={
              gps
                ? "Timestamp tercatat"
                : "Belum tersedia"
            }
          />

          <InfoCard
            label="Job"
            value={no(job)}
            sub="Field Agent Task"
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <p
            className={`text-xs font-semibold ${
              gps
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <AlertTriangle
              className="mr-2 inline"
              size={16}
            />

            {gps
              ? "GPS berhasil direkam."
              : "Perekaman GPS opsional. Lokasi teks wajib diisi."}
          </p>

          <button
            onClick={() => {
              if (!canSubmit) return;
              next({
                deliveringParty: deliveringParty.trim(),
                receivingParty: receivingParty.trim(),
                actualPieces: Number(actualPieces),
                actualGrossWeight: Number(actualGrossWeight),
                location: location.trim(),
              });
            }}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:shadow-none"
          >
            Simpan & Lanjut
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      <div className="mt-5 flex justify-end">
        <button
          onClick={back}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          Kembali
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   DOCUMENTATION
========================================================= */

function Documentation({
  back,
  onDone,
  saving,
}: {
  back: () => void;
  onDone: (data: {
    photos: string[];
    documents: string[];
    hasIssue: boolean;
    issueDescription?: string;
  }) => void;
  saving?: boolean;
}) {
  const photoLabels = [
    "Keseluruhan Barang",
    "Marking & Shipping Label",
    "Seal / Segel",
    "Area Kerusakan",
  ];

  const [photos, setPhotos] =
    useState<(string | null)[]>([
      null,
      null,
      null,
      null,
    ]);

  const [docs, setDocs] =
    useState<{
      main: string | null;
      supporting: string | null;
    }>({
      main: null,
      supporting: null,
    });

  const [hasProblem, setHasProblem] =
    useState<"no" | "yes">("no");

  const [problemDescription, setProblemDescription] =
    useState("");

  const [uploadError, setUploadError] =
    useState("");

  const filledPhotos =
    photos.filter(Boolean).length;

  const docsReady =
    Boolean(docs.main) &&
    Boolean(docs.supporting);

  const problemReady =
    hasProblem === "no" ||
    (hasProblem === "yes" &&
      problemDescription.trim().length > 0);

  const ready =
    filledPhotos === 4 &&
    docsReady &&
    problemReady;

  const setPhoto = (
    index: number,
    file?: File
  ) => {
    if (!file) {
      return;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      setUploadError(
        "Ukuran foto maksimal 2 MB."
      );
      return;
    }

    setUploadError("");

    setPhotos((current) =>
      current.map((item, i) =>
        i === index
          ? file.name
          : item
      )
    );
  };

  const setDoc = (
    key: "main" | "supporting",
    file?: File
  ) => {
    if (!file) {
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setUploadError(
        "Ukuran dokumen maksimal 10 MB."
      );
      return;
    }

    setUploadError("");

    setDocs((current) => ({
      ...current,
      [key]: file.name,
    }));
  };

  return (
    <div className="w-full pb-7">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Dokumentasi
        </h1>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Upload foto dan dokumen pendukung pekerjaan.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Foto Wajib
            </h2>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {filledPhotos}/4 foto terisi
            </p>
          </div>

          <span className="rounded-full border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
            {filledPhotos}/4
          </span>
        </div>

        {uploadError && (
          <div className="mb-4 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-bold text-red-600 dark:text-red-400">
            <AlertTriangle
              size={14}
              className="mr-2 inline"
            />
            {uploadError}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-4">
          {photoLabels.map(
            (label, index) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 shadow-xs"
              >
                <div className="mb-3 flex items-center justify-between">
                  <b className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {index + 1}. {label}
                  </b>

                  {photos[index] && (
                    <button
                      onClick={() =>
                        setPhotos(
                          (current) =>
                            current.map(
                              (
                                item,
                                i
                              ) =>
                                i ===
                                index
                                  ? null
                                  : item
                            )
                        )
                      }
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2
                        size={14}
                      />
                    </button>
                  )}
                </div>

                <div
                  className={`grid h-[130px] place-items-center rounded-lg border text-center ${
                    photos[index]
                      ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  }`}
                >
                  {photos[index] ? (
                    <div>
                      <Check
                        size={28}
                        className="mx-auto text-emerald-600 dark:text-emerald-400"
                      />

                      <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {photos[index]}
                      </p>
                    </div>
                  ) : (
                    <Camera
                      size={28}
                      className="text-slate-400"
                    />
                  )}
                </div>

                <label className="mt-3 grid h-9 cursor-pointer place-items-center rounded-xl bg-slate-900 dark:bg-slate-700 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-600 transition">
                  <span>
                    <Upload
                      size={14}
                      className="mr-2 inline"
                    />
                    Pilih Foto
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) =>
                      setPhoto(
                        index,
                        event.target
                          .files?.[0]
                      )
                    }
                  />
                </label>
              </div>
            )
          )}
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Dokumen Wajib
        </h2>

        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Upload Dokumen Utama dan Dokumen Pendukung (keduanya wajib).
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <DocumentUpload
            title="Dokumen Utama"
            value={docs.main}
            onChange={(file) =>
              setDoc(
                "main",
                file
              )
            }
            onClear={() =>
              setDocs((current) => ({
                ...current,
                main: null,
              }))
            }
          />

          <DocumentUpload
            title="Dokumen Pendukung"
            value={docs.supporting}
            onChange={(file) =>
              setDoc(
                "supporting",
                file
              )
            }
            onClear={() =>
              setDocs((current) => ({
                ...current,
                supporting: null,
              }))
            }
          />
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Problem / Kendala Lapangan
        </h2>

        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Apakah ada temuan kendala atau kerusakan barang di lapangan?
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
              onChange={(e) =>
                setProblemDescription(e.target.value)
              }
              rows={3}
              placeholder="Jelaskan kendala/issue yang ditemukan di lapangan..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
      </section>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={back}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          Kembali
        </button>

        <button
          onClick={() => {
            if (!ready) return;
            const validPhotos = photos.filter(
              (p): p is string => Boolean(p)
            );
            onDone({
              photos: validPhotos,
              documents: [
                docs.main!,
                docs.supporting!,
              ],
              hasIssue: hasProblem === "yes",
              issueDescription:
                problemDescription.trim(),
            });
          }}
          disabled={!ready || saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600"
        >
          {saving ? "Menyimpan..." : "Done"}
          <Check size={14} />
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
  filter,
  query,
  setFilter,
  setQuery,
  openJob,
}: {
  jobs: Job[];
  filter: string;
  query: string;
  setFilter: (v: string) => void;
  setQuery: (v: string) => void;
  openJob: (j: Job) => void;
}) {
  const counts: Record<
    string,
    number
  > = {
    All: jobs.length,
    Completed: jobs.filter(
      (j) => j.status === "Completed"
    ).length,
    "Has Issue": jobs.filter(
      (j) => j.status === "Has Issue"
    ).length,
  };

  return (
    <>
      <section className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Job History
        </h1>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Riwayat pekerjaan Field Agent.
        </p>
      </section>

      <Tabs
        filter={filter}
        counts={counts}
        setFilter={setFilter}
      />

      <Searchbar
        query={query}
        setQuery={setQuery}
      />

      <JobsTable
        jobs={jobs}
        action={openJob}
        history
      />
    </>
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
            ? "Task Has Issue"
            : "Task Completed"}
        </h2>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Job{" "}
          <b className="font-semibold text-slate-800 dark:text-slate-100">
            {no(job)}
          </b>{" "}
          berhasil diproses.
        </p>

        {hasIssue && (
          <p className="mt-1.5 text-xs font-bold text-red-600 dark:text-red-400">
            {issueCount} finding membutuhkan tindak lanjut Sales Executive.
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
}: {
  title: string;
  value: string | null;
  onChange: (file?: File) => void;
  onClear: () => void;
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

        {value && (
          <button
            onClick={onClear}
            className="text-red-500 hover:text-red-700 cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {value && (
        <div className="mb-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/60">
          <Check
            size={14}
            className="mr-1.5 inline"
          />
          {value}
        </div>
      )}

      <label className="flex h-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
        <Upload
          size={14}
          className="mr-2"
        />

        {value
          ? "Ganti File"
          : "Upload File"}

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
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
