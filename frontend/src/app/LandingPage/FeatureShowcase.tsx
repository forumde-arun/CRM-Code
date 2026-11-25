
"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "inbox", title: "Inbox" },
  { id: "bulk", title: "Bulk Messaging" },
  { id: "templates", title: "Templates" },
  { id: "analytics", title: "Analytics" },
];

export default function FeatureStorySection() {
  const [activeSection, setActiveSection] = useState("inbox");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => b.intersectionRatio - a.intersectionRatio
          );

        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const featureClass =
    "grid grid-cols-1 items-center gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-28";

  const headingClass =
    "mt-4 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl";

  const descriptionClass =
    "mt-5 text-base leading-7 text-gray-600 sm:text-lg sm:leading-8";

  const points = (items: string[]) => (
    <div className="mt-8 grid grid-cols-1 gap-4 text-sm font-medium text-gray-800 sm:grid-cols-2 sm:gap-5">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-2">
          <span className="font-bold text-green-600">✓</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );

  return (
    <section className="overflow-hidden bg-gradient-to-br from-[#c8eacd] via-[#e1e9e2] to-[#e7fbe9]">

      {/* FEATURE NAVIGATION */}

      <div className="sticky top-[72px] z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-7xl overflow-x-auto px-3 sm:px-6">
          <div className="flex min-w-max justify-start gap-5 py-4 sm:justify-center sm:gap-10">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`min-w-[100px] border-b-2 px-3 pb-3 text-sm font-semibold transition-colors sm:min-w-[120px] sm:text-base ${
                  activeSection === section.id
                    ? "border-green-600 text-green-700"
                    : "border-transparent text-gray-500 hover:text-green-700"
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* INBOX */}

      <section
        id="inbox"
        className="scroll-mt-36"
      >
        <div className={`${featureClass} mx-auto max-w-7xl`}>
          <div className="min-w-0">
            <span className="font-semibold text-green-700">
              Inbox
            </span>

            <h2 className={headingClass}>
              Unified WhatsApp Inbox
            </h2>

            <p className={descriptionClass}>
              Manage all customer conversations from a single
              dashboard. Track message status, collaborate with
              your team and never miss a lead.
            </p>

            {points([
              "Real Time Chat",
              "Read Receipts",
              "Shared Team Inbox",
              "Customer History",
            ])}
          </div>

          {/* RESPONSIVE CHAT BOX */}

          <div className="w-full min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl sm:rounded-3xl sm:p-6 lg:p-8">
            <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg">
                💬
              </div>

              <div className="min-w-0">
                <h3 className="truncate font-bold text-gray-900">
                  Customer Conversation
                </h3>
                <p className="text-xs text-green-600">
                  Online
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-start">
                <div className="max-w-[85%] break-words rounded-2xl rounded-tl-sm border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                  Hello 👋
                </div>
              </div>

              <div className="flex justify-end">
                <div className="max-w-[85%] break-words rounded-2xl rounded-tr-sm bg-green-100 px-4 py-3 text-sm text-gray-900">
                  Welcome to ArrayTick!
                </div>
              </div>

              <div className="flex justify-end">
                <div className="max-w-[85%] break-words rounded-2xl rounded-tr-sm bg-green-100 px-4 py-3 text-sm text-gray-900">
                  How can I help you?
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[85%] break-words rounded-2xl rounded-tl-sm border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                  I need pricing details.
                </div>
              </div>

              <div className="mt-3 flex min-w-0 items-center gap-2 rounded-xl border border-gray-200 px-3 py-3">
                <span className="min-w-0 flex-1 truncate text-sm text-gray-400">
                  Type a message...
                </span>
                <span className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white">
                  Send
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BULK MESSAGING */}

      <section
        id="bulk"
        className="scroll-mt-36 border-t border-green-900/10"
      >
        <div className={`${featureClass} mx-auto max-w-7xl`}>
          <div className="min-w-0">
            <span className="font-semibold text-green-700">
              Bulk Messaging
            </span>

            <h2 className={headingClass}>
              Reach Thousands Instantly
            </h2>

            <p className={descriptionClass}>
              Launch WhatsApp campaigns and track delivery
              progress. Reach your opted-in audience using
              approved message templates.
            </p>

            {points([
              "Campaign Delivery",
              "CSV Upload",
              "Audience Groups",
              "Live Reporting",
            ])}
          </div>

          <div className="w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:rounded-3xl sm:p-8">
            <h3 className="mb-6 text-lg font-bold text-gray-900">
              Campaign Overview
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { value: "10K", label: "Sent" },
                { value: "9.8K", label: "Delivered" },
                { value: "8.4K", label: "Read" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center"
                >
                  <div className="text-2xl font-bold text-green-700 sm:text-3xl">
                    {item.value}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-600">
                  Delivery progress
                </span>
                <span className="font-semibold text-green-700">
                  98%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full w-[98%] rounded-full bg-green-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEMPLATES */}

      <section
        id="templates"
        className="scroll-mt-36 border-t border-green-900/10"
      >
        <div className={`${featureClass} mx-auto max-w-7xl`}>
          <div className="min-w-0">
            <span className="font-semibold text-green-700">
              Templates
            </span>

            <h2 className={headingClass}>
              WhatsApp Template Management
            </h2>

            <p className={descriptionClass}>
              Create, manage and send approved WhatsApp templates
              directly from your dashboard. Keep communication
              consistent and scalable.
            </p>

            {points([
              "Meta Approved Templates",
              "Dynamic Variables",
              "One Click Sending",
              "Template Analytics",
            ])}
          </div>

          <div className="w-full min-w-0 space-y-4 rounded-2xl bg-white p-4 shadow-xl sm:rounded-3xl sm:p-8">
            {[
              {
                title: "Order Confirmation",
                message: "Hi {{name}}, your order has been confirmed.",
              },
              {
                title: "Payment Reminder",
                message: "This is a reminder about your pending payment.",
              },
              {
                title: "Appointment Alert",
                message: "Your appointment is scheduled successfully.",
              },
            ].map((template) => (
              <div
                key={template.title}
                className="rounded-xl border border-gray-200 p-4 transition hover:border-green-400 hover:bg-green-50 sm:p-5"
              >
                <h3 className="font-semibold text-gray-900">
                  {template.title}
                </h3>

                <p className="mt-2 break-words text-sm leading-6 text-gray-600">
                  {template.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ANALYTICS */}

      <section
        id="analytics"
        className="scroll-mt-36 border-t border-green-900/10"
      >
        <div className={`${featureClass} mx-auto max-w-7xl`}>
          <div className="min-w-0">
            <span className="font-semibold text-green-700">
              Analytics
            </span>

            <h2 className={headingClass}>
              Measure Everything
            </h2>

            <p className={descriptionClass}>
              Understand campaign performance, delivery rates
              and customer engagement through organized
              messaging analytics.
            </p>

            {points([
              "Delivery Reports",
              "Read Rate Tracking",
              "Response Analytics",
              "Growth Monitoring",
            ])}
          </div>

          <div className="w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:rounded-3xl sm:p-8">
            <h3 className="mb-6 font-bold text-gray-900">
              Performance Overview
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-xl bg-green-50 p-4 sm:p-6">
                <div className="text-3xl font-bold text-green-700">
                  92%
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Delivery Rate
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-4 sm:p-6">
                <div className="text-3xl font-bold text-blue-700">
                  81%
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Read Rate
                </p>
              </div>
            </div>

            <div className="mt-8">
              <p className="mb-5 text-sm font-medium text-gray-600">
                Weekly Activity
              </p>

              <div className="flex h-40 items-end gap-2 border-b border-gray-200 sm:h-52 sm:gap-4">
                {[30, 60, 45, 80, 70, 95].map((value, index) => (
                  <div
                    key={index}
                    style={{ height: `${value}%` }}
                    className="min-w-0 flex-1 rounded-t-lg bg-green-500"
                  />
                ))}
              </div>

              <div className="mt-3 flex justify-between text-xs text-gray-500">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <span key={day}>{day}</span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

    </section>
  );
}
