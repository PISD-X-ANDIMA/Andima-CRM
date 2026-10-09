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

type Status =
  | "Assigned"
  | "In Progress"
  | "Completed"
  | "Has Issue"
  | "Draft";

type Screen =
  | "dashboard"
  | "field-agent"
  | "notifications"
  | "tasks"
  | "detail"
  | "handover"
  | "documentation"
  | "verification"
  | "history";

type Job = {
  id: string;
  job_number?: string;
  transaction_number?: string;
  task_title?: string;
  customer?: string;
  shipper?: string;
  consignee?: string;
  mawb?: string;
  mawb_hawb?: string;
  location?: string;
  date?: string;
  status?: Status;
  handover_status?: string;
  actual_cargo?: string;
  documentation_status?: string;
  supporting_documents_status?: string;
  verification_status?: string;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;
};

type ApiTask = {
  id: string;
  job_number?: string;
  transaction_number?: string;
  task_title?: string;
  customer?: string;
  shipper?: string;
  consignee?: string;
  mawb_hawb?: string;
  location?: string;
  status?: string;
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
   SAMPLE DATA
   Dipakai sebagai fallback sementara API belum berhasil.
========================================================= */

const sampleJobs: Job[] = [
  {
    id: "DSVEXP/2605/2551",
    job_number: "DSVEXP/2605/2551",
    transaction_number: "TRX-001",
    task_title: "Pickup Cargo PT DSV",
    customer: "PT DSV Transport Indonesia",
    mawb_hawb: "123-45678901",
    location: "Kantor PT DSV, Jakarta",
    date: "7 Oct 2026 09:00",
    status: "Assigned",
  },
  {
    id: "GEOSEAXP/2605/2551",
    job_number: "GEOSEAXP/2605/2551",
    transaction_number: "TRX-002",
    task_title: "Delivery Cargo Geodis",
    customer: "PT Geodis Freight Forwarding",
    mawb_hawb: "DSV-2506-001",
    location: "Kantor Geodis, Jakarta",
    date: "7 Oct 2026 08:30",
    status: "In Progress",
  },
  {
    id: "MBL/2605/1042",
    job_number: "MBL/2605/1042",
    transaction_number: "TRX-003",
    task_title: "Pickup Cargo Maju Bersama",
    customer: "PT Maju Bersama Logistics",
    mawb_hawb: "789-456321",
    location: "Jakarta",
    date: "6 Oct 2026 10:00",
    status: "Assigned",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const statusClass: Record<string, string> = {
  Assigned:
    "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",

  "In Progress":
    "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60",

  Completed:
    "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60",

  "Has Issue":
    "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60",

  Draft:
    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

const no = (job: Job | null) =>
  job?.job_number || job?.id || "-";

const mawb = (job: Job | null) =>
  job?.mawb || job?.mawb_hawb || "-";

/**
 * Convert status dari database ke status UI.
 *
 * Database:
 * DRAFT
 * IN_PROGRESS
 * COMPLETED
 * HAS_ISSUE
 */
function mapDatabaseStatus(status?: string): Status {
  switch (status) {
    case "DRAFT":
      return "Assigned";

    case "IN_PROGRESS":
      return "In Progress";

    case "COMPLETED":
      return "Completed";

    case "HAS_ISSUE":
      return "Has Issue";

    default:
      return "Assigned";
  }
}

/**
 * Convert response API menjadi object Job
 */
function mapApiJob(task: ApiTask): Job {
  return {
    id: task.id,
    job_number: task.job_number,
    transaction_number: task.transaction_number,
    task_title: task.task_title,
    customer: task.customer,
    shipper: task.shipper,
    consignee: task.consignee,
    mawb_hawb: task.mawb_hawb,
    location: task.location,
    status: mapDatabaseStatus(task.status),
    handover_status: task.handover_status,
    actual_cargo: task.actual_cargo,
    documentation_status: task.documentation_status,
    supporting_documents_status:
      task.supporting_documents_status,
    verification_status: task.verification_status,
    assigned_to: task.assigned_to,
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
  const currentStatus = status || "Assigned";

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
    ${statusClass[currentStatus] || statusClass.Draft}
  `;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Buka detail job"
        className={`${className} cursor-pointer transition hover:brightness-95`}
      >
        {currentStatus}
      </button>
    );
  }

  return (
    <span className={className}>
      {currentStatus}
    </span>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function FieldAgentApp() {
  const [jobs, setJobs] = useState<Job[]>(sampleJobs);

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
    useState<Job | null>(sampleJobs[0]);

  const [filter, setFilter] = useState("All");

  const [query, setQuery] = useState("");

  const [issueOpen, setIssueOpen] =
    useState(false);

  const [confirmReportOpen, setConfirmReportOpen] =
    useState(false);

  const [processingOpen, setProcessingOpen] =
    useState(false);

  const [completionOpen, setCompletionOpen] =
    useState(false);

  const [reportIssueCount, setReportIssueCount] =
    useState(0);

  const [category, setCategory] =
    useState("Damaged Package");

  const [description, setDescription] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [notice, setNotice] =
    useState("");

  /* =======================================================
     LOAD DATA FROM SUPABASE THROUGH API
  ======================================================= */

  useEffect(() => {
    const loadA3Tasks = async () => {
      try {
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
            `HTTP ${response.status}`
          );
        }

        const result = await response.json();

        console.log(
          "A3 TASK API RESPONSE:",
          result
        );

        if (
          !result.success ||
          !Array.isArray(result.data)
        ) {
          throw new Error(
            "Format response API A3 tidak valid."
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

        setNotice(
          "Data dari API gagal dimuat. Menampilkan data sementara."
        );

        setTimeout(() => {
          setNotice("");
        }, 3500);
      }
    };

    loadA3Tasks();
  }, []);

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
      verification: "documentation",
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

      Assigned: jobs.filter(
        (j) =>
          j.status === "Assigned" ||
          j.status === "Draft"
      ).length,

      "In Progress": jobs.filter(
        (j) =>
          j.status === "In Progress"
      ).length,

      Completed: jobs.filter(
        (j) =>
          j.status === "Completed"
      ).length,

      "Has Issue": jobs.filter(
        (j) =>
          j.status === "Has Issue"
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
        filter === "All" ||
        (
          filter === "Assigned"
            ? job.status === "Assigned" ||
              job.status === "Draft"
            : job.status === filter
        );

      const searchText = `
        ${no(job)}
        ${job.customer || ""}
        ${mawb(job)}
        ${job.task_title || ""}
        ${job.transaction_number || ""}
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
            category,
            description:
              description ||
              "Issue reported by field agent",
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
        throw new Error(
          "Workflow gagal disimpan."
        );
      }

      setScreen(next);

      setNotice(
        "Data berhasil disimpan."
      );
    } catch (error) {
      console.error(error);

      setScreen(next);

      setNotice(
        "Halaman berikutnya tetap dibuka, tetapi data belum berhasil disimpan."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     REPORT
  ======================================================= */

  const openReportConfirm = (
    issueCount: number
  ) => {
    setReportIssueCount(issueCount);
    setConfirmReportOpen(true);
    setNotice("");
  };

  const completeTask = async () => {
    if (!selected) {
      return;
    }

    setConfirmReportOpen(false);
    setProcessingOpen(true);
    setSaving(true);

    const hasIssue =
      reportIssueCount > 0;

    try {
      const response = hasIssue
        ? await fetch(
            "/api/feature/A3-issues",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                jobNumber: no(selected),
                category:
                  "Final Verification Finding",
                classification: "Urgent",
                description: `${reportIssueCount} checklist item bertanda issue pada verifikasi akhir.`,
              }),
            }
          )
        : await fetch(
            "/api/feature/A3-verification",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                jobNumber: no(selected),
                documentVerification:
                  "Sesuai",
                packageCondition:
                  "Baik",
                airlineStandard:
                  "Sesuai",
                dangerousGoods:
                  false,
                specialHandling: [],
              }),
            }
          );

      if (!response.ok) {
        throw new Error(
          "Report gagal dikirim."
        );
      }

      const newStatus: Status =
        hasIssue
          ? "Has Issue"
          : "Completed";

      setJobs((current) =>
        current.map((job) =>
          no(job) === no(selected)
            ? {
                ...job,
                status: newStatus,
              }
            : job
        )
      );

      setSelected((current) =>
        current
          ? {
              ...current,
              status: newStatus,
            }
          : current
      );
    } catch (error) {
      console.error(error);

      setNotice(
        "Laporan belum berhasil disimpan ke database."
      );
    } finally {
      setSaving(false);
      setProcessingOpen(false);
      setCompletionOpen(true);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="w-full bg-white dark:bg-[#090f1d] text-[#15213a] dark:text-slate-100 transition-colors">
      <main className="min-h-screen bg-white dark:bg-[#090f1d] transition-colors">
        <div className="mx-auto max-w-[1280px] px-5 pb-10 pt-2 md:px-9">
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
            />
          )}

          {screen === "detail" && (
            <JobDetail
              job={selected}
              onHandover={() =>
                setScreen("handover")
              }
            />
          )}

          {screen === "handover" && (
            <Handover
              job={selected}
              back={() =>
                setScreen("detail")
              }
              next={() =>
                saveWorkflow(
                  "A3-handover",
                  {
                    deliveringParty:
                      "Budi Santoso",
                    receivingParty:
                      "Andi Pratama",
                    actualPieces: 10,
                    actualGrossWeight: 250,
                    location:
                      selected?.location ||
                      "Jakarta",
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
              next={() =>
                saveWorkflow(
                  "A3-documentation",
                  {
                    photos: [
                      "Box 1",
                      "Pallet Side",
                      "Loading Area",
                      "Seal & Wrap",
                    ],
                    documents: [
                      "PackingList_DSV.pdf",
                      "Invoice_DSV.pdf",
                    ],
                  },
                  "verification"
                )
              }
            />
          )}

          {screen === "verification" && (
            <Verification
              back={() =>
                setScreen("documentation")
              }
              next={openReportConfirm}
              onIssue={() =>
                setIssueOpen(true)
              }
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
          category={category}
          description={description}
          setCategory={setCategory}
          setDescription={setDescription}
          close={() =>
            setIssueOpen(false)
          }
          save={saveIssue}
          saving={saving}
        />
      )}

      {confirmReportOpen && (
        <ReportConfirmModal
          job={selected}
          issueCount={reportIssueCount}
          close={() =>
            setConfirmReportOpen(false)
          }
          confirm={completeTask}
          saving={saving}
        />
      )}

      {processingOpen && (
        <ReportProcessingModal
          issueCount={
            reportIssueCount
          }
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
    (j) => j.status === "Has Issue" || j.status === "Assigned"
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
  const inProgress =
    jobs.filter(
      (j) => j.status === "In Progress"
    ).length;

  const complete =
    jobs.filter(
      (j) => j.status === "Completed"
    ).length;

  const issues =
    jobs.filter(
      (j) => j.status === "Has Issue"
    ).length;

  const assigned =
    jobs.filter(
      (j) =>
        j.status === "Assigned" ||
        j.status === "Draft"
    ).length;

  const cards = [
    {
      title: "Total Task",
      value: jobs.length,
      sub: "+2 dari minggu lalu",
      color: "text-emerald-600",
    },
    {
      title: "In Progress",
      value: inProgress,
      sub: `${Math.min(
        inProgress,
        2
      )} sedang dikerjakan`,
      color: "text-cyan-600",
    },
    {
      title: "Completed",
      value: complete,
      sub: "+3 dari minggu lalu",
      color: "text-emerald-600",
    },
    {
      title: "Has Issue",
      value: issues,
      sub: "+1 dari minggu lalu",
      color: "text-red-500",
    },
  ];

  const statusBreakdown = [
    {
      label: "Assigned",
      value: assigned,
      color: "#3b82f6",
    },
    {
      label: "In Progress",
      value: inProgress,
      color: "#0284c7",
    },
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
    jobs.length > 0
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
          .stops.join(", ")
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        "Assigned",
        "In Progress",
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
}: {
  jobs: Job[];
  filter: string;
  counts: Record<string, number>;
  query: string;
  setFilter: (v: string) => void;
  setQuery: (v: string) => void;
  openJob: (j: Job) => void;
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
                {history
                  ? "Tanggal"
                  : "Tanggal Penugasan"}
              </th>

              <th className="px-4 py-3.5">
                Assigned To
              </th>

              <th className="px-4 py-3.5">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedJobs.map((job) => (
              <tr
                key={job.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
              >
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
}: {
  job: Job | null;
  onHandover: () => void;
}) {
  if (!job) {
    return (
      <div className="rounded-xl border border-slate-100 p-8">
        Job tidak ditemukan.
      </div>
    );
  }

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
    [
      "Verification",
      job.verification_status ||
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
      "Verifikasi",
      job.verification_status ===
      "COMPLETED"
        ? "Selesai"
        : "Belum dikerjakan",
    ],
    [
      "5",
      "Complete",
      job.status === "Completed"
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

        <div className="grid gap-4 lg:grid-cols-5">
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

        <div className="mt-7 flex justify-end">
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
  next: () => void;
}) {
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
          name="Budi Santoso"
        />

        <PersonCard
          title="Data Penerima"
          dot="bg-emerald-500"
          name="Andi Pratama"
        />
      </div>

      <section className="mt-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <h2 className="mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Detail Handover
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Waktu Serah Terima *"
            value=""
          />

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Lokasi Serah Terima *
            </label>

            <div className="flex gap-2">
              <input
                defaultValue={
                  job?.location ||
                  "Jakarta"
                }
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
            value="10"
          />

          <Field
            label="Berat Aktual (kg) *"
            value="250"
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
                : "text-red-500 dark:text-red-400"
            }`}
          >
            <AlertTriangle
              className="mr-2 inline"
              size={16}
            />

            {gps
              ? "GPS berhasil direkam."
              : "Rekam GPS sebelum melanjutkan."}
          </p>

          <button
            onClick={next}
            disabled={!gps}
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
  next,
}: {
  back: () => void;
  next: () => void;
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
    useState({
      packing: null as string | null,
      invoice: null as string | null,
    });

  const [uploadError, setUploadError] =
    useState("");

  const filledPhotos =
    photos.filter(Boolean).length;

  const ready =
    filledPhotos === 4 &&
    Boolean(docs.packing) &&
    Boolean(docs.invoice);

  const setPhoto = (
    index: number,
    file?: File
  ) => {
    if (
      file &&
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
      current.map(
        (item, i) =>
          i === index
            ? file?.name ||
              `Foto ${index + 1}.jpg`
            : item
      )
    );
  };

  const setDoc = (
    key: "packing" | "invoice",
    file?: File
  ) => {
    if (
      file &&
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
      [key]:
        file?.name ||
        (key === "packing"
          ? "PackingList.pdf"
          : "Invoice.pdf"),
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
          Packing List dan Commercial Invoice.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <DocumentUpload
            title="Packing List"
            value={docs.packing}
            onChange={(file) =>
              setDoc(
                "packing",
                file
              )
            }
            onClear={() =>
              setDocs((current) => ({
                ...current,
                packing: null,
              }))
            }
          />

          <DocumentUpload
            title="Commercial Invoice"
            value={docs.invoice}
            onChange={(file) =>
              setDoc(
                "invoice",
                file
              )
            }
            onClear={() =>
              setDocs((current) => ({
                ...current,
                invoice: null,
              }))
            }
          />
        </div>
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
          onClick={next}
          disabled={!ready}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600"
        >
          Simpan & Lanjut ke Verifikasi
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   VERIFICATION
========================================================= */

function Verification({
  back,
  next,
  onIssue,
}: {
  back: () => void;
  next: (issueCount: number) => void;
  onIssue: () => void;
}) {
  const items = [
    [
      "Kesesuaian Dokumen",
      "Packing list, invoice, dan dokumen sesuai.",
    ],
    [
      "Kondisi Visual Barang",
      "Tidak ada kerusakan pada kemasan.",
    ],
    [
      "Standar Maskapai",
      "Sesuai ketentuan maskapai.",
    ],
    [
      "Dangerous Goods",
      "Label dan dokumen DG sesuai.",
    ],
    [
      "Special Handling",
      "Penanganan khusus sesuai.",
    ],
  ];

  const [checked, setChecked] =
    useState<
      ("unset" | "ok" | "issue")[]
    >(
      items.map(() => "unset")
    );

  const checkedCount =
    checked.filter(
      (value) =>
        value !== "unset"
    ).length;

  const issueCount =
    checked.filter(
      (value) =>
        value === "issue"
    ).length;

  const ready =
    checkedCount ===
    items.length;

  const setVerification = (
    index: number,
    value: "ok" | "issue"
  ) => {
    setChecked((current) =>
      current.map(
        (item, i) =>
          i === index
            ? value
            : item
      )
    );

    if (value === "issue") {
      onIssue();
    }
  };

  return (
    <div className="w-full pb-7">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Tahap 3
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Verifikasi
        </h1>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Pastikan seluruh checklist sesuai standar pengiriman.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Final Checklist
            </h2>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {checkedCount}/{items.length} item dicek
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${
              issueCount
                ? "border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                : ready
                  ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                  : "border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
            }`}
          >
            {issueCount
              ? `${issueCount} Issue`
              : `${checkedCount}/${items.length}`}
          </span>
        </div>

        <div className="grid gap-4">
          {items.map(
            ([title, description], index) => (
              <div
                key={title}
                className={`rounded-xl border p-4 transition-colors ${
                  checked[index] === "ok"
                    ? "border-emerald-400 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/30"
                    : checked[index] === "issue"
                      ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      checked[index] === "ok"
                        ? "bg-emerald-500 text-white"
                        : checked[index] === "issue"
                          ? "bg-red-500 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300"
                    }`}
                  >
                    {checked[index] === "issue" ? (
                      <AlertTriangle
                        size={18}
                      />
                    ) : (
                      <Check size={18} />
                    )}
                  </span>

                  <div className="flex-1">
                    <b className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                      {title}
                    </b>

                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {description}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setVerification(
                          index,
                          "ok"
                        )
                      }
                      className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                    >
                      Sesuai
                    </button>

                    <button
                      onClick={() =>
                        setVerification(
                          index,
                          "issue"
                        )
                      }
                      className="rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                    >
                      Ada Issue
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onIssue}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition cursor-pointer"
        >
          <AlertTriangle
            size={14}
          />
          Laporkan Finding / Issue
        </button>

        <div className="flex gap-3">
          <button
            onClick={back}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            Kembali
          </button>

          <button
            onClick={() =>
              next(issueCount)
            }
            disabled={!ready}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600"
          >
            <Send size={14} />
            {issueCount
              ? "Kirim Laporan Has Issue"
              : "Kirim Laporan"}
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
    Assigned: jobs.filter(
      (j) => j.status === "Assigned"
    ).length,
    "In Progress": jobs.filter(
      (j) => j.status === "In Progress"
    ).length,
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
  category,
  description,
  setCategory,
  setDescription,
  close,
  save,
  saving,
}: {
  category: string;
  description: string;
  setCategory: (v: string) => void;
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
              Kategori
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option className="dark:bg-slate-900">
                Damaged Package
              </option>

              <option className="dark:bg-slate-900">
                Quantity Mismatch
              </option>

              <option className="dark:bg-slate-900">
                Document Missing
              </option>

              <option className="dark:bg-slate-900">
                Vehicle Breakdown
              </option>

              <option className="dark:bg-slate-900">
                Location Issue
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Deskripsi
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
            disabled={saving}
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
   SMALL COMPONENTS
========================================================= */

function PersonCard({
  title,
  dot,
  name,
}: {
  title: string;
  dot: string;
  name: string;
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
      />

      <Field
        label="Perusahaan *"
        value="PT DSV Transport Indonesia"
      />
    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>

      <input
        defaultValue={value}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
