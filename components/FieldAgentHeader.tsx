"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";

export function FieldAgentHeader({ title = "Field Agent" }: { title?: string }) {
  const [username, setUsername] = useState("Field Agent");

  useEffect(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("andima_user") || "null") as { name?: string } | null;
      if (savedUser?.name?.trim()) {
        setUsername(savedUser.name.trim());
      }
    } catch {
      // Fallback
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur sm:px-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        <p className="text-xs text-slate-400">Modul Operasional Lapangan &bull; Squad A3</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
          <User className="h-5 w-5" />
        </div>
        <div className="hidden text-right sm:block leading-tight">
          <p className="text-sm font-semibold text-slate-800">{username}</p>
          <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            Field Agent
          </span>
        </div>
      </div>
    </header>
  );
}
