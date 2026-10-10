"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  ShieldCheck,
  Users,
  Search,
  Filter,
  UserCheck,
  Briefcase,
  HardHat,
  CheckCircle2,
  XCircle,
  Edit2,
  RefreshCw,
  Save,
  X,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface UserRoleItem {
  id: string;
  employee_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  hrms_position_title: string;
  hrms_position_code: string | null;
  crm_role: "manager_customer_success" | "sales_executive" | "field_agent";
  is_active: boolean;
  notes: string | null;
  access_id: string | null;
  updated_at: string;
}

export default function RoleManagementPage() {
  const [users, setUsers] = useState<UserRoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Modal State
  const [editUser, setEditUser] = useState<UserRoleItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<"manager_customer_success" | "sales_executive" | "field_agent">("sales_executive");
  const [isActiveStatus, setIsActiveStatus] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/manager/roles", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load personnel data.");
      }
      setUsers(json.data || []);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading personnel.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const openEditModal = (u: UserRoleItem) => {
    setEditUser(u);
    setSelectedRole(u.crm_role);
    setIsActiveStatus(u.is_active);
    setNotes(u.notes || "");
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const res = await fetch("/api/v1/manager/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: editUser.id,
          crm_role: selectedRole,
          is_active: isActiveStatus,
          notes: notes.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update role permissions.");
      }
      setSaveSuccess("Role permissions updated successfully!");
      // Update local state
      setUsers((prev) =>
        prev.map((item) =>
          item.id === editUser.id
            ? { ...item, crm_role: selectedRole, is_active: isActiveStatus, notes: notes.trim() }
            : item
        )
      );
      setTimeout(() => {
        setEditUser(null);
      }, 1000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
        (u.hrms_position_title && u.hrms_position_title.toLowerCase().includes(search.toLowerCase()));

      const matchesRole =
        roleFilter === "all" || u.crm_role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const managers = users.filter((u) => u.crm_role === "manager_customer_success").length;
    const salesExecs = users.filter((u) => u.crm_role === "sales_executive").length;
    const fieldAgents = users.filter((u) => u.crm_role === "field_agent").length;
    return { total, managers, salesExecs, fieldAgents };
  }, [users]);

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1 text-indigo-400">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Customer Success Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Manage Team Access & CRM Roles
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Grant and manage <strong>Sales Executive</strong> and <strong>Field Agent</strong> permissions for operational personnel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/manager-customer-success"
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-700/60 bg-indigo-900/40 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-900/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Total Personnel</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{stats.total}</p>
          <span className="text-xs text-slate-400">Registered in HRMS</span>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-xs font-semibold uppercase">Sales Executive</span>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-900">{stats.salesExecs}</p>
          <span className="text-xs text-blue-600 font-medium">Dedicated Pipeline Access</span>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-semibold uppercase">Field Agent</span>
            <HardHat className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{stats.fieldAgents}</p>
          <span className="text-xs text-emerald-600 font-medium">Field Operations (A3)</span>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-xs font-semibold uppercase">Manager of CS</span>
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-900">{stats.managers}</p>
          <span className="text-xs text-indigo-600 font-medium">Full Oversight & Role Assignment</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or HRMS position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All CRM Roles</option>
            <option value="sales_executive">Sales Executive</option>
            <option value="field_agent">Field Agent</option>
            <option value="manager_customer_success">Manager of Customer Success</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[950px] table-auto text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
            <tr>
              <th className="px-5 py-4">Employee Name & Contact</th>
              <th className="px-5 py-4">HRMS Position</th>
              <th className="px-5 py-4 text-center">Registered CRM Role</th>
              <th className="px-5 py-4 text-center">Access Status</th>
              <th className="px-5 py-4">Delegation Notes</th>
              <th className="px-5 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-600 mb-2" />
                  Loading personnel and role assignments...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-rose-600">
                  {error}
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No personnel matching the search criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                let badgeRoleClass = "bg-blue-50 text-blue-700 border-blue-200";
                let roleLabel = "Sales Executive";
                if (u.crm_role === "manager_customer_success") {
                  badgeRoleClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
                  roleLabel = "Manager of CS";
                } else if (u.crm_role === "field_agent") {
                  badgeRoleClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  roleLabel = "Field Agent";
                }

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email || "No email"} {u.phone && `· ${u.phone}`}</div>
                      {u.employee_id && (
                        <span className="inline-block mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                          ID: {u.employee_id}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-slate-800 font-medium">{u.hrms_position_title}</span>
                      {u.hrms_position_code && (
                        <span className="block text-xs text-slate-400 font-mono">[{u.hrms_position_code}]</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badgeRoleClass}`}>
                        {u.crm_role === "manager_customer_success" ? (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        ) : u.crm_role === "field_agent" ? (
                          <HardHat className="h-3.5 w-3.5" />
                        ) : (
                          <Briefcase className="h-3.5 w-3.5" />
                        )}
                        {roleLabel}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500">
                          <XCircle className="h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate">
                      {u.notes || <span className="text-slate-300 italic">—</span>}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors shadow-sm"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>Edit Role</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Role Modal */}
      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditUser(null);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit CRM Role & Permissions</h2>
                <p className="text-xs text-slate-500">For user: <strong>{editUser.name}</strong></p>
              </div>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Select Role in CRM System:
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <label
                    className={`flex cursor-pointer flex-col rounded-xl border p-3 text-center transition-all ${
                      selectedRole === "sales_executive"
                        ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="crm_role"
                      value="sales_executive"
                      checked={selectedRole === "sales_executive"}
                      onChange={() => setSelectedRole("sales_executive")}
                      className="sr-only"
                    />
                    <Briefcase className="mx-auto mb-1 h-5 w-5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">Sales Executive</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Manage owned pipeline</span>
                  </label>

                  <label
                    className={`flex cursor-pointer flex-col rounded-xl border p-3 text-center transition-all ${
                      selectedRole === "field_agent"
                        ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="crm_role"
                      value="field_agent"
                      checked={selectedRole === "field_agent"}
                      onChange={() => setSelectedRole("field_agent")}
                      className="sr-only"
                    />
                    <HardHat className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">Field Agent</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Field operations (A3)</span>
                  </label>

                  <label
                    className={`flex cursor-pointer flex-col rounded-xl border p-3 text-center transition-all ${
                      selectedRole === "manager_customer_success"
                        ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="crm_role"
                      value="manager_customer_success"
                      checked={selectedRole === "manager_customer_success"}
                      onChange={() => setSelectedRole("manager_customer_success")}
                      className="sr-only"
                    />
                    <ShieldCheck className="mx-auto mb-1 h-5 w-5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">Manager of CS</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Full team oversight</span>
                  </label>
                </div>
              </div>

              {/* Status Switch */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">CRM Access Status</span>
                  <span className="text-xs text-slate-500">Disable to revoke access to CRM module</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActiveStatus(!isActiveStatus)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isActiveStatus ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isActiveStatus ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Delegation Notes / Remarks:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Granted Sales Executive access for Greater Jakarta region..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                />
              </div>

              {saveError && (
                <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                  {saveError}
                </div>
              )}

              {saveSuccess && (
                <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
                  {saveSuccess}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
