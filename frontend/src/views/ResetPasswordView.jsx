
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { authApi } from '@/lib/auth-api';
import { Logo } from '@/components/Icon';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (event) => {
    event.preventDefault();

    setErr('');
    setSuccess('');

    if (!token) {
      setErr('Password reset link is missing or invalid.');
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setErr('Password must contain between 8 and 72 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErr('Passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      const result = await authApi.resetPassword({
        token,
        password,
      });

      setSuccess(
        result.message || 'Your password has been reset successfully.'
      );

      setTimeout(() => {
        router.replace('/login');
      }, 1800);
    } catch (error) {
      setErr(error.message || 'Unable to reset your password.');
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

        {/* Reset password card */}
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

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
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
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                <path d="M12 14v3" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Create a new password
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Choose a strong password to securely regain access to your CRM account.
            </p>
          </div>

          {/* Reset form */}
          <form onSubmit={submit} className="space-y-4">

            <div>
              <label className="label" htmlFor="password">
                New password
              </label>

              <input
                id="password"
                type={show ? 'text' : 'password'}
                className="input"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="confirmPassword">
                Confirm password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={show ? 'text' : 'password'}
                  className="input pr-16"
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="btn-link absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Hide passwords' : 'Show passwords'}
                >
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Password must contain between 8 and 72 characters.
            </p>

            {/* Error */}
            {err && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {err}
              </p>
            )}

            {/* Success */}
            {success && (
              <p
                role="status"
                className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
              >
                {success}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy || !token}
            >
              {busy ? 'Updating password…' : 'Reset password'}
            </button>

          </form>

          {/* Login navigation */}
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

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/70">
          Securely manage your WhatsApp Business workspace.
        </p>

      </div>
    </main>
  );
}

export default function ResetPasswordView() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-emerald-950 text-white">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
