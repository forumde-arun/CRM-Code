"use client";

import { motion } from "framer-motion";

export default function Contact() {
  return (
    <section
      id="contact"
      className="relative py-32 bg-gradient-to-b from-[#cae1d0] via-white to-[#f7fff9]"
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* =====================================================
            SECTION HEADER
        ===================================================== */}
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.6,
          }}
          className="text-center mb-20"
        >
          <div className="inline-flex px-5 py-2 rounded-full bg-green-100 text-green-700 font-semibold">
            Contact Us
          </div>

          <h2 className="mt-6 text-5xl lg:text-7xl font-black text-black">
            Let`s Build Something
            <span className="block text-green-600">
              Amazing Together
            </span>
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed">
            Looking for WhatsApp API solutions,
            automation, bulk messaging, team inboxes,
            CRM integrations or enterprise support?
            Our team is here to help.
          </p>
        </motion.div>

        {/* =====================================================
            MAIN CONTACT CARD
        ===================================================== */}
        <div className="relative overflow-hidden rounded-[40px] border border-green-200 bg-white shadow-[0_20px_80px_rgba(22,163,74,0.08)]">

          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-400/10 blur-[140px] rounded-full" />

          <div className="relative z-10 grid lg:grid-cols-2">

            {/* =====================================================
                LEFT CONTENT
            ===================================================== */}
            <motion.div
              initial={{
                opacity: 0,
                x: -40,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.6,
              }}
              className="p-10 lg:p-16"
            >
              <div className="inline-flex px-4 py-2 rounded-xl bg-green-100 text-green-700 font-semibold">
                Get In Touch
              </div>

              <h3 className="mt-6 text-4xl font-bold text-black">
                Ready To Grow Your
                WhatsApp Business?
              </h3>

              <p className="mt-6 text-gray-600 leading-relaxed">
                Whether you are a startup,
                growing business or enterprise,
                ArrayTick helps you engage customers,
                automate conversations and scale
                communication effortlessly.
              </p>

              {/* CONTACT INFO */}
              <div className="mt-10 space-y-6">

                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-2xl">
                    📧
                  </div>

                  <div>
                    <div className="font-semibold text-black">
                      Email Address
                    </div>

                    <div className="text-gray-600">
                      support@arraytick.com
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-2xl">
                    📞
                  </div>

                  <div>
                    <div className="font-semibold text-black">
                      Phone Number
                    </div>

                    <div className="text-gray-600">
                      +91 98765 43210
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-2xl">
                    📍
                  </div>

                  <div>
                    <div className="font-semibold text-black">
                      Location
                    </div>

                    <div className="text-gray-600">
                      India
                    </div>
                  </div>
                </div>

              </div>

              {/* FEATURE BOXES */}
              <div className="mt-12 grid grid-cols-2 gap-4">

                <div className="rounded-2xl border border-green-100 p-5 bg-green-50">
                  <div className="text-3xl font-bold text-green-600">
                    24/7
                  </div>

                  <div className="text-sm text-gray-600 mt-1">
                    Dedicated Support
                  </div>
                </div>

                <div className="rounded-2xl border border-green-100 p-5 bg-green-50">
                  <div className="text-3xl font-bold text-green-600">
                    99.9%
                  </div>

                  <div className="text-sm text-gray-600 mt-1">
                    Delivery Rate
                  </div>
                </div>

              </div>
            </motion.div>

            {/* =====================================================
                CONTACT FORM
            ===================================================== */}
            <motion.div
              initial={{
                opacity: 0,
                x: 40,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.6,
              }}
              className="bg-gradient-to-br from-green-50 to-white p-10 lg:p-16"
            >
              <div className="bg-white rounded-3xl text-black p-8 border border-green-100 shadow-lg">

                <h3 className="text-3xl font-bold text-black">
                  Send Us A Message
                </h3>

                <p className="mt-3 text-gray-600">
                  Fill out the form and our team
                  will contact you shortly.
                </p>

                <div className="mt-8 text-black space-y-5">

                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full px-5 py-4 text-black rounded-2xl border border-gray-200 focus:border-green-500 outline-none"
                  />

                  <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-green-500 outline-none"
                  />

                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-green-500 outline-none"
                  />

                  <input
                    type="text"
                    placeholder="Company Name"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-green-500 outline-none"
                  />

                  <textarea
                    rows={5}
                    placeholder="Tell us about your requirements..."
                    className="w-full px-5 py-4 text-black rounded-2xl border border-gray-200 focus:border-green-500 outline-none resize-none"
                  />

                  <button
                    className="
                      w-full
                      py-4
                      rounded-2xl
                      bg-green-600
                      hover:bg-green-500
                      text-white
                      font-bold
                      transition
                      shadow-lg
                    "
                  >
                    Send Message
                  </button>

                </div>

              </div>
            </motion.div>

          </div>
        </div>

        {/* =====================================================
            BOTTOM CTA
        ===================================================== */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.6,
            delay: 0.2,
          }}
          className="mt-16 text-center"
        >
          <h3 className="text-3xl font-bold text-black">
            Start Growing With ArrayTick Today
          </h3>

          <p className="mt-4 text-gray-600">
            Powerful WhatsApp CRM, Campaigns,
            Automation and Analytics.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">

            <button className="px-8 py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold transition">
              Book A Demo
            </button>

            <button className="px-8 py-4 rounded-2xl border border-green-600 text-green-600 hover:bg-green-50 font-bold transition">
              Contact Sales
            </button>

          </div>
        </motion.div>

      </div>
    </section>
  );
}