
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import subscriptionApi from '@/lib/subscription-api';

function formatMoney(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getData(response) {
  return response?.data ?? response ?? {};
}

function getSubscriptionData(response) {
  const data = getData(response);
  return data?.subscription ?? data;
}

function getPlanPrice(plan, cycle) {
  const price = plan?.pricing?.[cycle];

  if (typeof price?.displayAmount === 'number') {
    return price.displayAmount;
  }

  if (typeof price?.amount === 'number') {
    // Razorpay-style amount is generally in paise.
    return price.amount / 100;
  }

  return 0;
}

async function loadRazorpay() {
  if (typeof window === 'undefined') return false;

  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const existing = document.querySelector(
      'script[data-razorpay-checkout]'
    );

    if (existing) {
      existing.addEventListener('load', () => resolve(true), {
        once: true,
      });

      existing.addEventListener('error', () => resolve(false), {
        once: true,
      });

      return;
    }

    const script = document.createElement('script');

    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">
        {Number(value || 0).toLocaleString('en-IN')}
      </p>
    </div>
  );
}

export default function SubscriptionPanel() {
  const [plansData, setPlansData] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);

  const [cycle, setCycle] = useState('monthly');

  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refresh = useCallback(async () => {
    const [plansResponse, subscriptionResponse, paymentResponse] =
      await Promise.all([
        subscriptionApi.getPlans(),
        subscriptionApi.getMySubscription(),
        subscriptionApi.getPaymentHistory(),
      ]);

    const plans = getData(plansResponse);
    const currentSubscription = getSubscriptionData(
      subscriptionResponse
    );

    const history = Array.isArray(paymentResponse)
      ? paymentResponse
      : paymentResponse?.payments || [];

    setPlansData(plans);
    setSubscription(currentSubscription);
    setPayments(history);
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await refresh();
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load subscription.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [refresh]);

  const usedMessages = Number(
    subscription?.messagesUsed ??
    subscription?.usedMessages ??
    0
  );

  const remainingMessages = Number(
    subscription?.messagesRemaining ?? 0
  );

  const messageLimit = Number(
    subscription?.messageLimit ?? 0
  );

  const progress = useMemo(() => {
    if (!messageLimit) return 0;

    return Math.min(
      100,
      Math.max(0, (usedMessages / messageLimit) * 100)
    );
  }, [usedMessages, messageLimit]);

  const currentPlanCode = String(
    subscription?.planCode || ''
  ).toLowerCase();

  const isFreePlan =
    currentPlanCode === 'free' ||
    currentPlanCode === 'free_trial';

  async function handlePurchase(plan) {
    if (buying) return;

    setError('');
    setSuccess('');
    setBuying(plan.code);

    try {
      const loaded = await loadRazorpay();

      if (!loaded || !window.Razorpay) {
        throw new Error(
          'Unable to load Razorpay Checkout. Check your internet connection.'
        );
      }

      // Step 1: Create order using backend.
      const orderResponse =
        await subscriptionApi.createPaymentOrder(
          plan.code,
          cycle
        );

      const order = getData(orderResponse);

      if (
        !order.orderId ||
        !order.keyId ||
        !order.amount ||
        !order.currency
      ) {
        throw new Error(
          'Invalid payment order response from backend.'
        );
      }

      // Step 2: Open Razorpay Checkout.
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'CRM Subscription',
        description: `${plan.name} - ${cycle}`,
        order_id: order.orderId,

        prefill: {},

        theme: {
          color: '#2563eb',
        },

        handler: async (response) => {
          try {
            setError('');
            setSuccess('');

            // Step 3: Verify payment on backend.
            await subscriptionApi.verifyPayment({
              razorpay_order_id:
                response.razorpay_order_id,

              razorpay_payment_id:
                response.razorpay_payment_id,

              razorpay_signature:
                response.razorpay_signature,
            });

            // Step 4: Refresh billing information.
            await refresh();

            setSuccess(
              'Payment verified successfully. Your subscription has been updated.'
            );
          } catch (err) {
            setError(
              err.message ||
              'Payment verification failed. Contact support if money was deducted.'
            );
          } finally {
            setBuying('');
          }
        },

        modal: {
          ondismiss: () => {
            setBuying('');
          },
        },
      });

      checkout.on('payment.failed', (response) => {
        setError(
          response?.error?.description ||
          'Payment failed. Please try again.'
        );

        setBuying('');
      });

      checkout.open();
    } catch (err) {
      setError(err.message || 'Unable to initiate payment.');
      setBuying('');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="text-sm text-gray-500">
          Loading subscription details...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header */}

      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Billing & Subscription
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Manage your subscription
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage your plan, message allowance and payments.
        </p>
      </div>

      {/* Error */}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Success */}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      {/* Current Subscription */}

      {subscription && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div>
              <p className="text-sm text-gray-500">
                Current subscription
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {subscription.planName || subscription.planCode}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Billing cycle:{' '}
                {subscription.billingCycle || 'Free'}
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold capitalize text-blue-700">
              {subscription.status || 'Unknown'}
            </span>

          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">

            <Metric
              label="Total message allowance"
              value={messageLimit}
            />

            <Metric
              label="Messages used"
              value={usedMessages}
            />

            <Metric
              label="Messages remaining"
              value={remainingMessages}
            />

          </div>

          {/* Usage Progress */}

          <div className="mt-6">

            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-gray-700">
                Message usage
              </span>

              <span className="text-gray-500">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-gray-100">

              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />

            </div>

          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">

            <p>
              Subscription ends:{' '}
              {formatDate(subscription.subscriptionEndsAt)}
            </p>

            <p>
              Next quota reset:{' '}
              {formatDate(subscription.nextQuotaResetAt)}
            </p>

          </div>

        </section>
      )}

      {/* Plans */}

      <section>

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Choose your plan
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select a subscription according to your business needs.
            </p>
          </div>

          <div className="flex rounded-xl border bg-white p-1">

            <button
              type="button"
              onClick={() => setCycle('monthly')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                cycle === 'monthly'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() => setCycle('yearly')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                cycle === 'yearly'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Yearly
            </button>

          </div>

        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {/* Free Plan */}

          {plansData?.trial?.enabled && (
            <article className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6">

              <h3 className="text-xl font-bold text-gray-900">
                Free
              </h3>

              <p className="mt-4 text-3xl font-bold text-gray-900">
                Free
              </p>

              <p className="mt-3 text-sm text-gray-500">
                {plansData.trial.messageLimit} starter messages
              </p>

              <button
                disabled
                className="mt-8 rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-500"
              >
                {isFreePlan ? 'Current plan' : 'Free allowance'}
              </button>

            </article>
          )}

          {/* Paid Plans */}

          {plansData?.plans?.map((plan) => {
            const price = getPlanPrice(plan, cycle);

            const isCurrent =
              currentPlanCode === String(plan.code).toLowerCase();

            return (
              <article
                key={plan.code}
                className={`flex flex-col rounded-2xl border bg-white p-6 ${
                  isCurrent
                    ? 'border-blue-500 ring-1 ring-blue-500'
                    : 'border-gray-200'
                }`}
              >

                <div className="flex items-center justify-between gap-2">

                  <h3 className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>

                  {isCurrent && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      Current
                    </span>
                  )}

                </div>

                <p className="mt-4 text-3xl font-bold text-gray-900">
                  {formatMoney(price, plan.currency || 'INR')}

                  <span className="text-sm font-normal text-gray-500">
                    /{cycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </p>

                <div className="mt-5 space-y-3 text-sm text-gray-600">

                  <p>
                    ✓ {Number(plan.messageLimit).toLocaleString('en-IN')} messages
                    {cycle === 'yearly'
                      ? ' per month during the annual term'
                      : ' per month'}
                  </p>

                  {plan.quotaDescription && (
                    <p>{plan.quotaDescription}</p>
                  )}

                </div>

                <button
                  type="button"
                  disabled={!!buying || isCurrent}
                  onClick={() => handlePurchase(plan)}
                  className="mt-auto mt-8 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                >
                  {buying === plan.code
                    ? 'Processing...'
                    : isCurrent
                      ? 'Current plan'
                      : 'Upgrade plan'}
                </button>

              </article>
            );
          })}

        </div>

        {!plansData?.plans?.length && (
          <p className="mt-4 text-sm text-gray-500">
            No paid plans are currently available.
          </p>
        )}

      </section>

      {/* Payment History */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">

        <h2 className="text-xl font-bold text-gray-900">
          Payment history
        </h2>

        {payments.length === 0 ? (

          <p className="mt-4 text-sm text-gray-500">
            No payment history available.
          </p>

        ) : (

          <div className="mt-5 overflow-x-auto">

            <table className="w-full min-w-[600px] text-left text-sm">

              <thead>
                <tr className="border-b text-xs uppercase text-gray-500">
                  <th className="px-3 py-3">Plan</th>
                  <th className="px-3 py-3">Billing</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Date</th>
                </tr>
              </thead>

              <tbody>

                {payments.map((payment, index) => {

                  const rawAmount = Number(payment.amount || 0);

                  // Payment records commonly store INR in paise.
                  const displayAmount =
                    rawAmount >= 100
                      ? rawAmount / 100
                      : rawAmount;

                  return (
                    <tr
                      key={
                        payment._id ||
                        payment.id ||
                        payment.razorpayPaymentId ||
                        index
                      }
                      className="border-b last:border-0"
                    >

                      <td className="px-3 py-4 font-medium">
                        {payment.planName ||
                          payment.planCode ||
                          'Subscription'}
                      </td>

                      <td className="px-3 py-4 capitalize">
                        {payment.billingCycle || '—'}
                      </td>

                      <td className="px-3 py-4">
                        {formatMoney(
                          displayAmount,
                          payment.currency || 'INR'
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize">
                          {payment.status || 'Unknown'}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        {formatDate(
                          payment.paidAt || payment.createdAt
                        )}
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        )}

      </section>

      <p className="text-xs leading-5 text-gray-500">
        All subscription limits and payment verification are controlled
        by the CRM backend. Razorpay payments are processed through
        secure server-side verification. Renewals are currently manual.
      </p>

    </div>
  );
}
