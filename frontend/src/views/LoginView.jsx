
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';

import { auth, googleProvider } from '@/lib/firebase';
import { authApi } from '@/lib/auth-api';
import { Logo } from '@/components/Icon';

const points = [
  [
    'Connect in one click',
    'Link your WhatsApp Business number through Meta. No tokens to copy.',
  ],
  [
    'Send approved templates',
    'Build a template, test it on one number, then message opted-in contacts.',
  ],
  [
    'Track every message',
    'Watch sent, delivered, read and failed counts update live.',
  ],
];

export default function LoginView() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem('token')) {
      router.replace('/connection');
    }
  }, [router]);

  // Email and password login (MongoDB)
  const submit = async (event) => {
    event.preventDefault();

    setErr('');

    const email = form.email.trim().toLowerCase();

    if (!email || !form.password) {
      setErr('Please enter your email and password.');
      return;
    }

    setBusy(true);

    try {
      const result = await authApi.login({
        email,
        password: form.password,
      });

      if (!result?.token) {
        throw new Error(
          'Backend did not return an authentication token.'
        );
      }

      localStorage.setItem('token', result.token);

      router.replace('/connection');
    } catch (error) {
      setErr(error.message || 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  // Google sign-in (Firebase authentication + MongoDB backend)
const signInWithGoogle = async () => {
  setErr('');
  setBusy(true);

  try {
    const result = await signInWithPopup(auth, googleProvider);

    // Get Firebase ID token, NOT Google OAuth access token.
    const idToken = await result.user.getIdToken(true);

    console.log('Firebase user:', result.user.email);
    console.log('Firebase token received:', Boolean(idToken));

    const response = await authApi.googleLogin(idToken);

    if (!response?.token) {
      throw new Error('CRM authentication token was not returned.');
    }

    localStorage.setItem('token', response.token);

    router.replace('/connection');
  } catch (error) {
    console.error('Google sign-in error:', error);
    setErr(error.message || 'Google sign-in failed.');
  } finally {
    setBusy(false);
  }
};

  return (
    <div className="grid min-h-screen lg:grid-cols-[5fr_6fr]">

      {/* Left information panel */}
      <aside className="hidden flex-col justify-center gap-8 bg-gradient-to-br from-brand-900 to-brand-600 px-14 py-12 text-white lg:flex">

        <div className="flex items-center gap-3 text-xl font-bold">
          <Logo className="h-9 w-9" />
          CRM
        </div>

        <h2 className="max-w-md text-3xl font-semibold leading-tight">
          Run WhatsApp campaigns from one workspace
        </h2>

        <ul className="max-w-md space-y-5">
          {points.map(([title, description]) => (
            <li key={title}>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-white/75">
                {description}
              </p>
            </li>
          ))}
        </ul>

        <p className="text-xs text-white/60">
          Messages are sent through the official WhatsApp Business Platform.
        </p>
      </aside>

      {/* Login form */}
      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-5">

          <div className="flex items-center gap-2.5 lg:hidden">
            <Logo />
            <span className="text-lg font-bold">CRM</span>
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Sign in to manage your WhatsApp campaigns.
            </p>
          </div>

          {/* Email login */}
          <form onSubmit={submit} className="space-y-4">

            <div>
              <label className="label" htmlFor="email">
                Work email
              </label>

              <input
                id="email"
                type="email"
                className="input"
                autoComplete="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="label" htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="text-sm font-medium text-brand-700 hover:underline"
                  onClick={() => router.push('/forgot-password')}
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  className="input pr-16"
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                  required
                />

                <button
                  type="button"
                  className="btn-link absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {err && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {err}
              </p>
            )}

            <button
              type="submit"
              className="btn w-full py-3"
              disabled={busy}
            >
              {busy ? 'Please wait…' : 'Sign in'}
            </button>

          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>

            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-500">
                OR CONTINUE WITH
              </span>
            </div>
          </div>

          {/* Google login */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />

            {busy ? 'Please wait…' : 'Continue with Google'}
          </button>

          {/* Signup navigation */}
          <p className="text-center text-sm text-slate-500">
            Don't have an account?{' '}

            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="font-semibold text-brand-700 hover:underline"
            >
              Create account
            </button>
          </p>

        </div>
      </main>
    </div>
  );
}

// Google icon
function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        transform="translate(0 5)"
      />

      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.9 46.98 24.55z"
      />

      <path
        fill="#FBBC05"
        d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a24 24 0 0 0 0 21.56l7.98-6.19z"
      />

      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
