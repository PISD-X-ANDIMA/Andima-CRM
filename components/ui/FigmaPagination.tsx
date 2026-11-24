"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface FigmaPaginationProps {
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  itemLabel?: string;
  className?: string;
}

export function FigmaPagination({
  total,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
  itemLabel,
  className = "",
}: FigmaPaginationProps) {
  const { t } = useLanguage();

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const label = itemLabel || t("common.customers", "customers");

  // Determine pages to display (up to 7 visible pages or sliding window)
  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const start = Math.max(1, Math.min(page - 3, totalPages - 6));
    return Array.from({ length: 7 }, (_, i) => start + i);
  };

  const pages = getVisiblePages();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-slate-500 font-sans ${className}`}
      aria-label="Pagination Navigation"
    >
      {/* Left: Showing X-Y of Z */}
      <div className="text-[12px] text-slate-500">
        {t("common.showing", "Showing")}{" "}
        <strong className="font-bold text-slate-800">
          {from}–{to}
        </strong>{" "}
        {t("common.of", "of")} {total} {label}
      </div>

      {/* Right: Per Halaman & Page Navigation */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Per Halaman Selector */}
        {onPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-slate-600">
              {t("common.perPage", "Per Halaman")}
            </span>
            <div className="relative inline-flex items-center">
              <select
                value={perPage}
                onChange={(e) => onPerPageChange(Number(e.target.value))}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-1 pl-2.5 pr-6 text-[12px] font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#1565d8] cursor-pointer"
                aria-label="Items per page"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        )}

        {/* Page navigation capsule (Group212.png) */}
        <nav
          className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs"
          aria-label="Page navigation"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
            className="grid size-6 place-items-center rounded-md text-[#1565d8] hover:bg-slate-50 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pages.map((p) => {
            const isActive = p === page;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={isActive ? "page" : undefined}
                className={`grid size-6 place-items-center rounded-full text-[12px] transition-all cursor-pointer ${
                  isActive
                    ? "!bg-[#1565d8] !text-white font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-[#1565d8] hover:bg-slate-50 font-medium"
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
            className="grid size-6 place-items-center rounded-md text-[#1565d8] hover:bg-slate-50 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  );
}
