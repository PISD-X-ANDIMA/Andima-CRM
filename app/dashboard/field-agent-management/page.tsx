"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TableSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { FigmaPagination } from "@/components/ui/FigmaPagination";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface AccountItem {
  id: string;
  employee_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  position_title: string;
  is_active: boolean;
}

export default function FieldAgentManagementPage() {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [viewerRole, setViewerRole] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("andima_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          const role = String(parsed.role || "").toLowerCase();
          if (role.includes("manager")) return "manager_customer_success";
          if (role.includes("sales")) return "sales_executive";
        }
      } catch {
        // Ignore parse errors
      }
    }
    return "";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadAccounts = async () => {
    try {
      const response = await fetch("/api/v1/account-status", { cache: "no-store" });
      const result = await response.json();
      if (!result?.success) {
        setAccounts([]);
        setLoadFailed(true);
        return;
      }
      setLoadFailed(false);
      setViewerRole(result.viewer_role || "");
      setAccounts(result.data || []);
    } catch {
      setAccounts([]);
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const toggleActive = async (account: AccountItem) => {
    if (updatingId) return;
    setUpdatingId(account.id);
    try {
      const response = await fetch("/api/v1/account-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: account.id, is_active: !account.is_active }),
      });
      const result = await response.json();
      if (!result?.success) throw new Error(result?.error || t("fieldAgentMgmt.updateStatusFailed", "Failed to update account status"));
      setAccounts((prev) =>
        prev.map((item) => (item.id === account.id ? { ...item, is_active: !account.is_active } : item))
      );
    } catch (err) {
      alert(`${t("fieldAgentMgmt.updateStatusFailed", "Failed to update account status")}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.email || "").toLowerCase().includes(q)
    );
  }, [accounts, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / perPage));
  const validPage = Math.min(page, totalPages);
  const paginatedAccounts = useMemo(() => {
    const start = (validPage - 1) * perPage;
    return filteredAccounts.slice(start, start + perPage);
  }, [filteredAccounts, validPage, perPage]);

  const isManagerView = viewerRole === "manager_customer_success";

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        {isLoading && !viewerRole ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-4 w-80" />
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {isManagerView
                ? t("fieldAgentMgmt.managerTitle", "Sales & Field Agent Accounts")
                : t("fieldAgentMgmt.salesTitle", "Field Agent Accounts")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isManagerView
                ? t("fieldAgentMgmt.managerSubtitle", "Activate or deactivate Sales Executive and Field Agent accounts.")
                : t("fieldAgentMgmt.salesSubtitle", "Activate or deactivate Field Agent accounts.")}
            </p>
          </>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("fieldAgentMgmt.searchPlaceholder", "Search name or email...")}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3.5">{t("fieldAgentMgmt.colName", "Name")}</th>
              <th className="px-4 py-3.5">{t("fieldAgentMgmt.colEmail", "Email")}</th>
              <th className="px-4 py-3.5">{t("fieldAgentMgmt.colRole", "Role")}</th>
              <th className="px-4 py-3.5">{t("fieldAgentMgmt.colStatus", "Status")}</th>
              <th className="px-4 py-3.5 text-center">{t("fieldAgentMgmt.colAction", "Action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : loadFailed ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  {t("fieldAgentMgmt.loadError", "Failed to load account list.")}
                  <button
                    type="button"
                    onClick={() => { setIsLoading(true); setLoadFailed(false); void loadAccounts(); }}
                    className="ml-2 rounded-md border border-slate-200 px-2.5 py-1 font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    {t("common.retry", "Retry")}
                  </button>
                </td>
              </tr>
            ) : filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  {t("fieldAgentMgmt.noAccountsFound", "No accounts found.")}
                </td>
              </tr>
            ) : (
              paginatedAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{account.name}</td>
                  <td className="px-4 py-3.5">{account.email || "-"}</td>
                  <td className="px-4 py-3.5">
                    {account.role === "field_agent" ? t("nav.fieldAgent", "Field Agent") : t("nav.salesExecutive", "Sales Executive")}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 font-semibold ${account.is_active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                      {account.is_active
                        ? t("fieldAgentMgmt.activeStatus", "Active")
                        : t("fieldAgentMgmt.inactiveStatus", "Inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(account)}
                      disabled={updatingId === account.id}
                      className="rounded-md border border-slate-200 px-3 py-1 font-semibold text-blue-600 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {updatingId === account.id
                        ? t("fieldAgentMgmt.savingBtn", "Saving...")
                        : account.is_active
                          ? t("fieldAgentMgmt.deactivateBtn", "Deactivate")
                          : t("fieldAgentMgmt.activateBtn", "Activate")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <FigmaPagination
        total={filteredAccounts.length}
        page={validPage}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage);
          setPage(1);
        }}
        itemLabel={t("fieldAgentMgmt.accountsUnit", "accounts")}
      />
    </div>
  );
}
