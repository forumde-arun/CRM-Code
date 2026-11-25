
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";

type PlanCode = "starter" | "pro";
type Billing = "monthly" | "yearly";

type IntervalPricing = {
  price: number;
  offerActive: boolean;
  offerPrice: number | null;
  offerLabel: string | null;
};

type PricingFromAPI = {
  code: PlanCode;
  name: string;
  monthly: IntervalPricing;
  yearly: IntervalPricing;
};

type PricingAPIResponse = {
  offerEndsAt?: string;
  plans: PricingFromAPI[];
};

const plans = [
  {
    name: "Free",
    description: "Explore WhatsApp Business messaging",
    icon: "🆓",
    features: [
      "100 messages / month",
      "Contact upload (CSV)",
      "WhatsApp templates",
      "Basic contact management",
      "No bulk campaigns",
    ],
  },
  {
    name: "Starter",
    description: "For growing businesses",
    icon: "🚀",
    features: [
      "10,000 messages / month",
      "Bulk messaging",
      "Tag-based targeting",
      "Delivery reports",
      "Contact management",
    ],
  },
  {
    name: "Pro",
    description: "For businesses ready to scale",
    icon: "💎",
    popular: true,
    features: [
      "Unlimited messages*",
      "Campaign scheduling",
      "Advanced analytics",
      "Priority support",
      "API access",
      "Advanced automation",
    ],
  },
  {
    name: "Enterprise",
    description: "For large teams and enterprises",
    icon: "🏢",
    dark: true,
    features: [
      "Unlimited messaging scale",
      "Dedicated account manager",
      "Custom integrations",
      "SLA and priority onboarding",
      "Custom automation",
      "Dedicated support",
    ],
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [pricing, setPricing] = useState<Record<string, PricingFromAPI>>({});
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<PlanCode | null>(null);
  const [error, setError] = useState("");
  const [openSales, setOpenSales] = useState(false);

  // Load pricing from backend
  useEffect(() => {
    async function loadPricing() {
      try {
        setLoading(true);
        setError("");

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          throw new Error("API URL is not configured.");
        }

        const response = await fetch(`${apiUrl}/api/pricing`);

        if (!response.ok) {
          throw new Error("Unable to load pricing.");
        }

        const data: PricingAPIResponse = await response.json();

        if (!Array.isArray(data.plans)) {
          throw new Error("Invalid pricing response from server.");
        }

        const pricingMap: Record<string, PricingFromAPI> = {};

        data.plans.forEach((plan) => {
          pricingMap[plan.code] = plan;
        });

        setPricing(pricingMap);
      } catch (err) {
        console.error("Pricing error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load pricing."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPricing();
  }, []);

  // Checkout
  async function handleCheckout(planCode: PlanCode) {
    if (loadingPlan) return;

    const user = auth.currentUser;

    if (!user) {
      window.location.href = `/register?redirect=/checkout&plan=${planCode}`;
      return;
    }

    try {
      setLoadingPlan(planCode);

      const token = await user.getIdToken(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/billing/create-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            plan_code: planCode,
            billing,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed.");
      }

      window.location.href = "/checkout/processing";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Checkout failed.");
      setLoadingPlan(null);
    }
  }

  function getPrice(planName: string) {
    if (planName === "Free" || planName === "Enterprise") return null;

    const code = planName.toLowerCase() as PlanCode;
    const plan = pricing[code];

    return plan?.[billing];
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7faf8] text-gray-900">

      {/* Hero */}
      <section className="relative px-5 pb-16 pt-20 sm:pt-28">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700">
            <span>✦</span>
            WhatsApp Business API Pricing
          </div>

          <h1 className="mt-8 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            The right plan for
            <span className="block text-emerald-600">
              your business growth.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
            Manage conversations, reach customers, launch WhatsApp campaigns
            and grow your business with ArrayTick.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {["No setup fee", "Cancel anytime", "Instant activation"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm"
                >
                  <span className="mr-2 text-emerald-600">✓</span>
                  {item}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-5 pb-24">
        <div className="mx-auto max-w-7xl">

          {/* Billing Toggle */}
          <div className="mb-12 flex flex-col items-center">
            <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                  billing === "monthly"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Monthly
              </button>

              <button
                onClick={() => setBilling("yearly")}
                className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                  billing === "yearly"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Yearly
                <span className="ml-2 text-xs opacity-80">
                  Save more
                </span>
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Choose the billing cycle that works for your business.
            </p>
          </div>

          {error && (
            <div className="mx-auto mb-8 max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Plan Cards */}
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const interval = getPrice(plan.name);

              const saving =
                interval?.offerActive &&
                interval.offerPrice !== null &&
                interval.price > 0
                  ? Math.round(
                      ((interval.price - interval.offerPrice) /
                        interval.price) *
                        100
                    )
                  : null;

              const isDark = Boolean(plan.dark);

              return (
                <div
                  key={plan.name}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                    plan.popular
                      ? "border-emerald-500 bg-white shadow-xl ring-2 ring-emerald-100"
                      : isDark
                        ? "border-gray-800 bg-gradient-to-br from-gray-900 to-black text-white shadow-xl"
                        : "border-gray-200 bg-white shadow-lg"
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute right-4 top-4 rounded-full bg-emerald-600 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white sm:right-5">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6 sm:p-7">

                    {/* Icon */}
                    <div
                      className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${
                        isDark ? "bg-white/10" : "bg-emerald-50"
                      }`}
                    >
                      {plan.icon}
                    </div>

                    {/* Plan Name */}
                    <h2
                      className={`text-2xl font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {plan.name}
                    </h2>

                    <p
                      className={`mt-2 min-h-12 text-sm leading-6 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mb-8 mt-6 min-h-[100px]">
                      {plan.name === "Free" ? (
                        <>
                          <div className="text-5xl font-black">₹0</div>
                          <p className="mt-2 text-sm text-gray-500">
                            Forever free
                          </p>
                        </>
                      ) : plan.name === "Enterprise" ? (
                        <>
                          <div className="text-4xl font-black">Custom</div>
                          <p className="mt-2 text-sm text-gray-400">
                            Contact us for pricing
                          </p>
                        </>
                      ) : loading ? (
                        <div className="text-xl font-semibold text-gray-400">
                          Loading price...
                        </div>
                      ) : !interval ? (
                        <div className="text-sm text-red-500">
                          Price unavailable
                        </div>
                      ) : (
                        <>
                          {interval.offerActive &&
                            interval.offerPrice !== null && (
                              <div className="text-lg text-gray-400 line-through">
                                ₹{interval.price.toLocaleString("en-IN")}
                              </div>
                            )}

                          <div className="flex flex-wrap items-end gap-2">
                            <span
                              className={`text-4xl font-black ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              ₹
                              {(interval.offerActive &&
                              interval.offerPrice !== null
                                ? interval.offerPrice
                                : interval.price
                              ).toLocaleString("en-IN")}
                            </span>

                            <span className="pb-1 text-sm text-gray-500">
                              /{billing === "monthly" ? "month" : "year"}
                            </span>
                          </div>

                          {saving !== null && (
                            <span className="mt-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                              Save {saving}%
                            </span>
                          )}

                          {interval.offerLabel && interval.offerActive && (
                            <p className="mt-2 text-xs text-emerald-600">
                              {interval.offerLabel}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Features */}
                    <div className="mb-8 flex-1 border-t border-gray-200/70 pt-6">
                      <p
                        className={`mb-5 text-xs font-bold uppercase tracking-wider ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        What's included
                      </p>

                      <ul className="space-y-4">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className={`flex items-start gap-3 text-sm ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                              ✓
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA */}
                    {plan.name === "Free" ? (
                      <Link
                        href="/register"
                        className="mt-auto rounded-xl bg-gray-900 px-5 py-4 text-center text-sm font-bold text-white transition hover:bg-gray-700"
                      >
                        Get Started →
                      </Link>
                    ) : plan.name === "Enterprise" ? (
                      <button
                        onClick={() => setOpenSales(true)}
                        className="mt-auto rounded-xl bg-white px-5 py-4 text-sm font-bold text-gray-900 transition hover:bg-gray-200"
                      >
                        Contact Sales →
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleCheckout(
                            plan.name.toLowerCase() as PlanCode
                          )
                        }
                        disabled={loading || loadingPlan !== null || !interval}
                        className={`mt-auto rounded-xl px-5 py-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          plan.popular
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                            : "bg-gray-900 text-white hover:bg-gray-700"
                        }`}
                      >
                        {loadingPlan === plan.name.toLowerCase()
                          ? "Redirecting..."
                          : "Choose Plan →"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-xs leading-6 text-gray-500">
            * Unlimited messaging is subject to applicable WhatsApp
            Business Platform policies, message limits and Meta charges.
            Additional Meta conversation or messaging charges may apply.
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-5 pb-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-r from-gray-950 via-gray-900 to-emerald-950 px-7 py-14 text-center text-white sm:px-12">
          <h2 className="text-3xl font-black sm:text-4xl">
            Ready to grow your business?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-300 sm:text-base">
            Start managing customer conversations and WhatsApp campaigns
            with ArrayTick.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-flex rounded-xl bg-emerald-500 px-8 py-4 text-sm font-bold text-black transition hover:-translate-y-1 hover:bg-emerald-400"
          >
            Get Started Today →
          </Link>
        </div>
      </section>

      {/* Enterprise Contact Modal */}
      {openSales && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          onClick={() => setOpenSales(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sales-modal-title"
            className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2
                id="sales-modal-title"
                className="text-2xl font-bold text-gray-900"
              >
                Enterprise Plan
              </h2>

              <button
                onClick={() => setOpenSales(false)}
                aria-label="Close dialog"
                className="rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-sm leading-7 text-gray-600">
              Need custom messaging limits, integrations or dedicated
              onboarding? Contact our team to discuss an Enterprise plan.
            </p>

            <Link
              href="/contact"
              onClick={() => setOpenSales(false)}
              className="mt-7 block rounded-xl bg-emerald-600 px-5 py-4 text-center text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Contact Our Team →
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
