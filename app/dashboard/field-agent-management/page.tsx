"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

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
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [viewerRole, setViewerRole] = useState<string>("");
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
      if (!result?.success) throw new Error(result?.error || "Gagal mengubah status akun");
      setAccounts((prev) =>
        prev.map((item) => (item.id === account.id ? { ...item, is_active: !account.is_active } : item))
      );
    } catch (err) {
      alert(`Gagal mengubah status akun: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.email || "").toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const isManagerView = viewerRole === "manager_customer_success";

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {isManagerView ? "Sales & Field Agent Accounts" : "Field Agent Accounts"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isManagerView
            ? "Aktifkan atau nonaktifkan akun Sales Executive dan Field Agent."
            : "Aktifkan atau nonaktifkan akun Field Agent."}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3.5">Name</th>
              <th className="px-4 py-3.5">Email</th>
              <th className="px-4 py-3.5">Role</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  Loading accounts...
                </td>
              </tr>
            ) : loadFailed ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  Gagal memuat daftar akun.
                  <button
                    type="button"
                    onClick={() => { setIsLoading(true); setLoadFailed(false); void loadAccounts(); }}
                    className="ml-2 rounded-md border border-slate-200 px-2.5 py-1 font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    Coba lagi
                  </button>
                </td>
              </tr>
            ) : filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  No accounts found.
                </td>
              </tr>
            ) : (
              filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{account.name}</td>
                  <td className="px-4 py-3.5">{account.email || "-"}</td>
                  <td className="px-4 py-3.5">
                    {account.role === "field_agent" ? "Field Agent" : "Sales Executive"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 font-semibold ${account.is_active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                      {account.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(account)}
                      disabled={updatingId === account.id}
                      className="rounded-md border border-slate-200 px-3 py-1 font-semibold text-blue-600 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {updatingId === account.id ? "Menyimpan..." : account.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500">
        Showing {filteredAccounts.length} of {accounts.length} accounts
      </div>
    </div>
  );
}
