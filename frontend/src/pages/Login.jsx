import { useState } from 'react';
import { api } from '../api.js';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { onLogin((await api.post('/auth/' + mode, f)).token); }
    catch (x) { setErr(x.message); }
    finally { setBusy(false); }
  };
  return (
    <form className="auth card" onSubmit={submit}>
      <h1>FlowWA</h1>
      <p className="muted">{mode === 'login' ? 'Sign in to your workspace' : 'Create your workspace'}</p>
      {mode === 'register' && <input placeholder="Your name" value={f.name} onChange={set('name')} required />}
      <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
      <input type="password" placeholder="Password (6+ characters)" value={f.password} onChange={set('password')} required />
      {err && <p className="err">{err}</p>}
      <button disabled={busy}>{mode === 'login' ? 'Sign in' : 'Create account'}</button>
      <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
      </button>
    </form>
  );
}
