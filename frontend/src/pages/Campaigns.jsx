import { useEffect, useState } from 'react';
import { api } from '../api.js';

const count = (c, ...s) => c.messages.filter((m) => s.includes(m.status)).length;
const bodyOf = (t) => t?.components?.find((c) => c.type === 'BODY')?.text || '';
const nVars = (t) => new Set(bodyOf(t).match(/\{\{\d+\}\}/g) || []).size;

export default function Campaigns() {
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
      <h2>Campaigns</h2>
      {msg && <p className="note">{msg}</p>}
      {tpls.length === 0 && <p className="muted">No approved templates yet. Create one on the Templates page and wait for APPROVED.</p>}
      <form className="card" onSubmit={send}>
        <input placeholder="Campaign name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        <select value={f.tpl} onChange={(e) => pick(e.target.value)} required>
          <option value="">Choose an approved template</option>
          {tpls.map((x) => <option key={x.name + x.language} value={x.name + '|' + x.language}>{x.name} ({x.language})</option>)}
        </select>
        {f.vars.map((v, i) => (
          <input key={i} placeholder={`Value for {{${i + 1}}}. Type {{name}} to use each contact's name`} value={v} onChange={(e) => setVar(i, e.target.value)} required />
        ))}
        {t && <div className="bubble">{preview}</div>}
        {t && (
          <div className="row">
            <input placeholder="Test number with country code" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button type="button" className="ghost" disabled={busy || !phone.trim() || f.vars.some((x) => !x.trim())} onClick={sendTest}>Send test to this number</button>
          </div>
        )}
        <button disabled={busy || !t}>Send to all opted-in contacts</button>
      </form>
      {list.length === 0 ? <p className="muted">No campaigns yet.</p> : (
        <table><thead><tr><th>Campaign</th><th>Template</th><th>Status</th><th>Sent</th><th>Delivered</th><th>Read</th><th>Failed</th></tr></thead>
          <tbody>{list.map((c) => (
            <tr key={c._id}><td>{c.name}</td><td>{c.templateName}</td><td>{c.status}</td>
              <td>{count(c, 'sent', 'delivered', 'read')}/{c.messages.length}</td><td>{count(c, 'delivered', 'read')}</td><td>{count(c, 'read')}</td><td>{count(c, 'failed')}</td></tr>
          ))}</tbody></table>
      )}
    </>
  );
}