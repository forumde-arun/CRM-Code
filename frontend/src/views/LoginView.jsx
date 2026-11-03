'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Logo } from '@/components/Icon';

const points = [
  ['Connect in one click', 'Link your WhatsApp Business number through Meta. No tokens to copy.'],
  ['Send approved templates', 'Build a template, test it on one number, then message all opted-in contacts.'],
  ['Track every message', 'Watch sent, delivered, read and failed counts update live.'],
];

export default function LoginView() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const isLogin = mode === 'login';

  useEffect(() => { if (localStorage.getItem('token')) router.replace('/connection'); }, [router]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const switchMode = (m) => { setMode(m); setErr(''); };

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const token = (await api.post('/auth/' + mode, f)).token;
      localStorage.setItem('token', token);
      router.replace('/connection');
    } catch (x) { setErr(x.message); }
    finally { setBusy(false); }
  };

  const tab = (on) => 'rounded-md px-3 py-2 text-sm font-semibold transition ' + (on ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900');

  return (
    <div className="grid min-h-screen lg:grid-cols-[5fr_6fr]">
      <aside className="hidden flex-col justify-center gap-8 bg-gradient-to-br from-brand-900 to-brand-600 px-14 py-12 text-white lg:flex">
        <div className="flex items-center gap-3 text-xl font-bold"><Logo className="h-9 w-9" /> CRM</div>
        <h2 className="max-w-md text-3xl font-semibold leading-tight">Run WhatsApp campaigns from one workspace</h2>
        <ul className="max-w-md space-y-5">
          {points.map(([t, d]) => (
            <li key={t}><p className="font-semibold">{t}</p><p className="text-sm text-white/75">{d}</p></li>
          ))}
        </ul>
        <p className="text-xs text-white/60">Messages are sent through the official WhatsApp Business Platform.</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div className="flex items-center gap-2.5 lg:hidden"><Logo /><span className="text-lg font-bold">CRM</span></div>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-200/70 p-1" role="tablist">
            <button type="button" role="tab" aria-selected={isLogin} className={tab(isLogin)} onClick={() => switchMode('login')}>Sign in</button>
            <button type="button" role="tab" aria-selected={!isLogin} className={tab(!isLogin)} onClick={() => switchMode('register')}>Create account</button>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{isLogin ? 'Welcome back' : 'Create your workspace'}</h1>
            <p className="mt-1 text-sm text-slate-500">{isLogin ? 'Sign in to manage your WhatsApp campaigns.' : 'Set up your account in under a minute.'}</p>
          </div>

          {!isLogin && (
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" className="input" autoComplete="name" placeholder="Your name" value={f.name} onChange={set('name')} required />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Work email</label>
            <input id="email" type="email" className="input" autoComplete="email" placeholder="you@company.com" value={f.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <input id="password" type={show ? 'text' : 'password'} className="input pr-16" autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={6} placeholder={isLogin ? 'Your password' : 'At least 6 characters'} value={f.password} onChange={set('password')} required />
              <button type="button" className="btn-link absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button>
            </div>
          </div>

          {err && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <button className="btn w-full py-3" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}</button>
        </form>
      </main>
    </div>
  );
}
