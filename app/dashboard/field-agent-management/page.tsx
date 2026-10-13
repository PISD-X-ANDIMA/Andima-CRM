export default function FieldAgentManagementPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Field Agent Management</h1>
        <p className="text-sm text-slate-500">
          Manajemen personil dan pengaturan hak akses Field Agent.
        </p>
      </div>

      <div className="flex min-h-[460px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 font-semibold text-lg">
          FA
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Field Agent Management</h2>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          Modul manajemen personil lapangan dan pengaturan hak akses operasional Field Agent.
        </p>
      </div>
    </div>
  );
}
