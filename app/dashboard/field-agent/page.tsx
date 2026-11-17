import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Temporary placeholder until the A3 field-agent app is merged into this branch.
 * Without this route, any field-agent session lands on a 404 after login.
 */
export default function FieldAgentPage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Aplikasi Field Agent belum tersedia</h1>
      <p className="text-sm text-slate-600">
        Modul A3 (My Task, laporan lapangan, need backup) belum digabung ke branch ini.
        Halaman ini sengaja kosong supaya tidak muncul 404.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Kembali ke dashboard
      </Link>
    </main>
  );
}
