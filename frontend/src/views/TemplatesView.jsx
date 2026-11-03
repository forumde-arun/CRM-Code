'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Alert, Badge, Bubble, Empty, PageHeader } from '@/components/ui';

const vars = (t) => [...new Set(t.match(/\{\{\d+\}\}/g) || [])];
const empty = { name: '', category: 'MARKETING', language: 'en_US', header: '', text: '', samples: [], footer: '', buttons: [] };
const kindOf = (s) => (s === 'APPROVED' ? 'ok' : s === 'PENDING' ? 'warn' : 'bad');

export default function TemplatesView() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState(empty);
  const n = vars(f.text).length;

  const load = () => api.get('/templates').then((r) => { setRows(r); setErr(''); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const setSample = (i, v) => { const s = [...f.samples]; s[i] = v; setF({ ...f, samples: s }); };
  const addBtn = (type) => f.buttons.length < 3 && setF({ ...f, buttons: [...f.buttons, type === 'URL' ? { type, text: '', url: '' } : { type, text: '' }] });
  const setBtn = (i, k, v) => setF({ ...f, buttons: f.buttons.map((b, j) => (j === i ? { ...b, [k]: v } : b)) });
  const delBtn = (i) => setF({ ...f, buttons: f.buttons.filter((_, j) => j !== i) });
  const shown = f.text.replace(/\{\{(\d+)\}\}/g, (_, k) => f.samples[k - 1] || `{{${k}}}`);

  const create = async (e) => {
    e.preventDefault(); setMsg(''); setBusy(true);
    try {
      await api.post('/templates', { ...f, samples: f.samples.slice(0, n) });
      setMsg('Template submitted to Meta. Status starts as PENDING. Click Refresh to check it.');
      setF(empty); load();
    } catch (x) { setMsg(x.message); }
    finally { setBusy(false); }
  };

  const remove = async (name) => {
    if (!window.confirm(`Delete "${name}" in all languages?`)) return;
    try { await api.del('/templates/' + encodeURIComponent(name)); load(); } catch (x) { setMsg(x.message); }
  };

  return (
    <>
      <PageHeader title="Templates" desc="Create a message, submit it to Meta, and use it in campaigns once it shows APPROVED." />
      {err && <Alert kind="error">{err}</Alert>}
      {msg && <Alert>{msg}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <form className="card space-y-4" onSubmit={create}>
          <h2 className="text-lg font-semibold">New template</h2>
          <div>
            <label className="label" htmlFor="t-name">Template name</label>
            <input id="t-name" className="input" placeholder="e.g. weekend_offer" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="t-cat">Category</label>
              <select id="t-cat" className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                <option value="MARKETING">Marketing (offers, promotions)</option>
                <option value="UTILITY">Utility (orders, account updates)</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="t-lang">Language</label>
              <select id="t-lang" className="input" value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })}>
                <option value="en_US">English (US)</option>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="t-head">Header <span className="font-normal text-slate-400">(optional)</span></label>
            <input id="t-head" className="input" placeholder="Max 60 characters, no variables" maxLength={60} value={f.header} onChange={(e) => setF({ ...f, header: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="t-text">Message text</label>
            <textarea id="t-text" className="input" rows="4" maxLength={1024} placeholder={'Use {{1}}, {{2}} for variables, e.g.\nHi {{1}}, our weekend sale starts today.'} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} required />
          </div>
          {Array.from({ length: n }, (_, i) => (
            <input key={i} className="input" placeholder={`Sample value for {{${i + 1}}} (shown to Meta reviewers)`} value={f.samples[i] || ''} onChange={(e) => setSample(i, e.target.value)} required />
          ))}
          <div>
            <label className="label" htmlFor="t-foot">Footer <span className="font-normal text-slate-400">(optional)</span></label>
            <input id="t-foot" className="input" placeholder="Max 60 characters" maxLength={60} value={f.footer} onChange={(e) => setF({ ...f, footer: e.target.value })} />
          </div>
          {f.buttons.map((b, i) => (
            <div className="flex flex-wrap items-center gap-2" key={i}>
              <input className="input min-w-[10rem] flex-1" placeholder={b.type === 'URL' ? 'Link button text' : 'Quick reply text'} maxLength={25} value={b.text} onChange={(e) => setBtn(i, 'text', e.target.value)} required />
              {b.type === 'URL' && <input className="input min-w-[10rem] flex-1" placeholder="https://example.com" value={b.url} onChange={(e) => setBtn(i, 'url', e.target.value)} required />}
              <button type="button" className="btn-danger-link" onClick={() => delBtn(i)}>Remove</button>
            </div>
          ))}
          {f.buttons.length < 3 && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => addBtn('QUICK_REPLY')}>Add quick reply button</button>
              <button type="button" className="btn-ghost" onClick={() => addBtn('URL')}>Add link button</button>
            </div>
          )}
          <button className="btn" disabled={busy}>{busy ? 'Submitting…' : 'Submit template to Meta'}</button>
        </form>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Live preview</h2>
            <div className="rounded-lg bg-[#efeae2] p-4">
              <Bubble>
                {f.header && <p className="mb-1 font-semibold">{f.header}</p>}
                <p>{shown || 'Your message preview appears here'}</p>
                {f.footer && <p className="mt-1.5 text-xs text-slate-500">{f.footer}</p>}
                {f.buttons.map((b, i) => <div key={i} className="mt-2 border-t border-black/10 pt-1.5 text-center text-sm font-medium text-brand-700">{b.text || 'Button'}</div>)}
              </Bubble>
            </div>
          </div>
        </aside>
      </div>

      <div className="mb-3 mt-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your templates</h2>
        <button className="btn-ghost" onClick={load}>Refresh</button>
      </div>
      {rows && rows.length === 0 && <Empty title="No templates yet" desc="Create your first template above. Meta usually approves within minutes to a day." />}
      {rows && rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead><tr><th className="th">Name</th><th className="th">Category</th><th className="th">Language</th><th className="th">Status</th><th className="th" /></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id || t.name + t.language}>
                  <td className="td font-medium text-slate-900">{t.name}</td><td className="td">{t.category}</td><td className="td">{t.language}</td>
                  <td className="td">
                    <Badge kind={kindOf(t.status)}>{t.status}</Badge>
                    {t.rejected_reason && t.rejected_reason !== 'NONE' && <p className="mt-1 text-xs text-slate-500">{t.rejected_reason}</p>}
                  </td>
                  <td className="td text-right"><button className="btn-danger-link" onClick={() => remove(t.name)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
