'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Alert, Badge, PageHeader, Spinner } from '@/components/ui';

const META = { appId: process.env.NEXT_PUBLIC_META_APP_ID, configId: process.env.NEXT_PUBLIC_META_CONFIG_ID, version: process.env.NEXT_PUBLIC_GRAPH_VERSION || 'v21.0' };

const loadSdk = () => new Promise((resolve) => {
  if (window.FB) return resolve();
  window.fbAsyncInit = () => { window.FB.init({ appId: META.appId, autoLogAppEvents: true, xfbml: true, version: META.version }); resolve(); };
  const s = document.createElement('script');
  s.src = 'https://connect.facebook.net/en_US/sdk.js'; s.async = true;
  document.body.appendChild(s);
});

const steps = ['Click Connect WhatsApp', 'Sign in with Meta and choose your business account', 'Enter and verify your phone number'];

export default function ConnectionView() {
  const [st, setSt] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [m, setM] = useState({ wabaId: '', phoneNumberId: '', token: '' });

  const load = () => api.get('/connection/status').then(setSt).catch((e) => setMsg(e.message));
  useEffect(() => { load(); }, []);

  const connect = async () => {
    setMsg(''); setBusy(true);
    let session = null;
    const onMsg = (e) => {
      try {
        if (!new URL(e.origin).hostname.endsWith('facebook.com')) return;
        const d = JSON.parse(e.data);
        if (d.type === 'WA_EMBEDDED_SIGNUP') session = d.event === 'FINISH' ? d.data : { cancel: true };
      } catch { /* not a signup message */ }
    };
    window.addEventListener('message', onMsg);
    try {
      if (!META.appId || !META.configId) throw new Error('Set NEXT_PUBLIC_META_APP_ID and NEXT_PUBLIC_META_CONFIG_ID in frontend/.env.local, then restart npm run dev');
      await loadSdk();
      const resp = await new Promise((r) => window.FB.login(r, { config_id: META.configId, response_type: 'code', override_default_response_type: true, extras: { setup: {}, sessionInfoVersion: '3' } }));
      const code = resp.authResponse && resp.authResponse.code;
      if (!code) throw new Error('Signup was cancelled before it finished');
      for (let i = 0; i < 50 && !session; i++) await new Promise((r) => setTimeout(r, 100));
      if (!session || session.cancel) throw new Error('Meta did not return your WhatsApp account. Please try again.');
      const r = await api.post('/connection/embedded', { code, wabaId: session.waba_id, phoneNumberId: session.phone_number_id });
      setMsg(r.warnings && r.warnings.length ? 'Connected. ' + r.warnings.join(' ') : 'WhatsApp connected');
      await load();
    } catch (e) { setMsg(e.message); }
    finally { window.removeEventListener('message', onMsg); setBusy(false); }
  };

  const manual = async (e) => {
    e.preventDefault(); setMsg(''); setBusy(true);
    try { await api.post('/connection/manual', m); setMsg('WhatsApp connected'); await load(); }
    catch (x) { setMsg(x.message); }
    finally { setBusy(false); }
  };

  const disconnect = async () => { await api.del('/connection'); setMsg('Disconnected'); load(); };

  const rows = st && st.status !== 'none' ? [['Number', st.displayPhone || '-'], ['Business name', st.verifiedName || '-'], ['Quality rating', st.quality || '-'], ['WABA ID', st.wabaId]] : [];

  return (
    <>
      <PageHeader title="Connection" desc="Link your WhatsApp Business number once. Your connection is stored securely and reused for every campaign." />
      {msg && <Alert>{msg}</Alert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card" aria-labelledby="connect-h">
          <h2 id="connect-h" className="text-lg font-semibold">Connect WhatsApp</h2>
          <ol className="mt-3 space-y-2">
            {steps.map((s, i) => (
              <li key={s} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">{i + 1}</span>{s}
              </li>
            ))}
          </ol>
          <button className="btn mt-5 w-full sm:w-auto" onClick={connect} disabled={busy}>{busy ? 'Connecting…' : 'Connect WhatsApp'}</button>

          <details className="mt-6 border-t border-slate-200 pt-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-800">Developer connect (System User token)</summary>
            <form onSubmit={manual} className="mt-4 space-y-3">
              <input className="input" placeholder="WhatsApp Business Account ID" value={m.wabaId} onChange={(e) => setM({ ...m, wabaId: e.target.value })} required />
              <input className="input" placeholder="Phone number ID" value={m.phoneNumberId} onChange={(e) => setM({ ...m, phoneNumberId: e.target.value })} required />
              <input type="password" className="input" placeholder="System User access token" value={m.token} onChange={(e) => setM({ ...m, token: e.target.value })} required />
              <button className="btn-ghost" disabled={busy}>Save connection</button>
            </form>
          </details>
        </section>

        <section className="card" aria-labelledby="status-h">
          <h2 id="status-h" className="text-lg font-semibold">Connection status</h2>
          {!st ? (
            <div className="mt-4 flex items-center gap-3 text-sm text-slate-500"><Spinner /> Checking…</div>
          ) : st.status === 'none' ? (
            <p className="mt-3 text-sm text-slate-500">No WhatsApp number connected yet.</p>
          ) : (
            <>
              <div className="mt-3"><Badge kind={st.connected ? 'ok' : 'bad'}>{st.connected ? 'Connected' : 'Needs reconnect'}</Badge></div>
              <dl className="mt-4 divide-y divide-slate-100 text-sm">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-slate-500">{k}</dt><dd className="break-all text-right font-medium text-slate-900">{v}</dd></div>
                ))}
              </dl>
              <div className="mt-5 flex gap-3">
                <button className="btn-ghost" onClick={load}>Refresh</button>
                <button className="btn-ghost" onClick={disconnect}>Disconnect</button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
