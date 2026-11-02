import { useEffect, useState } from 'react';
import { api } from '../api.js';

const vars = (t) => [...new Set(t.match(/\{\{\d+\}\}/g) || [])];
const empty = { name: '', category: 'MARKETING', language: 'en_US', header: '', text: '', samples: [], footer: '', buttons: [] };

export default function Templates() {
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
      <h2>Templates</h2>
      <p className="muted">Create a message, submit it to Meta, and use it in campaigns once it shows APPROVED.</p>
      {err && <p className="err">{err}</p>}
      {msg && <p className="note">{msg}</p>}
      <form className="card" onSubmit={create}>
        <input placeholder="Template name, e.g. weekend_offer" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} required />
        <div className="row">
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            <option value="MARKETING">Marketing (offers, promotions)</option>
            <option value="UTILITY">Utility (orders, account updates)</option>
          </select>
          <select value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })}>
            <option value="en_US">English (US)</option>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>
        <input placeholder="Header (optional, max 60 characters, no variables)" maxLength={60} value={f.header} onChange={(e) => setF({ ...f, header: e.target.value })} />
        <textarea rows="4" maxLength={1024} placeholder={'Message text. Use {{1}}, {{2}} for variables, e.g.\nHi {{1}}, our weekend sale starts today.'} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} required />
        {Array.from({ length: n }, (_, i) => (
          <input key={i} placeholder={`Sample value for {{${i + 1}}} (shown to Meta reviewers)`} value={f.samples[i] || ''} onChange={(e) => setSample(i, e.target.value)} required />
        ))}
        <input placeholder="Footer (optional, max 60 characters)" maxLength={60} value={f.footer} onChange={(e) => setF({ ...f, footer: e.target.value })} />
        {f.buttons.map((b, i) => (
          <div className="row" key={i}>
            <input placeholder={b.type === 'URL' ? 'Link button text' : 'Quick reply text'} maxLength={25} value={b.text} onChange={(e) => setBtn(i, 'text', e.target.value)} required />
            {b.type === 'URL' && <input placeholder="https://example.com" value={b.url} onChange={(e) => setBtn(i, 'url', e.target.value)} required />}
            <button type="button" className="link" onClick={() => delBtn(i)}>Remove</button>
          </div>
        ))}
        {f.buttons.length < 3 && (
          <div className="row">
            <button type="button" className="ghost" onClick={() => addBtn('QUICK_REPLY')}>Add quick reply button</button>
            <button type="button" className="ghost" onClick={() => addBtn('URL')}>Add link button</button>
          </div>
        )}
        <div className="bubble">
          {f.header && <b>{f.header}</b>}
          <div>{shown || 'Your message preview appears here'}</div>
          {f.footer && <small>{f.footer}</small>}
          {f.buttons.map((b, i) => <div className="btn" key={i}>{b.text || 'Button'}</div>)}
        </div>
        <button disabled={busy}>Submit template to Meta</button>
      </form>
      <button className="ghost" onClick={load}>Refresh</button>
      {rows && rows.length === 0 && <p className="note">No templates found for this WhatsApp account yet.</p>}
      {rows && rows.length > 0 && (
        <table><thead><tr><th>Name</th><th>Category</th><th>Language</th><th>Status</th><th></th></tr></thead>
          <tbody>{rows.map((t) => (
            <tr key={t.id || t.name + t.language}>
              <td>{t.name}</td><td>{t.category}</td><td>{t.language}</td>
              <td><span className={'pill ' + (t.status === 'APPROVED' ? 'ok' : 'bad')}>{t.status}</span>
                {t.rejected_reason && t.rejected_reason !== 'NONE' && <div className="muted">{t.rejected_reason}</div>}</td>
              <td><button className="link" onClick={() => remove(t.name)}>Delete</button></td>
            </tr>
          ))}</tbody></table>
      )}
    </>
  );
}