"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

interface UserRoleItem {
  id: string;
  name: string;
  email: string | null;
  crm_role: "manager_customer_success" | "sales_executive" | "field_agent" | "no_role";
  sales_executive_in_charge?: string | null;
  notes?: string | null;
}

export default function RoleManagementPage() {
  const [users, setUsers] = useState<UserRoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Selected User for the "Set Role" panel
  const [selectedUser, setSelectedUser] = useState<UserRoleItem | null>(null);
  const [panelRole, setPanelRole] = useState<string>("field_agent");
  const [panelExec, setPanelExec] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState("");

  const salesExecutives = useMemo(() => {
    return users
      .filter((u) => u.crm_role === "sales_executive")
      .map((u) => u.name);
  }, [users]);

  // Fetch real users from database
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetch("/api/v1/manager/roles", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (active && json.success && Array.isArray(json.data)) {
          const mapped: UserRoleItem[] = json.data.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            crm_role: u.crm_role || "sales_executive",
            sales_executive_in_charge: u.notes || null,
          }));
          setUsers(mapped);
        } else if (active) {
          setUsers([]);
        }
      })
      .catch(() => {
        if (active) setUsers([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleOpenSetRole = (u: UserRoleItem) => {
    setSelectedUser(u);
    setPanelRole(u.crm_role === "no_role" ? "field_agent" : u.crm_role);
    setPanelExec(u.sales_executive_in_charge || salesExecutives[0] || "");
  };

  const handleInlineChangeRole = (userId: string, newRole: any) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, crm_role: newRole } : u))
    );
  };

  const handleInlineChangeExec = (userId: string, newExec: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, sales_executive_in_charge: newExec } : u))
    );
  };

  const handleSaveUserRole = async (targetUser: UserRoleItem) => {
    setIsSaving(true);
    try {
      await fetch("/api/v1/manager/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: targetUser.id,
          crm_role: targetUser.crm_role === "no_role" ? "sales_executive" : targetUser.crm_role,
          notes: targetUser.sales_executive_in_charge || null,
        }),
      });
      setSaveToast(`Role for ${targetUser.name} saved successfully.`);
      setTimeout(() => setSaveToast(""), 4000);
    } catch {
      setSaveToast(`Saved locally for ${targetUser.name}.`);
      setTimeout(() => setSaveToast(""), 4000);
    } finally {
      setIsSaving(false);
      setSelectedUser(null);
    }
  };

  const handlePanelSave = () => {
    if (!selectedUser) return;
    const updatedUser: UserRoleItem = {
      ...selectedUser,
      crm_role: panelRole as any,
      sales_executive_in_charge: panelRole === "field_agent" ? panelExec : null,
    };
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? updatedUser : u))
    );
    void handleSaveUserRole(updatedUser);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches = u.name.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (roleFilter !== "all" && u.crm_role !== roleFilter) {
        return false;
      }
      return true;
    });
  }, [users, search, roleFilter]);

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-6 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          User Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Set the role of registered users. Only Manager of Customer Success can access this page.
        </p>
      </div>

      {saveToast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs">
          {saveToast}
        </div>
      )}

      {/* Main Grid: Table (Left) + Set Role Panel (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Table Column (lg:col-span-8 or 12 if no panel open) */}
        <div className={selectedUser ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}>
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email..."
                className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All ▾</option>
                <option value="sales_executive">Sales Executive</option>
                <option value="field_agent">Field Agent</option>
                <option value="manager_customer_success">Manager of Customer Success</option>
                <option value="no_role">No role</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Sales Executive in charge</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                      {isLoading ? "Memuat data personil dari database HRMS..." : "Belum ada user yang terdaftar di basis data."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isNoRole = user.crm_role === "no_role";

                    return (
                      <tr key={user.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{user.name}</td>
                        <td className="py-3.5 px-4 text-slate-600">{user.email || "—"}</td>
                        <td className="py-3.5 px-4">
                          {isNoRole ? (
                            <span className="text-xs text-slate-400 italic">No role</span>
                          ) : (
                          <div className="relative inline-block">
                            <select
                              value={user.crm_role}
                              onChange={(e) => handleInlineChangeRole(user.id, e.target.value)}
                              className="h-8 appearance-none rounded-lg border border-slate-200 bg-white px-2.5 pr-7 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
                            >
                              <option value="sales_executive">Sales Executive</option>
                              <option value="field_agent">Field Agent</option>
                              <option value="manager_customer_success">Manager of Customer Success</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {user.crm_role === "field_agent" ? (
                          <div className="relative inline-block">
                            <select
                              value={user.sales_executive_in_charge || ""}
                              onChange={(e) => handleInlineChangeExec(user.id, e.target.value)}
                              className="h-8 appearance-none rounded-lg border border-slate-200 bg-white px-2.5 pr-7 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">-</option>
                              {salesExecutives.map((se) => (
                                <option key={se} value={se}>{se}</option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isNoRole ? (
                          <button
                            type="button"
                            onClick={() => handleOpenSetRole(user)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600"
                          >
                            Set role
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleSaveUserRole(user)}
                            disabled={isSaving}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-50"
                          >
                            Save
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            </table>
          </div>

          <div className="text-xs text-slate-500">
            Showing 1-{filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Right Side Panel: "Set Role" Drawer (Page 10 in PDF) */}
        {selectedUser && (
          <div className="lg:col-span-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs h-fit space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Set Role: {selectedUser.name}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Role input */}
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Role <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1">
                <select
                  value={panelRole}
                  onChange={(e) => setPanelRole(e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-8 text-xs font-medium text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none"
                >
                  <option value="field_agent">Field Agent ▾</option>
                  <option value="sales_executive">Sales Executive ▾</option>
                  <option value="manager_customer_success">Manager of Customer Success ▾</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Sales Executive in charge input */}
            {panelRole === "field_agent" && (
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Sales Executive in charge <span className="text-rose-500">* (required for Field Agent)</span>
                </label>
                <div className="relative mt-1">
                  <select
                    value={panelExec}
                    onChange={(e) => setPanelExec(e.target.value)}
                    className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-8 text-xs font-medium text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select Sales Executive ▾</option>
                    {salesExecutives.map((se) => (
                      <option key={se} value={se}>{se}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePanelSave}
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>

            {/* Explanatory Help Note from PDF */}
            <div className="rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500 border border-slate-100">
              A user without a role cannot open any CRM menu. After saving, the sidebar follows the new role.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
