"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Plane, Sparkles, Compass, MapPin, Sun, CreditCard, Users, ArrowRight, LayoutDashboard } from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();

  const exploreUrl = user ? "/destinations" : "/login";
  const makeTripUrl = user ? "/trips/create" : "/login";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f1d] text-white font-sans selection:bg-orange-500/30 selection:text-orange-200">
      {/* Ambient background glow orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -left-20 h-[36rem] w-[36rem] rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, #f97316 0%, #ea580c 40%, transparent 70%)" }}
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -right-24 h-[38rem] w-[38rem] rounded-full blur-3xl opacity-35"
          style={{ background: "radial-gradient(circle, #38bdf8 0%, #0284c7 40%, transparent 70%)" }}
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute -bottom-24 left-1/3 h-[32rem] w-[32rem] rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, #8b5cf6 0%, #6366f1 40%, transparent 70%)" }}
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Navigation Bar */}
        <header className="max-w-7xl mx-auto px-6 sm:px-8 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-[0_4px_16px_rgba(249,115,22,0.4)]">
              <Plane className="w-5 h-5 text-white -rotate-45" />
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-extrabold text-white tracking-tight">TripNest</span>
              <span className="w-2 h-2 rounded-full bg-orange-400 ml-0.5 animate-pulse" />
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_-8px_rgba(249,115,22,0.5)] hover:brightness-110 active:scale-95 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-200" />
                  <span>Go to Dashboard</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_-8px_rgba(249,115,22,0.5)] hover:brightness-110 active:scale-95 transition-all"
                >
                  <span>Get Started</span>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                </Link>
              </>
            )}
          </nav>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-8 pb-20 lg:pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-300 backdrop-blur-xl">
                <Compass className="w-3.5 h-3.5 text-orange-400" />
                <span>Next-Gen Travel Planning & Management</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
                Craft unforgettable journeys,{" "}
                <span className="bg-gradient-to-r from-orange-300 via-amber-300 to-rose-400 bg-clip-text text-transparent">
                  together.
                </span>
              </h1>

              <p className="max-w-2xl text-base sm:text-lg text-white/70 leading-relaxed mx-auto lg:mx-0">
                TripNest combines collaborative itinerary planning, real-time weather forecasts, daywise activity tracking, and intelligent group expense budgets in one sleek platform.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link
                  href={makeTripUrl}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-rose-500 px-7 py-3.5 text-base font-bold text-white shadow-[0_12px_35px_-10px_rgba(249,115,22,0.6)] hover:brightness-110 active:scale-95 transition-all"
                >
                  <span>Make a Trip</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href={exploreUrl}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 backdrop-blur px-6 py-3.5 text-base font-medium text-white transition-all"
                >
                  <MapPin className="w-4 h-4 text-orange-300" />
                  <span>Explore Destinations</span>
                </Link>
              </div>

              {/* Trust metric chips */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <p className="text-2xl font-extrabold text-white">25+</p>
                  <p className="text-xs text-white/50 mt-0.5">Top Destinations</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-amber-300">Live</p>
                  <p className="text-xs text-white/50 mt-0.5">OpenWeather API</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-emerald-300">100%</p>
                  <p className="text-xs text-white/50 mt-0.5">Real-time Collab</p>
                </div>
              </div>
            </motion.div>

            {/* Hero Right Showcase Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              className="lg:col-span-5 flex justify-center"
            >
              <div className="relative w-full max-w-md aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/20 bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-2xl shadow-[0_30px_90px_-20px_rgba(0,0,0,0.7)] p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur text-white/90">
                    <Plane className="w-3.5 h-3.5 text-orange-400 -rotate-45" />
                    <span>Live Flight & Tour Planner</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
                    Active
                  </div>
                </div>

                <div className="relative flex-1 flex items-center justify-center py-4">
                  <Image
                    src="/travel-hero.png"
                    alt="TripNest Vacation Planner"
                    fill
                    className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
                    priority
                  />
                </div>

                <div className="relative z-10 space-y-2 pt-2 border-t border-white/10">
                  <p className="text-xs font-bold text-orange-300 uppercase tracking-wider">Spotlight Feature</p>
                  <h3 className="text-lg font-bold text-white leading-snug">Daywise Calendar & Expense Tracking</h3>
                  <p className="text-xs text-white/60">Organize itineraries, split bills, and invite fellow travelers with custom permissions.</p>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Feature Highlights Grid */}
          <section className="mt-24 pt-12 border-t border-white/10">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs uppercase font-bold tracking-wider text-orange-300">Complete Feature Suite</span>
              <h2 className="text-3xl font-extrabold text-white mt-1.5">Everything you need for seamless travel</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                icon={<Compass className="w-6 h-6 text-orange-400" />}
                title="Itinerary Builder"
                desc="Add days, schedule activities with start/end times, tags, locations, and interactive day switcher."
              />
              <FeatureCard
                icon={<Sun className="w-6 h-6 text-amber-400" />}
                title="Live Weather Forecast"
                desc="Integrated OpenWeather engine providing real-time temperature, wind, humidity, and forecasts for any spot."
              />
              <FeatureCard
                icon={<CreditCard className="w-6 h-6 text-emerald-400" />}
                title="Smart Budget & Split"
                desc="Track total budget vs actual expenditures across categories with visual warnings when exceeding limits."
              />
              <FeatureCard
                icon={<Users className="w-6 h-6 text-sky-400" />}
                title="Group Collaboration"
                desc="Invite members by email, manage Group Admin permissions, approve join requests, and receive instant alerts."
              />
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-[#060a14]/60 py-8 px-6 text-center text-xs text-white/50">
          <p>© {new Date().getFullYear()} TripNest. Built for travelers worldwide.</p>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 hover:-translate-y-1 hover:border-orange-500/30 transition-all duration-200 shadow-lg">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-amber-500/10 border border-orange-400/30 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-xs text-white/60 leading-relaxed">{desc}</p>
    </div>
  );
}