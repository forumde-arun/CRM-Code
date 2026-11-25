
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { authApi } from '@/lib/auth-api';
import { Logo } from '@/components/Icon';

export default function ForgotPasswordView() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setErr('');
    setSuccess(false);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErr('Please enter your registered email address.');
      return;
    }

    setBusy(true);

    try {
      await authApi.forgotPassword(normalizedEmail);

      // Keep the response generic to avoid revealing whether an account exists.
      setSuccess(true);
    } catch (error) {
      setErr(
        error.message || 'Unable to process your request. Please try again.'
      );
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

        {/* Forgot password card */}
        <div className="space-y-6 rounded-3xl border border-white/40 bg-white p-7 shadow-2xl shadow-emerald-950/20 sm:p-9">

          {/* Logo */}
          <div className="flex items-center justify-center gap-2">
            <Logo />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              CRM
            </span>
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
                <path d="M16 3v4" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Forgot your password?
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              No worries. Enter your registered email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Success message */}
          {success ? (
            <div className="space-y-4">

              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                </div>

                <p className="text-sm font-semibold text-emerald-800">
                  Check your inbox
                </p>

                <p className="mt-1 text-sm leading-relaxed text-emerald-700">
                  If an account exists for this email, you'll receive a password reset link shortly.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Back to sign in
              </button>

              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="w-full text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Try another email
              </button>

            </div>
          ) : (

            /* Forgot password form */
            <form onSubmit={submit} className="space-y-4">

              <div>
                <label className="label" htmlFor="email">
                  Registered email address
                </label>

                <input
                  id="email"
                  type="email"
                  className="input"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Error */}
              {err && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {err}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
              >
                {busy ? 'Sending reset link…' : 'Send reset link'}
              </button>

            </form>
          )}

          {/* Login navigation */}
          {!success && (
            <p className="text-center text-sm text-slate-500">
              Remember your password?{' '}

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Back to sign in
              </button>
            </p>
          )}

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/70">
          Securely manage your WhatsApp Business workspace.
        </p>

      </div>
    </main>
  );
}
