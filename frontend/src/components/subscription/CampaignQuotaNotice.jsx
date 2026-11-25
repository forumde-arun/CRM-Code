
'use client';

import { useCallback, useEffect, useState } from 'react';
import subscriptionApi from '@/lib/subscription-api';

export default function CampaignQuotaNotice() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadSubscription = useCallback(async () => {
    try {
      setError(false);

      const response =
        await subscriptionApi.getMySubscription();

      const data = response?.data ?? response;

      setSubscription(data?.subscription ?? data);
    } catch (err) {
      console.error(
        '[CAMPAIGN QUOTA] Failed to load subscription:',
        err
      );

      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  if (loading) {
    return (
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">
          Loading message allowance...
        </p>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          Unable to load your subscription details.
          Message sending will still be validated by the backend.
        </p>

        <button
          type="button"
          onClick={loadSubscription}
          className="mt-2 text-sm font-semibold text-amber-900 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const limit = Number(subscription.messageLimit || 0);

  const used = Number(
    subscription.messagesUsed ??
    subscription.usedMessages ??
    0
  );

  const remaining = Number(
    subscription.messagesRemaining ?? 0
  );

  const percentage = limit > 0
    ? Math.min(100, Math.max(0, (used / limit) * 100))
    : 0;

  const blocked =
    subscription.canSendMessages === false ||
    remaining <= 0;

  return (
    <section
      className={`mb-5 rounded-xl border p-4 ${
        blocked
          ? 'border-red-200 bg-red-50'
          : 'border-gray-200 bg-white'
      }`}
    >

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>

          <p className="text-sm font-bold text-gray-900">
            {subscription.planName ||
              subscription.planCode ||
              'Current Plan'}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            WhatsApp message allowance
          </p>

        </div>

        {blocked ? (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Sending unavailable
          </span>
        ) : (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Active
          </span>
        )}

      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">

        <div>

          <p className="text-3xl font-bold text-gray-900">
            {remaining.toLocaleString('en-IN')}
          </p>

          <p className="text-xs text-gray-500">
            Messages remaining
          </p>

        </div>

        <p className="text-sm text-gray-500">
          {used.toLocaleString('en-IN')} used /{' '}
          {limit.toLocaleString('en-IN')} total
        </p>

      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">

        <div
          className={`h-full rounded-full transition-all ${
            blocked ? 'bg-red-500' : 'bg-blue-600'
          }`}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

      {blocked && (
        <div className="mt-4">

          <p className="text-sm text-red-700">
            Your message allowance is exhausted or your
            subscription does not currently permit sending.
          </p>

          <a
            href="/subscription"
            className="mt-3 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            View subscription plans
          </a>

        </div>
      )}

      {!blocked && remaining <= 10 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">

          <p className="text-xs text-amber-700">
            Your message allowance is running low.
          </p>

          <a
            href="/subscription"
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Upgrade plan
          </a>

        </div>
      )}

    </section>
  );
}
