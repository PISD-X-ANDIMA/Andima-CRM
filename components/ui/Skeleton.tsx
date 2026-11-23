export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200/70 ${className}`} />;
}

const WIDTHS = [70, 55, 65, 45, 40];

/** Isi <tbody> saat tabel memuat. */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <tr key={row} className="border-b border-slate-100" aria-hidden="true">
          {Array.from({ length: columns }).map((_, col) => (
            <td key={col} className="px-4 py-4">
              <div
                className="h-4 animate-pulse rounded bg-slate-200/70"
                style={{ width: `${WIDTHS[col % WIDTHS.length]}%`, animationDelay: `${row * 80 + col * 40}ms` }}
              />
            </td>
          ))}
        </tr>
      ))}
      <tr>
        <td colSpan={columns} className="sr-only">
          Memuat data...
        </td>
      </tr>
    </>
  );
}

/** Kerangka halaman saat cek role / fetch awal. */
export function DashboardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 p-4">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
