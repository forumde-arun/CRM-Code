import { useEffect, useState } from 'react';
import { api } from '../api.js';

const windowOpen = (c) => c.lastInboundAt && Date.now() - new Date(c.lastInboundAt).getTime() < 864e5;

export default function Contacts() {
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
      <h2>Contacts</h2>
      <p className="muted">Only add people who agreed to receive WhatsApp messages. Include the country code, e.g. 919876543210. Anyone who replies STOP is opted out automatically.</p>
      {msg && <p className="note">{msg}</p>}
      <section className="card">
        <form className="row" onSubmit={add}>
          <input placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input placeholder="Phone with country code" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required />
          <button>Add contact</button>
        </form>
        <textarea rows="3" placeholder={'Bulk import, one per line:\nAsha,919876543210'} value={text} onChange={(e) => setText(e.target.value)} />
        <button className="ghost" onClick={importAll} disabled={!text.trim()}>Import contacts</button>
      </section>
      {rows.length === 0 ? <p className="muted">No contacts yet.</p> : (
        <table><thead><tr><th>Name</th><th>Phone</th><th>Opted in</th><th>Reply window</th><th></th></tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={c._id}><td>{c.name || '-'}</td><td>{c.phone}</td><td>{c.optedIn ? 'Yes' : 'No'}</td><td>{windowOpen(c) ? 'Open' : 'Closed'}</td>
              <td><button className="link" onClick={async () => { await api.del('/contacts/' + c._id); load(); }}>Remove</button></td></tr>
          ))}</tbody></table>
      )}
    </>
  );
}
