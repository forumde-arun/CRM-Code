'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Alert, Badge, Bubble, Empty, PageHeader } from '@/components/ui';

const count = (c, ...s) => c.messages.filter((m) => s.includes(m.status)).length;
const bodyOf = (t) => t?.components?.find((c) => c.type === 'BODY')?.text || '';
const nVars = (t) => new Set(bodyOf(t).match(/\{\{\d+\}\}/g) || []).size;
const kindOf = (s) => (s === 'completed' ? 'ok' : s === 'running' ? 'warn' : 'bad');

export default function CampaignsView() {
  const [tpls, setTpls] = useState([]);
  const [list, setList] = useState([]);
  const [f, setF] = useState({ name: '', tpl: '', vars: [] });
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/campaigns').then(setList).catch(() => {});
  useEffect(() => {
    api.get('/templates').then((t) => setTpls(t.filter((x) => x.status === 'APPROVED'))).catch((e) => setMsg(e.message));
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  const t = tpls.find((x) => x.name + '|' + x.language === f.tpl);
  const pick = (v) => { const x = tpls.find((y) => y.name + '|' + y.language === v); setF({ ...f, tpl: v, vars: Array(x ? nVars(x) : 0).fill('') }); };
  const setVar = (i, v) => setF({ ...f, vars: f.vars.map((x, j) => (j === i ? v : x)) });
  const preview = bodyOf(t).replace(/\{\{(\d+)\}\}/g, (_, k) => (f.vars[k - 1] || `{{${k}}}`).replaceAll('{{name}}', 'Asha'));
  const payload = () => { const [templateName, language] = f.tpl.split('|'); return { templateName, language, variables: f.vars }; };

  const send = async (e) => {
    e.preventDefault(); setMsg(''); setBusy(true);
    try { await api.post('/campaigns', { name: f.name, ...payload() }); setF({ name: '', tpl: '', vars: [] }); setMsg('Campaign started'); load(); }
    catch (x) { setMsg(x.message); }
    finally { setBusy(false); }
  };

  const sendTest = async () => {
    setMsg(''); setBusy(true);
    try { const r = await api.post('/campaigns/test', { ...payload(), phone }); setMsg('Test sent. Check that phone. Message ID: ' + r.id); }
    catch (x) { setMsg(x.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Campaigns" desc="Send an approved template to all opted-in contacts. Test it on one number first." />
      {msg && <Alert>{msg}</Alert>}
      {tpls.length === 0 && <Alert>No approved templates yet. Create one on the Templates page and wait for APPROVED.</Alert>}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <form className="card space-y-4" onSubmit={send}>
          <h2 className="text-lg font-semibold">New campaign</h2>
          <div>
            <label className="label" htmlFor="k-name">Campaign name</label>
            <input id="k-name" className="input" placeholder="Campaign name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
          </div>
          <div>
            <label className="label" htmlFor="k-tpl">Template</label>
            <select id="k-tpl" className="input" value={f.tpl} onChange={(e) => pick(e.target.value)} required>
              <option value="">Choose an approved template</option>
              {tpls.map((x) => <option key={x.name + x.language} value={x.name + '|' + x.language}>{x.name} ({x.language})</option>)}
            </select>
          </div>
          {f.vars.map((v, i) => (
            <input key={i} className="input" placeholder={`Value for {{${i + 1}}}. Type {{name}} to use each contact's name`} value={v} onChange={(e) => setVar(i, e.target.value)} required />
          ))}
          {t && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <input className="input min-w-[12rem] flex-1" aria-label="Test number" placeholder="Test number with country code" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <button type="button" className="btn-ghost" disabled={busy || !phone.trim() || f.vars.some((x) => !x.trim())} onClick={sendTest}>Send test to this number</button>
            </div>
          )}
          <button className="btn w-full sm:w-auto" disabled={busy || !t}>Send to all opted-in contacts</button>
        </form>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Message preview</h2>
            <div className="rounded-lg bg-[#efeae2] p-4">
              <Bubble>{t ? preview : 'Choose a template to see the message'}</Bubble>
            </div>
          </div>
        </aside>
      </div>

      <h2 className="mb-3 mt-10 text-lg font-semibold">Campaign results</h2>
      {list.length === 0 ? <Empty title="No campaigns yet" desc="Your sent, delivered, read and failed counts will appear here and update live." /> : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead><tr><th className="th">Campaign</th><th className="th">Template</th><th className="th">Status</th><th className="th">Sent</th><th className="th">Delivered</th><th className="th">Read</th><th className="th">Failed</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c._id}>
                  <td className="td font-medium text-slate-900">{c.name}</td><td className="td">{c.templateName}</td>
                  <td className="td"><Badge kind={kindOf(c.status)}>{c.status}</Badge></td>
                  <td className="td">{count(c, 'sent', 'delivered', 'read')}/{c.messages.length}</td>
                  <td className="td">{count(c, 'delivered', 'read')}</td><td className="td">{count(c, 'read')}</td>
                  <td className="td">{count(c, 'failed')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
