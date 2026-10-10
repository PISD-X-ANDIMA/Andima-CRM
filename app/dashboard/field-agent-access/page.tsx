"use client";

import React from "react";
import { UserCheck, Shield, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function FieldAgentAccessPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Hak Akses Field Agent
          </h1>
          <p className="text-sm text-slate-500">
            Pemberian dan pengelolaan hak akses untuk Field Agent lapangan (Squad A2 Integration).
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <UserCheck className="h-8 w-8" />
          </div>

          <h2 className="mb-2 text-xl font-bold text-slate-800">
            Modul Manajemen Hak Akses Field Agent
          </h2>
          <p className="mb-6 text-sm text-slate-600 leading-relaxed">
            Fitur pendelegasian dan pemberian hak akses Field Agent ini sedang dikembangkan bersama <strong>Squad A2</strong>.
            Setelah modul ini selesai, Sales Executive dapat langsung memilih dan menugaskan Field Agent untuk menangani tugas-tugas lapangan (*Task of Field Agent*).
          </p>

          <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-blue-600">
                <Shield className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Akses Lapangan</span>
              </div>
              <p className="text-xs text-slate-600">
                Memberikan izin kepada personil lapangan untuk mengakses modul formulir tugas A3.
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-amber-600">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Status Integrasi</span>
              </div>
              <p className="text-xs text-slate-600">
                Menunggu penyelesaian kontrak API & endpoint dari Squad A2.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/dashboard/sales-executive"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <span>Kembali ke Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
