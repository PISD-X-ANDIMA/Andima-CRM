"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "andima_manager_selected_executive";

export function useManagerFilter(defaultExec = "all") {
  const [selectedExecutive, setSelectedExecutiveState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) || defaultExec;
    }
    return defaultExec;
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setSelectedExecutiveState(e.newValue);
      }
    };
    const handleCustom = (e: CustomEvent<string>) => {
      if (e.detail) {
        setSelectedExecutiveState(e.detail);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("andima_manager_exec_change" as any, handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("andima_manager_exec_change" as any, handleCustom);
    };
  }, []);

  const setSelectedExecutive = useCallback((val: string) => {
    setSelectedExecutiveState(val);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, val);
      window.dispatchEvent(new CustomEvent("andima_manager_exec_change", { detail: val }));
    }
  }, []);

  return {
    selectedExecutive,
    setSelectedExecutive,
  };
}
