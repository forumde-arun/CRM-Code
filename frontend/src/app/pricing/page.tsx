
"use client";

import { useState } from "react";
import Link from "next/link";

type Billing = "monthly" | "yearly";

const plans = [
  {
    name: "Free",
    description: "Explore WhatsApp Business messaging",
    icon: "🆓",
    monthly: 0,
    yearly: 0,
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
    monthly: 499,
    yearly: 4990,
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
    monthly: 1499,
    yearly: 14990,
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
    monthly: null,
    yearly: null,
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
  const [openSales, setOpenSales] = useState(false);

  const formatPrice = (price: number) =>
    price.toLocaleString("en-IN");

  const getYearlySaving = (monthly: number, yearly: number) => {
    if (!monthly || !yearly) return 0;

    return Math.round(
      ((monthly * 12 - yearly) / (monthly * 12)) * 100
    );
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7faf8] text-gray-900">

      {/* HERO */}
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
            {[
              "No setup fee",
              "Cancel anytime",
              "Easy activation",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm"
              >
                <span className="mr-2 text-emerald-600">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="px-5 pb-24">
        <div className="mx-auto max-w-7xl">

          {/* BILLING TOGGLE */}
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

          {/* PLAN CARDS */}
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const isDark = Boolean(plan.dark);
              const price =
                billing === "monthly"
                  ? plan.monthly
                  : plan.yearly;

              const saving =
                plan.monthly !== null && plan.yearly !== null
                  ? getYearlySaving(plan.monthly, plan.yearly)
                  : 0;

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
                  {plan.popular && (
                    <div className="absolute right-4 top-4 rounded-full bg-emerald-600 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6 sm:p-7">

                    {/* ICON */}
                    <div
                      className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${
                        isDark ? "bg-white/10" : "bg-emerald-50"
                      }`}
                    >
                      {plan.icon}
                    </div>

                    {/* NAME */}
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

                    {/* PRICE */}
                    <div className="mb-8 mt-6 min-h-[110px]">
                      {plan.name === "Enterprise" ? (
                        <>
                          <div className="text-4xl font-black">
                            Custom
                          </div>
                          <p className="mt-2 text-sm text-gray-400">
                            Contact us for pricing
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-end gap-2">
                            <span className="text-4xl font-black">
                              ₹{formatPrice(price ?? 0)}
                            </span>

                            <span className="pb-1 text-sm text-gray-500">
                              /{billing === "monthly" ? "month" : "year"}
                            </span>
                          </div>

                          {plan.name === "Free" ? (
                            <p className="mt-2 text-sm text-gray-500">
                              Forever free
                            </p>
                          ) : billing === "yearly" && saving > 0 ? (
                            <span className="mt-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                              Save {saving}%
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>

                    {/* FEATURES */}
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

                    {/* BUTTONS */}
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
                      <Link
                        href={`/register?plan=${plan.name.toLowerCase()}&billing=${billing}`}
                        className={`mt-auto rounded-xl px-5 py-4 text-center text-sm font-bold transition ${
                          plan.popular
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                            : "bg-gray-900 text-white hover:bg-gray-700"
                        }`}
                      >
                        Choose Plan →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-xs leading-6 text-gray-500">
            * Unlimited messaging is subject to applicable WhatsApp
            Business Platform policies, message limits and Meta charges.
            Additional Meta messaging charges may apply.
          </p>
        </div>
      </section>

      {/* BOTTOM CTA */}
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

      {/* ENTERPRISE MODAL */}
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
