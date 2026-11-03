'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Alert, Badge, Empty, PageHeader } from '@/components/ui';

const windowOpen = (c) => c.lastInboundAt && Date.now() - new Date(c.lastInboundAt).getTime() < 864e5;

export default function ContactsView() {
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({ name: '', phone: '' });
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const load = () => api.get('/contacts').then(setRows).catch((e) => setMsg(e.message));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault(); setMsg('');
    try { await api.post('/contacts', f); setF({ name: '', phone: '' }); load(); } catch (x) { setMsg(x.message); }
  };
  const importAll = async () => {
    setMsg('');
    try { const r = await api.post('/contacts/import', { text }); setMsg(`Added ${r.added}, skipped ${r.skipped} already saved`); setText(''); load(); } catch (x) { setMsg(x.message); }
  };

  return (
    <>
      <PageHeader title="Contacts" desc="Only add people who agreed to receive WhatsApp messages. Include the country code, e.g. 919876543210. Anyone who replies STOP is opted out automatically." />
      {msg && <Alert>{msg}</Alert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <form className="card space-y-3" onSubmit={add}>
          <h2 className="text-lg font-semibold">Add a contact</h2>
          <div>
            <label className="label" htmlFor="c-name">Name</label>
            <input id="c-name" className="input" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="c-phone">Phone</label>
            <input id="c-phone" className="input" placeholder="Phone with country code" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required />
          </div>
          <button className="btn">Add contact</button>
        </form>

        <section className="card space-y-3">
          <h2 className="text-lg font-semibold">Bulk import</h2>
          <textarea className="input" rows="4" aria-label="Bulk import" placeholder={'One per line:\nAsha,919876543210'} value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn-ghost" onClick={importAll} disabled={!text.trim()}>Import contacts</button>
        </section>
      </div>

      <h2 className="mb-3 mt-10 text-lg font-semibold">Your contacts <span className="text-sm font-normal text-slate-500">({rows.length})</span></h2>
      {rows.length === 0 ? <Empty title="No contacts yet" desc="Add a contact or paste a list above." /> : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead><tr><th className="th">Name</th><th className="th">Phone</th><th className="th">Opted in</th><th className="th">Reply window</th><th className="th" /></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c._id}>
                  <td className="td font-medium text-slate-900">{c.name || '-'}</td>
                  <td className="td">{c.phone}</td>
                  <td className="td"><Badge kind={c.optedIn ? 'ok' : 'muted'}>{c.optedIn ? 'Yes' : 'No'}</Badge></td>
                  <td className="td"><Badge kind={windowOpen(c) ? 'ok' : 'muted'}>{windowOpen(c) ? 'Open' : 'Closed'}</Badge></td>
                  <td className="td text-right"><button className="btn-danger-link" onClick={async () => { await api.del('/contacts/' + c._id); load(); }}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
