"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  showIcon?: boolean;
  className?: string;
}

export function LanguageSwitcher({ showIcon = false, className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Select language"
      className={`flex items-center rounded-lg border border-slate-200 bg-slate-100/90 p-0.5 text-xs font-semibold ${className}`}
    >
      {showIcon && (
        <span className="pl-1.5 pr-1 text-slate-400">
          <Globe className="h-3.5 w-3.5" />
        </span>
      )}
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-md px-2.5 py-1 text-[11px] transition-all cursor-pointer ${
          language === "en"
            ? "bg-white text-blue-700 shadow-xs font-bold"
            : "text-slate-500 hover:text-slate-800"
        }`}
        aria-label="Switch language to English"
        aria-pressed={language === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("id")}
        className={`rounded-md px-2.5 py-1 text-[11px] transition-all cursor-pointer ${
          language === "id"
            ? "bg-white text-blue-700 shadow-xs font-bold"
            : "text-slate-500 hover:text-slate-800"
        }`}
        aria-label="Ganti bahasa ke Bahasa Indonesia"
        aria-pressed={language === "id"}
      >
        ID
      </button>
    </div>
  );
}
