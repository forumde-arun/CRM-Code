const alerts = {
  info: 'mb-4 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900',
  error: 'mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800',
};
const badges = { ok: 'badge badge-ok', warn: 'badge badge-warn', bad: 'badge badge-bad', muted: 'badge badge-muted' };

export function PageHeader({ title, desc, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-sm text-slate-500">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export function Alert({ kind = 'info', children }) {
  return <div role={kind === 'error' ? 'alert' : 'status'} className={alerts[kind]}>{children}</div>;
}

export function Badge({ kind = 'muted', children }) {
  return <span className={badges[kind]}>{children}</span>;
}

export function Empty({ title, desc }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      {desc && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{desc}</p>}
    </div>
  );
}

export function Spinner() {
  return <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" role="status" aria-label="Loading" />;
}

export function Bubble({ children }) {
  return <div className="max-w-xs whitespace-pre-wrap rounded-lg rounded-tl-none bg-[#dcf8c6] px-3.5 py-2.5 text-sm text-slate-900 shadow-sm">{children}</div>;
}
