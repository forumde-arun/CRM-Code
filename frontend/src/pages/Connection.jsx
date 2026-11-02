import { useEffect, useState } from 'react';
import { api } from '../api.js';

const META = { appId: import.meta.env.VITE_META_APP_ID, configId: import.meta.env.VITE_META_CONFIG_ID, version: import.meta.env.VITE_GRAPH_VERSION || 'v21.0' };

const loadSdk = () => new Promise((resolve) => {
  if (window.FB) return resolve();
  window.fbAsyncInit = () => { window.FB.init({ appId: META.appId, autoLogAppEvents: true, xfbml: true, version: META.version }); resolve(); };
  const s = document.createElement('script');
  s.src = 'https://connect.facebook.net/en_US/sdk.js'; s.async = true;
  document.body.appendChild(s);
});

export default function Connection() {
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
      if (!META.appId || !META.configId) throw new Error('Set VITE_META_APP_ID and VITE_META_CONFIG_ID in frontend/.env');
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

  return (
    <>
      <h2>Connection</h2>
      {msg && <p className="note">{msg}</p>}
      <section className="card">
        <h3>Connect WhatsApp</h3>
        <p className="muted">Sign in with Meta, choose or create your WhatsApp Business account and verify your number. FlowWA saves the connection securely, so you only do this once.</p>
        <button onClick={connect} disabled={busy}>{busy ? 'Connecting…' : 'Connect WhatsApp'}</button>
        <details>
          <summary>Developer connect (System User token)</summary>
          <form onSubmit={manual}>
            <input placeholder="WhatsApp Business Account ID" value={m.wabaId} onChange={(e) => setM({ ...m, wabaId: e.target.value })} required />
            <input placeholder="Phone number ID" value={m.phoneNumberId} onChange={(e) => setM({ ...m, phoneNumberId: e.target.value })} required />
            <input type="password" placeholder="System User access token" value={m.token} onChange={(e) => setM({ ...m, token: e.target.value })} required />
            <button disabled={busy}>Save connection</button>
          </form>
        </details>
      </section>
      <section className="card">
        <h3>Connection status</h3>
        {!st ? <p className="muted">Checking…</p> : st.status === 'none' ? <p className="muted">No WhatsApp number connected yet.</p> : (
          <>
            <p><span className={'pill ' + (st.connected ? 'ok' : 'bad')}>{st.connected ? 'Connected' : 'Needs reconnect'}</span></p>
            <dl>
              <dt>Number</dt><dd>{st.displayPhone || '-'}</dd>
              <dt>Business name</dt><dd>{st.verifiedName || '-'}</dd>
              <dt>Quality rating</dt><dd>{st.quality || '-'}</dd>
              <dt>WABA ID</dt><dd>{st.wabaId}</dd>
            </dl>
            <button className="ghost" onClick={load}>Refresh</button> <button className="ghost" onClick={disconnect}>Disconnect</button>
          </>
        )}
      </section>
    </>
  );
}
