
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';

import { auth, googleProvider } from '@/lib/firebase';
import { authApi } from '@/lib/auth-api';
import { Logo } from '@/components/Icon';

export default function SignupView() {
  const router = useRouter();

  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  // Redirect already authenticated users
  useEffect(() => {
    if (localStorage.getItem('token')) {
      router.replace('/connection');
    }
  }, [router]);

  // Google signup using Firebase
  const signUpWithGoogle = async () => {
    setErr('');
    setBusy(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);

      const idToken = await result.user.getIdToken();

      if (!idToken) {
        throw new Error('Unable to retrieve Google authentication token.');
      }

      // Backend verifies Firebase token and creates/finds MongoDB user
      const response = await authApi.googleLogin(idToken);

      if (!response?.token) {
        throw new Error(
          'Backend did not return an authentication token.'
        );
      }

      localStorage.setItem('token', response.token);

      router.replace('/connection');
    } catch (error) {
      console.error('Google signup error:', error);

      if (error.code === 'auth/popup-closed-by-user') {
        setErr('Google sign-up was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setErr('Your browser blocked the Google sign-in popup.');
      } else {
        setErr(error.message || 'Google signup failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  // Email and password signup using MongoDB
  const submit = async (event) => {
    event.preventDefault();
    setErr('');

    const name = f.name.trim();
    const email = f.email.trim().toLowerCase();
    const password = f.password;

    if (!name || !email) {
      setErr('Please enter your name and email address.');
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setErr('Password must contain between 8 and 72 characters.');
      return;
    }

    setBusy(true);

    try {
      const result = await authApi.signup({
        name,
        email,
        password,
      });

      if (!result?.token) {
        throw new Error(
          'Backend did not return an authentication token.'
        );
      }

      localStorage.setItem('token', result.token);

      router.replace('/connection');
    } catch (error) {
      setErr(error.message || 'Unable to create your account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-green-800 to-emerald-600 px-5 py-10">

      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-lime-300/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">

        {/* Signup card */}
        <div className="space-y-6 rounded-3xl border border-white/40 bg-white p-7 shadow-2xl shadow-emerald-950/20 sm:p-9">

          {/* Logo */}
          <div className="flex items-center justify-center gap-2">
            <Logo />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              CRM
            </span>
          </div>

          {/* Heading */}
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Create your workspace
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Get started with your WhatsApp CRM account.
            </p>
          </div>

          {/* Signup form */}
          <form onSubmit={submit} className="space-y-4">

            <div>
              <label className="label" htmlFor="name">
                Full name
              </label>

              <input
                id="name"
                className="input"
                autoComplete="name"
                placeholder="Your name"
                value={f.name}
                onChange={(e) =>
                  setF({ ...f, name: e.target.value })
                }
                maxLength={100}
                required
              />
            </div>

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
                value={f.email}
                onChange={(e) =>
                  setF({ ...f, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  className="input pr-16"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  placeholder="At least 8 characters"
                  value={f.password}
                  onChange={(e) =>
                    setF({ ...f, password: e.target.value })
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

              <p className="mt-1.5 text-xs text-slate-400">
                Use between 8 and 72 characters.
              </p>
            </div>

            {/* Error message */}
            {err && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {err}
              </p>
            )}

            {/* Create account */}
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
            >
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>

            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-medium tracking-wide text-slate-400">
                OR SIGN UP WITH
              </span>
            </div>
          </div>

          {/* Google signup */}
          <button
            type="button"
            onClick={signUpWithGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />
            {busy ? 'Please wait…' : 'Continue with Google'}
          </button>

          {/* Login navigation */}
          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}

            <button
              type="button"
              onClick={() => router.push('/login')}
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/70">
          Securely manage your WhatsApp Business workspace.
        </p>
      </div>
    </main>
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
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.9 46.98 24.55z"
      />

      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />

      <path
        fill="#FBBC05"
        d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a24 24 0 0 0 0 21.56l7.98-6.19z"
      />

      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
    </svg>
  );
}
