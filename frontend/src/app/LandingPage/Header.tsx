
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AppHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (

<header
  className={`fixed inset-x-0 top-0 z-50 w-full border-b border-white/10 bg-black shadow-lg shadow-black/10 transition-all duration-500 ease-in-out ${
    mounted
      ? "translate-y-0 opacity-100"
      : "-translate-y-5 opacity-0"
  }`}
>

      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3"
          onClick={() => setMenuOpen(false)}
        >
          {/* Logo mark */}
          <div className="flex h-10 w-10 items-center justify-center border border-white/20 bg-white transition-all duration-300 group-hover:scale-105 group-hover:border-orange-400">
            <svg
              viewBox="0 0 40 40"
              className="h-8 w-8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 34L17 5L31 34H3Z"
                stroke="#F97316"
                strokeWidth="1.5"
              />
              <path
                d="M17 34L29 10L39 34H17Z"
                stroke="#F97316"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                ArrayTick
              </span>
              <span className="hidden text-xs font-bold text-emerald-400 sm:inline">
                by GBDRIFT
              </span>
            </div>

            <p className="mt-1 text-xs text-gray-300 sm:text-sm">
              WhatsApp Business API
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 md:flex lg:gap-8">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-gray-300 transition-colors duration-300 hover:text-emerald-400"
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/contact"
            className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-500/20"
          >
            <span className="mr-2">🗓️</span>
            Book a Demo
          </Link>

          <Link
            href="/login"
            className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-emerald-500/30"
          >
            Register
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white transition hover:bg-white/10 md:hidden"
        >
          <span className="text-2xl leading-none">
            {menuOpen ? "×" : "☰"}
          </span>
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`overflow-hidden border-t border-white/10 bg-black/90 backdrop-blur-xl transition-all duration-300 md:hidden ${
          menuOpen
            ? "max-h-96 opacity-100"
            : "max-h-0 border-transparent opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-5 py-4">
          {[
            ...navLinks,
            { label: "Book a Demo", href: "/contact" },
            { label: "Login", href: "/login" },
            { label: "Register", href: "/register" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-gray-200 transition hover:bg-white/10 hover:text-emerald-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
