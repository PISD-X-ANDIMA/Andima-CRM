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
      className={`inline-flex items-center rounded-full border border-[#e2e8f0] bg-[#f1f5f9] p-[3px] text-[12px] font-medium ${className}`}
    >
      {showIcon && (
        <span className="pl-1.5 pr-1 text-slate-400">
          <Globe className="h-3.5 w-3.5" />
        </span>
      )}
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-full px-[8px] py-[2px] text-[12px] font-medium transition-all cursor-pointer ${
          language === "en"
            ? "bg-white text-[#191b22] shadow-2xs font-semibold"
            : "text-[#424753] hover:text-[#191b22]"
        }`}
        aria-label="Switch language to English"
        aria-pressed={language === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("id")}
        className={`rounded-full px-[8px] py-[2px] text-[12px] font-medium transition-all cursor-pointer ${
          language === "id"
            ? "bg-white text-[#191b22] shadow-2xs font-semibold"
            : "text-[#424753] hover:text-[#191b22]"
        }`}
        aria-label="Ganti bahasa ke Bahasa Indonesia"
        aria-pressed={language === "id"}
      >
        ID
      </button>
    </div>
  );
}
