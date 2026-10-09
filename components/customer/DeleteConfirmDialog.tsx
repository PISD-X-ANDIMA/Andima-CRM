"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  isDeleting: boolean;
  companyName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  isDeleting,
  companyName,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="delete-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={!isDeleting ? onCancel : undefined}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/60 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                id="delete-dialog-title"
                className="text-sm font-semibold text-slate-900 dark:text-white"
              >
                Delete Company
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                You are about to delete{" "}
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                  {companyName}
                </strong>{" "}
                from the company list. Its record will be archived, and existing history will be retained.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-[#0b1324]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
