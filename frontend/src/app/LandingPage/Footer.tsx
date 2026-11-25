"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-[#050b08] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/3 top-0 h-96 w-96 rounded-full bg-green-500/10 blur-[120px]" />
        <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src="/logo-gbdrift.png"
                alt="GBDRIFT"
                className="h-11 w-11"
              />

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-white">
                    ArrayTick
                  </h3>

                  <span className="text-xs font-semibold text-green-400">
                    by GBDRIFT
                  </span>
                </div>

                <p className="text-sm text-gray-400">
                  WhatsApp Business API
                </p>
              </div>
            </div>

            <p className="mt-5 text-gray-400 leading-7 max-w-md">
              Modern WhatsApp CRM platform built for businesses to manage
              contacts, automate communication, run campaigns, and scale
              customer engagement with ease.
            </p>

            {/* Contact Info */}
            <div className="mt-6 space-y-3 text-gray-400">
              <p>
                📧{" "}
                <a
                  href="mailto:support@arraytick.com"
                  className="hover:text-green-400 transition-colors"
                >
                  support@arraytick.com
                </a>
              </p>

              <p>
                📞{" "}
                <a
                  href="tel:+919876543210"
                  className="hover:text-green-400 transition-colors"
                >
                  +91 98765 43210
                </a>
              </p>

              <p>
                📍 India
              </p>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-5">
              Product
            </h4>

            <ul className="space-y-3">
              <li>
                <Link
                  href="/features"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                >
                  Features
                </Link>
              </li>

              <li>
                <Link
                  href="/pricing"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                >
                  Pricing
                </Link>
              </li>

              <li>
                <Link
                  href="/docs"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                >
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-5">
              Company
            </h4>

            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                >
                  About
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                >
                  Contact
                </Link>
              </li>

              <li>
                <Link
                  href="/support"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-5">
              Legal
            </h4>

            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>

              <li>
                <Link
                  href="/refund-policy"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-14 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <span className="text-center md:text-left">
            © {new Date().getFullYear()} ArrayTick. All rights reserved.
            <span className="block md:inline">
              {" "}
              A product of{" "}
              <span className="text-green-400 font-medium">
                GBDRIFT INDIA PRIVATE LIMITED
              </span>
            </span>
          </span>

          <span className="text-gray-400">
            Built with ❤️ for modern businesses
          </span>
        </div>
      </div>
    </footer>
  );
}