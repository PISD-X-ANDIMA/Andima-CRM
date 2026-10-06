"use client";

import React, { useState, useCallback } from "react";
import { X, Building2, User, MapPin, Loader2, AlertCircle } from "lucide-react";
import { CreateCustomerInput, CustomerListItem, ApiResponse } from "@/types/customer";

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (companyId: string) => void;
  customer?: CustomerListItem | null;
}

interface FormErrors {
  company_name?: string;
  address?: string;
  pic_full_name?: string;
  general?: string;
}

const INITIAL_FORM: CreateCustomerInput = {
  company_name: "",
  address: "",
  pic_full_name: "",
};

function validate(data: CreateCustomerInput): FormErrors {
  const errors: FormErrors = {};
  if (!data.company_name.trim()) errors.company_name = "Company name is required";
  if (!data.address.trim()) errors.address = "Address is required";
  if (!data.pic_full_name.trim()) errors.pic_full_name = "PIC name is required";
  return errors;
}

export function CustomerFormModal({ isOpen, onClose, onSuccess, customer }: CustomerFormModalProps) {
  const [form, setForm] = useState<CreateCustomerInput>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setForm(customer ? {
      company_name: customer.companyName,
      address: customer.address || "",
      pic_full_name: customer.primaryPic?.fullName || "",
    } : INITIAL_FORM);
    setErrors({});
  }, [customer, isOpen]);

  const handleChange = useCallback(
    (field: keyof CreateCustomerInput, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationErrors = validate(form);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsSubmitting(true);
      setErrors({});

      try {
        const res = await fetch(customer ? `/api/v1/customers/${customer.id}` : "/api/v1/customers/create", {
          method: customer ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const json: ApiResponse<{ companyId?: string }> = await res.json();

        if (!json.success) {
          if (json.code === "DUPLICATE_001") {
            setErrors({ company_name: "This company is already registered" });
          } else {
            setErrors({ general: json.message || "Failed to save the customer" });
          }
          return;
        }

        setForm(INITIAL_FORM);
        onSuccess(json.data.companyId || customer!.id);
      } catch {
        setErrors({ general: "A connection error occurred. Please try again." });
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSuccess, customer]
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setForm(INITIAL_FORM);
      setErrors({});
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="customer-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 id="customer-modal-title" className="text-base font-semibold text-slate-900">
              {customer ? "Edit Company" : "Add Company"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* General Error */}
            {errors.general && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Company section */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Company Information
              </p>
              <div className="space-y-3">
                {/* Company Name */}
                <div>
                  <label
                    htmlFor="field-company_name"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      id="field-company_name"
                      type="text"
                      value={form.company_name}
                      onChange={(e) => handleChange("company_name", e.target.value)}
                      placeholder="Example Company, Inc."
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 ${
                        errors.company_name
                          ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
                          : "border-slate-200 focus:border-blue-400 focus:ring-blue-500/20"
                      }`}
                    />
                  </div>
                  {errors.company_name && (
                    <p className="mt-1.5 text-[11px] text-red-600">{errors.company_name}</p>
                  )}
                </div>

              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Section: PIC */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Company PIC
              </p>
              <div className="space-y-3">
                {/* PIC Name */}
                <div>
                  <label
                    htmlFor="field-pic_full_name"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    PIC Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="field-pic_full_name"
                      type="text"
                      value={form.pic_full_name}
                      onChange={(e) => handleChange("pic_full_name", e.target.value)}
                      placeholder="Full name"
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 ${
                        errors.pic_full_name
                          ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
                          : "border-slate-200 focus:border-blue-400 focus:ring-blue-500/20"
                      }`}
                    />
                  </div>
                  {errors.pic_full_name && (
                    <p className="mt-1.5 text-[11px] text-red-600">{errors.pic_full_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-address" className="mb-1.5 block text-xs font-medium text-slate-700">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-0 top-3 pl-3 text-slate-400"><MapPin className="h-4 w-4" /></div>
                    <textarea
                      id="field-address"
                      value={form.address}
                      onChange={(event) => handleChange("address", event.target.value)}
                      placeholder="Company address"
                      rows={2}
                      className={`w-full resize-none rounded-lg border py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 ${errors.address ? "border-red-300 focus:border-red-400 focus:ring-red-500/20" : "border-slate-200 focus:border-blue-400 focus:ring-blue-500/20"}`}
                    />
                  </div>
                  {errors.address && <p className="mt-1.5 text-[11px] text-red-600">{errors.address}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{customer ? "Save Changes" : "Add Company"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
