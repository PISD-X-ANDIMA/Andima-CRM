"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Storage may be unavailable; the redirect still runs.
    }
    router.replace("/login");
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
      <p className="text-sm text-slate-600">
        Path yang dibuka: <code className="rounded bg-slate-100 px-2 py-1 text-slate-900">{pathname}</code>
      </p>
      <p className="text-sm text-slate-500">
        Kirim path di atas saat melapor. Kalau path-nya benar, halaman itu belum ada di build ini.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/dashboard"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Kembali ke dashboard
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Keluar dan login ulang
        </button>
      </div>
    </main>
  );
}
