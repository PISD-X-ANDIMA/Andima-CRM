export default async function TaskOfFieldAgentPage({ searchParams }: { searchParams: Promise<{ agent?: string }> }) {
  const { agent } = await searchParams;
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-bold text-slate-800">Task of Field Agent</h1>
      {agent ? <p className="mt-2 text-slate-500">Selected field agent: {agent}</p> : <p className="mt-2 text-slate-500">All field agents</p>}
      <p className="mt-1 text-sm text-slate-400">Task records are not connected to this module yet.</p>
    </div>
  );
}
