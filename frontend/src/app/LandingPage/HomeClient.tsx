

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CountUp from "react-countup";
import {
  MessageCircle,
  Users,
  Send,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HomeClient() {
  const [activeScreen, setActiveScreen] =
    useState(0);

  const screens = [
    {
      title: "Live Inbox",
      image:
        "https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1600&auto=format&fit=crop",
    },
    {
      title: "Bulk Campaigns",
      image:
        "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop",
    },
    {
      title: "Analytics Dashboard",
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format&fit=crop",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreen(
        (prev) => (prev + 1) % screens.length
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen text-white overflow-hidden relative bg-[#0b141a]">

      {/* =====================================================
          WHATSAPP BACKGROUND
      ===================================================== */}

      {/* PATTERN */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25px 25px, rgba(255,255,255,0.08) 2px, transparent 0),
            radial-gradient(circle at 75px 75px, rgba(255,255,255,0.06) 2px, transparent 0)
          `,
          backgroundSize: "100px 100px",
        }}
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b141a]/90 via-[#071a12]/95 to-[#071a12]" />

      {/* TOP GLOW */}
      <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-green-500/10 blur-[180px] rounded-full" />

      {/* LEFT GLOW */}
      <div className="absolute top-[20%] left-[-200px] w-[500px] h-[500px] bg-emerald-500/10 blur-[140px] rounded-full" />

      {/* RIGHT GLOW */}
      <div className="absolute bottom-[10%] right-[-200px] w-[500px] h-[500px] bg-green-400/10 blur-[140px] rounded-full" />

      {/* FLOATING GLOW */}
      <div className="absolute top-[40%] left-[30%] w-[250px] h-[250px] bg-green-500/5 blur-[100px] rounded-full" />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="relative z-10">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative overflow-hidden border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">

            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* LEFT */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10 text-green-300 text-sm mb-8">
                  <CheckCircle2 size={16} />
                  WhatsApp CRM Platform
                </div>

                <h1 className="text-5xl md:text-6xl font-black leading-tight">
                  Modern WhatsApp CRM
                  <span className="block text-green-400">
                    For Businesses
                  </span>
                </h1>

                <p className="mt-8 text-lg text-gray-300 leading-relaxed max-w-2xl">
                  Manage contacts, send bulk
                  campaigns, track delivery,
                  handle inbox conversations and
                  grow your customer engagement —
                  all from one premium dashboard.
                </p>

                {/* BUTTONS */}
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/login"
                    className="px-7 py-4 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-bold shadow-[0_0_40px_rgba(34,197,94,0.35)] transition"
                  >
                    Get Started
                  </Link>

                  <Link
                    href="#features"
                    className="px-7 py-4 rounded-2xl border border-white/10 hover:border-green-500/30 bg-white/5 backdrop-blur-xl font-medium transition"
                  >
                    Explore Features
                  </Link>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-3 gap-5 mt-14">

                  <div className="bg-[#111b21]/70 border border-white/10 rounded-3xl p-6 backdrop-blur-2xl hover:border-green-500/20 transition">
                    <h3 className="text-3xl font-bold text-green-400">
                      <CountUp end={25} />K+
                    </h3>

                    <p className="text-sm text-gray-400 mt-2">
                      Messages Sent
                    </p>
                  </div>

                  <div className="bg-[#111b21]/70 border border-white/10 rounded-3xl p-6 backdrop-blur-2xl hover:border-green-500/20 transition">
                    <h3 className="text-3xl font-bold text-green-400">
                      <CountUp end={99} />%
                    </h3>

                    <p className="text-sm text-gray-400 mt-2">
                      Delivery Rate
                    </p>
                  </div>

                  <div className="bg-[#111b21]/70 border border-white/10 rounded-3xl p-6 backdrop-blur-2xl hover:border-green-500/20 transition">
                    <h3 className="text-3xl font-bold text-green-400">
                      <CountUp end={1200} />+
                    </h3>

                    <p className="text-sm text-gray-400 mt-2">
                      Active Users
                    </p>
                  </div>

                </div>
              </motion.div>

              {/* RIGHT */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
              >

                {/* DASHBOARD */}
                <div className="rounded-[32px] overflow-hidden border border-white/10 bg-[#111b21]/95 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">

                  {/* TOP BAR */}
                  <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-black/20">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>

                    <div className="text-sm text-gray-400">
                      WhatsApp CRM Dashboard
                    </div>
                  </div>

                  {/* SCREEN */}
                  <div className="relative h-[500px] overflow-hidden">

                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeScreen}
                        src={
                          screens[activeScreen]
                            .image
                        }
                        initial={{
                          opacity: 0,
                          scale: 1.05,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                        }}
                        transition={{
                          duration: 0.8,
                        }}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </AnimatePresence>

                    {/* OVERLAY */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071a12] via-[#071a12]/50 to-transparent" />

                    {/* FLOATING CHAT */}
                    <motion.div
                      animate={{
                        y: [0, -8, 0],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 4,
                      }}
                      className="absolute bottom-8 left-8 right-8"
                    >
                      <div className="bg-[#111b21]/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">

                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {
                                screens[
                                  activeScreen
                                ].title
                              }
                            </h3>

                            <p className="text-sm text-gray-400">
                              Real-time WhatsApp
                              management
                            </p>
                          </div>

                          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                            <MessageCircle
                              size={18}
                              className="text-black"
                            />
                          </div>
                        </div>

                        <div className="p-5 space-y-4">

                          <div className="bg-[#0b141a]/80 rounded-2xl border border-white/10 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium">
                                Campaign Sent
                              </p>

                              <span className="text-green-400 text-sm">
                                Delivered
                              </span>
                            </div>

                            <div className="w-full bg-black/20 rounded-full h-2">
                              <motion.div
                                initial={{
                                  width: 0,
                                }}
                                animate={{
                                  width: "92%",
                                }}
                                transition={{
                                  duration: 2,
                                }}
                                className="h-2 rounded-full bg-green-500"
                              />
                            </div>
                          </div>

                          <div className="bg-[#0b141a]/80 rounded-2xl border border-white/10 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  Active Inbox
                                </p>

                                <p className="text-sm text-gray-400">
                                  48 unread
                                  messages
                                </p>
                              </div>

                              <div className="text-3xl font-bold text-green-400">
                                48
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* =====================================================
            FEATURES
        ===================================================== */}

        <section
          id="features"
          className="max-w-7xl mx-auto px-2 py-24"
        >

         

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">

            {[
              {
                icon: Users,
                title:
                  "Contact Management",
                desc: "Upload, organize, tag and manage customer contacts.",
              },
              {
                icon: Send,
                title:
                  "Bulk Messaging",
                desc: "Send WhatsApp campaigns to thousands instantly.",
              },
              {
                icon: MessageCircle,
                title:
                  "Shared Inbox",
                desc: "Handle all customer replies in one inbox.",
              },
              {
                icon: ShieldCheck,
                title: "Secure API",
                desc: "Protected with Firebase authentication & secure APIs.",
              },
              {
                icon: BarChart3,
                title: "Analytics",
                desc: "Track delivery, open rates and campaign performance.",
              },
              {
                icon: CheckCircle2,
                title: "SaaS Ready",
                desc: "Built for scalability, teams and business growth.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  y: 40,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: i * 0.1,
                }}
                viewport={{ once: true }}
                className="bg-[#111b21]/70 border border-white/10 rounded-3xl p-7 backdrop-blur-2xl hover:border-green-500/30 hover:bg-[#1f2c34]/70 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/20 flex items-center justify-center mb-6">
                  <feature.icon className="text-green-400" />
                </div>

                <h3 className="text-xl font-semibold mb-3">
                  {feature.title}
                </h3>

                <p className="text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}

          </div>
        </section>

        {/* =====================================================
            CTA
        ===================================================== */}


      </div>
    </div>
  );
}