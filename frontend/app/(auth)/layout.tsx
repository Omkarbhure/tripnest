"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f1d] text-white font-sans selection:bg-orange-500/30 selection:text-orange-200">
      {/* ============ AMBIENT TROPICAL ORBS ============ */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Warm Sunrise Gold Orb */}
        <motion.div
          className="absolute -top-32 -left-20 h-[32rem] w-[32rem] rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient(circle at 40% 40%, #fb923c 0%, #ea580c 45%, transparent 70%)" }}
          animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Tropical Sky Cyan Orb */}
        <motion.div
          className="absolute top-1/4 -right-24 h-[34rem] w-[34rem] rounded-full blur-3xl opacity-45"
          style={{ background: "radial-gradient(circle at 60% 40%, #38bdf8 0%, #0284c7 40%, #0369a1 60%, transparent 75%)" }}
          animate={{ x: [0, -30, 0], y: [0, 25, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {/* Deep Lagoon & Violet Orb */}
        <motion.div
          className="absolute -bottom-20 left-1/4 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-35"
          style={{ background: "radial-gradient(circle at 50% 50%, #0d9488 0%, #0284c7 40%, transparent 70%)" }}
          animate={{ y: [0, -25, 0], x: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-between px-6 sm:px-10 py-6 lg:px-14">
        {/* ── Top Navigation Bar ── */}
        <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-2">
          <Link
            href="/"
            className="group inline-flex items-center justify-center w-10 h-10 rounded-2xl
                       border border-white/15 bg-white/[0.06] text-white/70 hover:text-orange-300 hover:border-orange-400/60 hover:bg-orange-500/15
                       backdrop-blur-xl transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Go back to Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-[0_4px_12px_rgba(249,115,22,0.4)]">
              <span className="text-sm font-black text-white">✈</span>
            </div>
            <div className="flex items-baseline">
              <span className="text-xl font-extrabold text-white tracking-tight">TripNest</span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 ml-0.5 animate-pulse" />
            </div>
          </Link>
        </header>

        {/* ── Main Two-Column Container (Centered and Aligned) ── */}
        <main className="flex-1 flex items-center justify-center w-full max-w-6xl mx-auto py-4">
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* ── Left Form Side ── */}
            <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-center">
              {/* Mobile-only visual preview header */}
              <div className="md:hidden mb-6 flex items-center gap-3 p-2.5 rounded-2xl border border-white/15 bg-white/[0.05] backdrop-blur-xl">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/20">
                  <Image
                    src="/travel-hero.png"
                    alt="TripNest Vacation"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Ready for your getaway?</p>
                  <p className="text-[11px] text-orange-300 font-medium">Plan, track & explore dream spots</p>
                </div>
              </div>

              {/* Form Card */}
              <div className="w-full">
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="rounded-3xl border border-white/15 bg-white/[0.05] backdrop-blur-2xl p-6 sm:p-8
                             shadow-[0_30px_70px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)]
                             relative overflow-hidden"
                >
                  {/* Subtle top interior glow */}
                  <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-24 bg-orange-500/20 blur-2xl rounded-full" />
                  <div className="relative z-10">
                    {children}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* ── Right visual showcase panel ── */}
            <div className="hidden md:flex md:col-span-6 lg:col-span-7 items-center justify-center">
              {/* Main Showcase Glass Card */}
              <div className="relative w-full max-w-lg aspect-[4/5] max-h-[82vh] rounded-[2.5rem] overflow-hidden
                              border border-white/20 bg-gradient-to-b from-white/[0.09] to-white/[0.03] backdrop-blur-2xl
                              shadow-[0_35px_90px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.25)]
                              flex flex-col justify-between p-6 lg:p-8">

                {/* Background ambient lighting behind image inside showcase */}
                <div className="absolute inset-0 bg-gradient-to-b from-sky-400/15 via-orange-400/10 to-transparent pointer-events-none" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-64 h-48 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />

                {/* Top glass pill badge */}
                <div className="relative z-20 flex items-center justify-between">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-xl shadow-sm text-xs font-semibold text-white/90"
                  >
                    <span className="text-sm">✈️</span>
                    <span>Smart Vacation Platform</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-500/10 backdrop-blur-xl text-xs font-semibold text-amber-200"
                  >
                    <span>⭐</span>
                    <span>4.9 / 5.0</span>
                  </motion.div>
                </div>

                {/* 3D Visual Center Stage with Floating Animation */}
                <div className="relative z-10 flex-1 my-2 flex items-center justify-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-full h-full max-h-[340px] flex items-center justify-center"
                  >
                    {/* Floating Glassmorphism Highlights */}
                    <motion.div
                      animate={{ y: [0, 6, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      className="absolute -top-1 left-2 z-20 hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border border-white/25 bg-white/15 backdrop-blur-xl shadow-lg"
                    >
                      <div className="w-7 h-7 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-sm">
                        🌴
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white leading-tight">Tropical Getaways</p>
                        <p className="text-[9px] text-white/70">100+ Curated Spots</p>
                      </div>
                    </motion.div>

                    <motion.div
                      animate={{ y: [0, -7, 0] }}
                      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="absolute bottom-4 right-1 z-20 hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border border-white/25 bg-white/15 backdrop-blur-xl shadow-lg"
                    >
                      <div className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sm">
                        ☀️
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white leading-tight">Live Weather</p>
                        <p className="text-[9px] text-sky-200 font-medium">Real-time Forecasts</p>
                      </div>
                    </motion.div>

                    {/* 3D Summer Vacation Image */}
                    <div className="relative w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                      <Image
                        src="/travel-hero.png"
                        alt="TripNest 3D Vacation & Flight Planner"
                        fill
                        className="object-contain hover:scale-105 transition-transform duration-700 ease-out"
                        priority
                        sizes="(max-width: 1024px) 50vw, 600px"
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Bottom Content & Feature Chips */}
                <div className="relative z-20 space-y-3">
                  <div>
                    <h2 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight leading-tight">
                      Your next <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">adventure</span> begins here.
                    </h2>
                    <p className="text-xs text-white/70 mt-1 leading-relaxed">
                      Effortless itineraries, instant weather forecasts, and shared budget tracking in one platform.
                    </p>
                  </div>

                  {/* Glass Feature Chips */}
                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    <FeatureGlass label="Curated Trips" icon="🗺️" subtitle="Auto-Planner" />
                    <FeatureGlass label="Live Weather" icon="⛅" subtitle="Accu-Forecast" />
                    <FeatureGlass label="Smart Budget" icon="💳" subtitle="Expense Sync" />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="w-full max-w-6xl mx-auto text-center md:text-left text-xs text-white/40 pt-2">
          © {new Date().getFullYear()} TripNest. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

function FeatureGlass({ label, icon, subtitle }: { label: string; icon: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.07] hover:bg-white/[0.12] hover:border-white/25 backdrop-blur-xl p-2.5 sm:p-3 text-center transition-all duration-200 group">
      <div className="text-lg group-hover:scale-110 transition-transform duration-200">{icon}</div>
      <p className="mt-1 text-[11px] font-semibold text-white leading-tight">{label}</p>
      {subtitle && <p className="text-[9px] text-white/50">{subtitle}</p>}
    </div>
  );
}

