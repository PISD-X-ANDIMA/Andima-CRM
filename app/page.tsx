"use client";

import { useEffect, useMemo, useState } from "react";
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
  Info,
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
    "bg-amber-50 text-amber-700 border-amber-200",

  "In Progress":
    "bg-blue-50 text-blue-700 border-blue-200",

  Completed:
    "bg-emerald-50 text-emerald-700 border-emerald-200",

  "Has Issue":
    "bg-red-50 text-red-700 border-red-200",

  Draft:
    "bg-slate-100 text-slate-600 border-slate-200",
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
function mapApiJob(task: any): Job {
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
    whitespace-nowrap
    rounded-full
    border
    px-3
    py-1
    text-[11px]
    font-bold
    ${statusClass[currentStatus]}
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

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>(sampleJobs);

  const [screen, setScreen] =
    useState<Screen>("dashboard");

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
      tasks: "dashboard",
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
    <div className="min-h-screen bg-white text-[#15213a]">
      <Sidebar
        screen={screen}
        navigate={setScreen}
      />

      <main className="ml-[224px] min-h-screen bg-white">
        <Topbar screen={screen} />

        <div className="mx-auto max-w-[1280px] px-5 pb-10 pt-5 md:px-9">

          {screen === "dashboard" && (
            <Dashboard
              jobs={jobs}
              openJob={openJob}
              showTasks={() =>
                setScreen("tasks")
              }
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
            setScreen("history");
          }}
        />
      )}

      {notice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg">
          {notice}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  screen,
  navigate,
}: {
  screen: Screen;
  navigate: (s: Screen) => void;
}) {
  const active =
    screen === "dashboard"
      ? "dashboard"
      : screen === "history"
        ? "history"
        : "tasks";

  const linkClass = (
    isActive = false
  ) =>
    `flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[12px] font-bold ${
      isActive
        ? "bg-[#2d6df6] text-white"
        : "text-white/78 hover:bg-white/10 hover:text-white"
    }`;

  const subLinkClass = (
    isActive: boolean
  ) =>
    `block w-full rounded-lg px-3 py-2 text-left text-[12px] font-semibold ${
      isActive
        ? "bg-white text-[#173057]"
        : "text-white/62 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[224px] flex-col border-r border-[#173a68] bg-[#0d2d55] text-white shadow-lg">
      <div className="px-5 pb-5 pt-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-4">
          <div className="text-[16px] font-extrabold">
            ANDIMA
            <br />
            TRANSPORTINDO
          </div>

          <div className="mt-3 border-t border-white/10 pt-3 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/45">
            Enterprise Digital Ecosystem
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4">
        <button
          onClick={() =>
            navigate("dashboard")
          }
          className={linkClass(
            active === "dashboard"
          )}
        >
          <LayoutDashboard size={17} />
          Dashboard
        </button>

        <button
          className={linkClass()}
        >
          <Users size={17} />
          CCR
        </button>

        <div className="rounded-xl bg-[#2166ef] p-1">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[12px] font-bold text-white">
            <ClipboardCheck size={17} />
            CRM
            <ChevronDown
              size={15}
              className="ml-auto"
            />
          </button>
        </div>

        <div className="ml-4 space-y-1 border-l border-white/15 py-2 pl-4">
          <p className="px-3 py-1 text-[11px] font-semibold text-white/45">
            Sales Executive
          </p>

          <p className="px-3 py-1 text-[12px] font-extrabold text-white">
            Field Agent
          </p>

          <button
            onClick={() =>
              navigate("tasks")
            }
            className={subLinkClass(
              active === "tasks"
            )}
          >
            My Task
          </button>

          <button
            onClick={() =>
              navigate("history")
            }
            className={subLinkClass(
              active === "history"
            )}
          >
            Job History
          </button>
        </div>

        <button
          className={linkClass()}
        >
          <Users size={17} />
          HRMS
        </button>
      </nav>

      <div className="px-4 pb-5">
        <button className="w-full rounded-xl border border-rose-400/45 bg-rose-500/10 px-4 py-3 text-left text-[12px] font-extrabold text-rose-100">
          Logout
        </button>
      </div>
    </aside>
  );
}

/* =========================================================
   TOPBAR
========================================================= */

function Topbar({
  screen,
}: {
  screen: Screen;
}) {
  const labels: Record<
    Screen,
    string[]
  > = {
    dashboard: [
      "CRM",
      "SALES EXECUTIVE",
      "TASK FIELD AGENT",
    ],
    tasks: [
      "CRM",
      "Field Agent",
      "My Task",
    ],
    detail: [
      "CRM",
      "Field Agent",
      "My Task",
      "Detail Job",
    ],
    handover: [
      "CRM",
      "Field Agent",
      "My Task",
      "Detail Job",
      "Handover",
    ],
    documentation: [
      "CRM",
      "Field Agent",
      "My Task",
      "Detail Job",
      "Dokumentasi",
    ],
    verification: [
      "CRM",
      "Field Agent",
      "My Task",
      "Detail Job",
      "Verifikasi",
    ],
    history: [
      "CRM",
      "Field Agent",
      "Job History",
    ],
  };

  return (
    <header className="flex h-[67px] items-center justify-between border-b border-slate-100 px-9">
      <div className="flex items-center gap-3">
        {screen !== "dashboard" && (
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new Event(
                  "field-agent:back"
                )
              )
            }
            className="grid h-9 w-9 place-items-center rounded-md text-[#173057] hover:bg-slate-100"
          >
            <ArrowLeft
              size={24}
            />
          </button>
        )}

        <div className="flex gap-2 text-[10px] font-medium text-slate-500">
          {labels[screen].map(
            (label, index) => (
              <span
                key={`${label}-${index}`}
                className={
                  index ===
                  labels[screen].length - 1
                    ? "text-[#2764e8]"
                    : ""
                }
              >
                {index > 0 && (
                  <span className="mr-2 text-slate-400">
                    /
                  </span>
                )}
                {label}
              </span>
            )
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative rounded-full bg-slate-100 p-2.5">
          <Bell
            size={19}
            className="text-slate-500"
          />
          <i className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </div>

        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
            R
          </span>

          <div className="text-[10px]">
            <b className="block">
              Rian
            </b>
            <span className="text-slate-400">
              Field Agent
            </span>
          </div>

          <ChevronDown
            size={15}
            className="text-slate-400"
          />
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

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
    [
      "Total Task",
      jobs.length,
      "Total task dari database",
      "text-slate-600",
    ],
    [
      "Assigned",
      assigned,
      "Task yang belum dikerjakan",
      "text-amber-600",
    ],
    [
      "In Progress",
      inProgress,
      "Sedang dikerjakan",
      "text-blue-600",
    ],
    [
      "Completed",
      complete,
      "Task selesai",
      "text-emerald-600",
    ],
    [
      "Has Issue",
      issues,
      "Perlu perhatian",
      "text-red-500",
    ],
  ];

  return (
    <>
      <section className="mb-5">
        <h1 className="text-[21px] font-extrabold">
          Dashboard Field Agent
        </h1>

        <p className="text-[12px] text-slate-500">
          Ringkasan pekerjaan dan
          status Anda hari ini.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map(
          ([
            title,
            value,
            sub,
            color,
          ]) => (
            <button
              key={String(title)}
              onClick={showTasks}
              className="rounded-xl border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow"
            >
              <p className="text-[12px] font-bold text-slate-600">
                {title}
              </p>

              <b className="mt-5 block text-[25px]">
                {value}
              </b>

              <p
                className={`mt-2 text-[10px] font-bold ${color}`}
              >
                {sub}
              </p>
            </button>
          )
        )}
      </div>

      <section className="mt-7 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[14px] font-extrabold">
            Recent Jobs
          </h2>

          <button
            onClick={showTasks}
            className="text-[11px] font-bold text-blue-600"
          >
            Lihat Semua
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="border-b border-slate-100 text-[10px] text-slate-500">
              <tr>
                <th className="pb-3">
                  Job Number
                </th>

                <th className="pb-3">
                  Customer
                </th>

                <th className="pb-3">
                  MAWB/HAWB
                </th>

                <th className="pb-3">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {jobs
                .slice(0, 5)
                .map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-slate-50"
                  >
                    <td className="py-4 font-bold text-blue-600">
                      <button
                        onClick={() =>
                          openJob(job)
                        }
                      >
                        {no(job)}
                      </button>
                    </td>

                    <td>
                      {job.customer ||
                        "-"}
                    </td>

                    <td className="text-slate-500">
                      {mawb(job)}
                    </td>

                    <td>
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
    <div className="mb-5 flex flex-wrap gap-2">
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
          className={`rounded-md border px-3 py-2 text-[11px] font-bold ${
            filter === tab
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-100 bg-white text-slate-600"
          }`}
        >
          {tab}

          <span
            className={`ml-1 rounded px-1.5 py-0.5 ${
              filter === tab
                ? "bg-blue-800/40"
                : tab === "Has Issue"
                  ? "bg-red-100 text-red-600"
                  : "bg-slate-100"
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
    <div className="mb-5 flex rounded-lg border border-slate-100 bg-white p-2">
      <label className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-3 text-slate-500"
        />

        <input
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          placeholder="Search Job Number, Customer, atau MAWB/HAWB"
          className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-2 text-[11px] outline-none focus:border-blue-400"
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
        <h1 className="text-[20px] font-extrabold">
          My Task
        </h1>

        <p className="text-[12px] text-slate-500">
          Daftar task yang ditugaskan
          kepada Anda.
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
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-[12px]">
          <thead className="bg-[#eff5fa] text-slate-600">
            <tr>
              <th className="px-4 py-4">
                Job Number
              </th>

              <th className="px-4 py-4">
                Customer
              </th>

              <th className="px-4 py-4">
                MAWB/HAWB
              </th>

              <th className="px-4 py-4">
                {history
                  ? "Tanggal"
                  : "Tanggal Penugasan"}
              </th>

              <th className="px-4 py-4">
                Assigned To
              </th>

              <th className="px-4 py-4">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="border-t border-slate-100"
              >
                <td className="px-4 py-5 font-bold text-blue-600">
                  {action ? (
                    <button
                      onClick={() =>
                        action(job)
                      }
                    >
                      {no(job)}
                    </button>
                  ) : (
                    no(job)
                  )}
                </td>

                <td className="px-4 py-5 font-medium">
                  {job.customer || "-"}
                </td>

                <td className="px-4 py-5 text-slate-500">
                  {mawb(job)}
                </td>

                <td className="px-4 py-5 text-slate-600">
                  {job.date || "-"}
                </td>

                <td className="px-4 py-5 text-slate-600">
                  {job.assigned_to || "-"}
                </td>

                <td className="px-4 py-5">
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
        <div className="p-10 text-center text-sm text-slate-500">
          Tidak ada task yang sesuai.
        </div>
      )}

      <div className="flex items-center justify-between bg-[#f7fafc] px-4 py-4 text-[11px] text-slate-500">
        <span>
          Showing {jobs.length} task
        </span>
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
    <div className="rounded-2xl bg-[#f6f9fc] p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold">
            Detail Job
          </h1>

          <p className="text-[14px] text-slate-500">
            Informasi lengkap pekerjaan
            dan progress pengerjaan.
          </p>
        </div>

        <StatusBadge
          status={job.status}
        />
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
        <h2 className="mb-6 text-[20px] font-extrabold">
          Informasi Job
        </h2>

        <div className="grid gap-x-10 gap-y-1 lg:grid-cols-2">
          {info.map(
            ([label, value]) => (
              <div
                className="grid grid-cols-[180px_1fr] border-b border-slate-100 py-4"
                key={label}
              >
                <span className="text-slate-500">
                  {label}
                </span>

                <b className="text-right leading-6">
                  {value}
                </b>
              </div>
            )
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[20px] font-extrabold">
            Progress Tracker
          </h2>

          <span className="text-[13px] font-semibold text-slate-500">
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
                className={`flex min-h-[100px] items-center gap-4 rounded-xl border p-4 text-left ${
                  index === 0
                    ? "border-emerald-400 bg-emerald-50"
                    : index === 1
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[17px] font-extrabold ${
                    index === 0
                      ? "bg-emerald-500 text-white"
                      : index === 1
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {index === 0 ? (
                    <Check size={22} />
                  ) : (
                    number
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <b className="block text-[14px]">
                    {title}
                  </b>

                  <small className="mt-1 block text-[11px]">
                    {caption}
                  </small>
                </span>

                <ChevronRight
                  size={17}
                />
              </button>
            )
          )}
        </div>

        <div className="mt-7 flex justify-end">
          <button
            onClick={onHandover}
            className="primary"
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
    <div className="max-w-[1050px] bg-[#f7fafc] px-5 pb-6">
      <h1 className="pt-4 text-[18px] font-extrabold">
        Handover
      </h1>

      <p className="mb-4 text-[11px] text-slate-500">
        Isi data penyerah dan
        penerima serta data aktual
        kargo.
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

      <section className="form-card mt-5">
        <h2>Detail Handover</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Waktu Serah Terima *"
            value=""
          />

          <div>
            <label>
              Lokasi Serah Terima *
            </label>

            <div className="flex gap-2">
              <input
                defaultValue={
                  job?.location ||
                  "Jakarta"
                }
              />

              <button
                onClick={recordGps}
                className="rounded border border-slate-200 bg-blue-50 px-3 text-blue-600"
              >
                <MapPin
                  size={16}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="form-card mt-5">
        <h2>Data Kargo Aktual</h2>

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

      <section className="mt-5 rounded-[18px] border border-[#e4eaf2] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-[43px] w-[43px] place-items-center rounded-xl bg-[#eef7ff] text-blue-600">
            <MapPin size={24} />
          </span>

          <div className="flex-1">
            <h2 className="text-[16px] font-extrabold">
              Perekaman Lokasi GPS
            </h2>

            <p className="text-[11px] text-slate-500">
              Lokasi direkam untuk
              validasi handover.
            </p>
          </div>

          <button
            onClick={recordGps}
            disabled={recording}
            className="rounded-xl border border-blue-100 bg-[#f4faff] px-4 py-2 text-[11px] font-bold text-blue-600 disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className="mr-1 inline"
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

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <p
            className={`text-[11px] font-bold ${
              gps
                ? "text-emerald-600"
                : "text-red-500"
            }`}
          >
            <AlertTriangle
              className="mr-2 inline"
              size={17}
            />

            {gps
              ? "GPS berhasil direkam."
              : "Rekam GPS sebelum melanjutkan."}
          </p>

          <button
            onClick={next}
            disabled={!gps}
            className="primary disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            Simpan & Lanjut
            <ChevronRight size={17} />
          </button>
        </div>
      </section>

      <div className="mt-5 flex justify-end">
        <button
          onClick={back}
          className="secondary"
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
    <div className="w-full bg-[#f7fbff] pb-7">
      <div className="mb-5">
        <h1 className="text-[24px] font-extrabold">
          Dokumentasi
        </h1>

        <p className="mt-1 text-[12px] text-slate-600">
          Upload foto dan dokumen
          pendukung pekerjaan.
        </p>
      </div>

      <section className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-extrabold">
              Foto Wajib
            </h2>

            <p className="text-[12px] text-slate-500">
              {filledPhotos}/4 foto terisi
            </p>
          </div>

          <span className="rounded-xl bg-blue-50 px-4 py-2 text-[11px] font-bold text-blue-600">
            {filledPhotos}/4
          </span>
        </div>

        {uploadError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] font-bold text-red-600">
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
                className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <b className="text-[12px]">
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
                      className="text-red-500"
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
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  {photos[index] ? (
                    <div>
                      <Check
                        size={30}
                        className="mx-auto text-emerald-600"
                      />

                      <p className="mt-2 text-[10px] text-slate-600">
                        {photos[index]}
                      </p>
                    </div>
                  ) : (
                    <Camera
                      size={30}
                      className="text-slate-400"
                    />
                  )}
                </div>

                <label className="mt-3 grid h-9 cursor-pointer place-items-center rounded-lg bg-[#061833] text-[11px] font-bold text-white">
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

      <section className="mt-5 rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
        <h2 className="text-[15px] font-extrabold">
          Dokumen Wajib
        </h2>

        <p className="mt-1 text-[12px] text-slate-500">
          Packing List dan Commercial
          Invoice.
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
          className="secondary"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>

        <button
          onClick={next}
          disabled={!ready}
          className="primary disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          Simpan & Lanjut ke Verifikasi
          <ChevronRight size={15} />
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
    <div className="w-full rounded-2xl bg-[#f7fafc] p-6">
      <div className="mb-6">
        <p className="text-[13px] font-extrabold uppercase text-blue-700">
          Tahap 3
        </p>

        <h1 className="mt-1 text-[26px] font-extrabold">
          Verifikasi
        </h1>

        <p className="mt-1 text-[14px] text-slate-500">
          Pastikan seluruh checklist
          sesuai.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-extrabold">
              Final Checklist
            </h2>

            <p className="text-[12px] text-slate-500">
              {checkedCount}/
              {items.length} item dicek
            </p>
          </div>

          <span
            className={`rounded-xl border px-4 py-3 text-[12px] font-extrabold ${
              issueCount
                ? "border-red-200 bg-red-50 text-red-600"
                : ready
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
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
                className={`rounded-xl border p-5 ${
                  checked[index] === "ok"
                    ? "border-emerald-400 bg-emerald-50/30"
                    : checked[index] ===
                        "issue"
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-xl ${
                      checked[index] ===
                      "ok"
                        ? "bg-emerald-500 text-white"
                        : checked[index] ===
                            "issue"
                          ? "bg-red-500 text-white"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {checked[index] ===
                    "issue" ? (
                      <AlertTriangle
                        size={20}
                      />
                    ) : (
                      <Check size={20} />
                    )}
                  </span>

                  <div className="flex-1">
                    <b className="block text-[15px]">
                      {title}
                    </b>

                    <p className="mt-1 text-[12px] text-slate-500">
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
                      className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[11px] font-bold text-emerald-700"
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
                      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] font-bold text-red-600"
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
          className="rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-[12px] font-extrabold text-red-600"
        >
          <AlertTriangle
            size={16}
            className="mr-2 inline"
          />
          Laporkan Finding / Issue
        </button>

        <div className="flex gap-3">
          <button
            onClick={back}
            className="secondary"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>

          <button
            onClick={() =>
              next(issueCount)
            }
            disabled={!ready}
            className="primary disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            <Send size={16} />
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
        <h1 className="text-[20px] font-extrabold">
          Job History
        </h1>

        <p className="text-[12px] text-slate-500">
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
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-[18px] font-extrabold">
              Laporkan Issue
            </h2>

            <p className="text-[11px] text-slate-500">
              Catat finding dari lapangan.
            </p>
          </div>

          <button
            onClick={close}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="text-[12px] font-bold">
              Kategori
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm"
            >
              <option>
                Damaged Package
              </option>

              <option>
                Quantity Mismatch
              </option>

              <option>
                Document Missing
              </option>

              <option>
                Vehicle Breakdown
              </option>

              <option>
                Location Issue
              </option>
            </select>
          </div>

          <div>
            <label className="text-[12px] font-bold">
              Deskripsi
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              rows={5}
              placeholder="Jelaskan issue yang ditemukan..."
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5">
          <button
            onClick={close}
            className="secondary"
          >
            Batal
          </button>

          <button
            onClick={save}
            disabled={saving}
            className="primary disabled:bg-slate-300"
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
      <div className="w-full max-w-[700px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div
          className={`border-b px-7 py-7 ${
            hasIssue
              ? "border-red-100 bg-red-50"
              : "border-blue-100 bg-blue-50"
          }`}
        >
          <div className="flex items-center gap-4">
            <span
              className={`grid h-14 w-14 place-items-center rounded-xl text-white ${
                hasIssue
                  ? "bg-red-600"
                  : "bg-blue-600"
              }`}
            >
              {hasIssue ? (
                <AlertTriangle
                  size={28}
                />
              ) : (
                <Send size={28} />
              )}
            </span>

            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">
                Penyelesaian Task
              </p>

              <h2 className="mt-1 text-[22px] font-extrabold">
                Konfirmasi Pengiriman
                Laporan
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-7">
          <div
            className={`rounded-xl border p-5 ${
              hasIssue
                ? "border-red-200 bg-red-50"
                : "border-blue-200 bg-blue-50"
            }`}
          >
            {hasIssue ? (
              <>
                <h3 className="font-extrabold text-red-800">
                  Task memiliki Issue
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Terdapat{" "}
                  <b>
                    {issueCount} finding
                  </b>{" "}
                  yang perlu
                  ditindaklanjuti oleh
                  Sales Executive.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-extrabold text-blue-800">
                  Laporan Final
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Job{" "}
                  <b>
                    {no(job)}
                  </b>{" "}
                  akan dikirim ke
                  Sales Executive.
                </p>
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex justify-between text-sm">
              <span>Job</span>
              <b>{no(job)}</b>
            </div>

            <div className="mt-2 flex justify-between text-sm">
              <span>Customer</span>
              <b>
                {job?.customer ||
                  "-"}
              </b>
            </div>

            <div className="mt-2 flex justify-between text-sm">
              <span>Status setelah submit</span>
              <b>
                {hasIssue
                  ? "Has Issue"
                  : "Completed"}
              </b>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5">
          <button
            onClick={close}
            className="secondary"
          >
            Kembali
          </button>

          <button
            onClick={confirm}
            disabled={saving}
            className="primary"
          >
            <Send size={16} />

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
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 text-center shadow-2xl">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <RefreshCw
            className="animate-spin"
            size={32}
          />
        </span>

        <h2 className="mt-5 text-[22px] font-extrabold">
          Processing
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {issueCount > 0
            ? "Menyimpan finding dan mengirim laporan Has Issue."
            : "Menyimpan laporan final dan memperbarui status job."}
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
      <div className="w-full max-w-[500px] rounded-2xl bg-white p-8 text-center shadow-2xl">
        <span
          className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
            hasIssue
              ? "bg-red-100 text-red-600"
              : "bg-emerald-100 text-emerald-600"
          }`}
        >
          {hasIssue ? (
            <AlertTriangle
              size={32}
            />
          ) : (
            <Check size={32} />
          )}
        </span>

        <h2 className="mt-5 text-[23px] font-extrabold">
          {hasIssue
            ? "Task Has Issue"
            : "Task Completed"}
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Job{" "}
          <b>
            {no(job)}
          </b>{" "}
          berhasil diproses.
        </p>

        {hasIssue && (
          <p className="mt-2 text-sm font-bold text-red-600">
            {issueCount} finding
            membutuhkan
            tindak lanjut.
          </p>
        )}

        <div className="mt-7 flex justify-center gap-3">
          <button
            onClick={() => {
              openHistory();
            }}
            className="secondary"
          >
            Lihat Job History
          </button>

          <button
            onClick={() => {
              window.location.reload();
            }}
            className="primary"
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
    <section className="form-card !p-4">
      <h2>
        <i
          className={`mr-1 inline-block h-2 w-2 rounded-full ${dot}`}
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
      <label>{label}</label>

      <input
        defaultValue={value}
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
    <div className="rounded-xl border border-slate-100 bg-[#fbfcfe] p-4">
      <p className="text-[11px] font-medium text-slate-500">
        {label}
      </p>

      <b className="mt-2 block text-[14px] leading-6">
        {value}
      </b>

      <small className="mt-1 block text-[11px] text-slate-500">
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
    <div className="rounded-xl border border-blue-100 bg-[#fbfdff] p-4">
      <div className="mb-3 flex items-center justify-between">
        <b className="text-[13px]">
          <FileText
            size={15}
            className="mr-2 inline text-blue-600"
          />

          {title}
        </b>

        {value && (
          <button
            onClick={onClear}
            className="text-red-500"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {value && (
        <div className="mb-3 rounded-lg bg-emerald-50 p-3 text-[11px] font-bold text-emerald-700">
          <Check
            size={14}
            className="mr-1 inline"
          />
          {value}
        </div>
      )}

      <label className="flex h-10 cursor-pointer items-center justify-center rounded-lg border border-blue-200 bg-white text-[12px] font-semibold text-slate-600">
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