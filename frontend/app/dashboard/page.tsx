"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import AdminPanel from "@/components/AdminPanel";
import { useAuth } from "@/context/AuthContext";
import { tripApi, dashboardApi } from "@/lib/api";
import { TripResponse, TravelerDashboardResponse } from "@/lib/types";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import {
  Car,
  Hotel,
  Utensils,
  ShoppingBag,
  Ticket,
  Package,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Heart,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  Plus,
  Compass,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { pill: string; dot: string }> = {
  PLANNED:   { pill: "text-blue-300 bg-blue-500/15 ring-1 ring-blue-400/30 backdrop-blur-sm",  dot: "bg-blue-400" },
  ONGOING:   { pill: "text-emerald-300 bg-emerald-500/15 ring-1 ring-emerald-400/30 backdrop-blur-sm", dot: "bg-emerald-400" },
  COMPLETED: { pill: "text-amber-300 bg-amber-500/15 ring-1 ring-amber-400/30 backdrop-blur-sm", dot: "bg-amber-400" },
  CANCELLED: { pill: "text-rose-300 bg-rose-500/15 ring-1 ring-rose-400/30 backdrop-blur-sm",  dot: "bg-rose-400" },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  TRANSPORTATION: { bg: "from-blue-500 to-sky-400", text: "text-sky-300", icon: <Car className="w-3.5 h-3.5 text-sky-300" /> },
  HOTEL:          { bg: "from-purple-500 to-indigo-400", text: "text-purple-300", icon: <Hotel className="w-3.5 h-3.5 text-purple-300" /> },
  FOOD:           { bg: "from-amber-500 to-orange-400", text: "text-amber-300", icon: <Utensils className="w-3.5 h-3.5 text-amber-300" /> },
  SHOPPING:       { bg: "from-pink-500 to-rose-400", text: "text-pink-300", icon: <ShoppingBag className="w-3.5 h-3.5 text-pink-300" /> },
  ENTERTAINMENT:  { bg: "from-emerald-500 to-teal-400", text: "text-emerald-300", icon: <Ticket className="w-3.5 h-3.5 text-emerald-300" /> },
  MISCELLANEOUS:  { bg: "from-slate-500 to-gray-400", text: "text-slate-300", icon: <Package className="w-3.5 h-3.5 text-slate-300" /> },
};

const FALLBACK_STATUS = { pill: "text-slate-300 bg-slate-500/15 ring-1 ring-slate-400/30 backdrop-blur-sm", dot: "bg-slate-400" };

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function DashboardContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMINISTRATOR";
  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [dashboardData, setDashboardData] = useState<TravelerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toasts, removeToast } = useToast();

  const loadDashboardData = useCallback(() => {
    if (!isAdmin) {
      setLoading(true);
      setError("");
      Promise.all([
        tripApi.getAll(),
        dashboardApi.getTravelerDashboard().catch(() => null),
      ])
        .then(([tripsRes, dashRes]) => {
          setTrips(tripsRes);
          setDashboardData(dashRes);
        })
        .catch(() => {
          setError("Unable to load your dashboard data. Please check your connection.");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const stats = useMemo(() => {
    const total = trips.length;
    const planned = trips.filter((t) => (t.status ?? "PLANNED") === "PLANNED").length;
    const ongoing = trips.filter((t) => t.status === "ONGOING").length;
    const completed = trips.filter((t) => t.status === "COMPLETED").length;
    const totalBudget = trips.reduce((acc, t) => acc + (t.budget ?? 0), 0);
    const completionPct = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, planned, ongoing, completed, totalBudget, completionPct };
  }, [trips]);

  const recentTrips = useMemo(
    () => [...trips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4),
    [trips]
  );

  const nextTrip = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = trips
      .filter((t) => (t.status ?? "PLANNED") !== "COMPLETED" && (t.status ?? "PLANNED") !== "CANCELLED")
      .filter((t) => t.startDate && new Date(t.startDate) >= today)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
    return upcoming[0] ?? null;
  }, [trips]);

  const daysUntilNext = (() => {
    if (!nextTrip?.startDate) return null;
    const start = new Date(nextTrip.startDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : null;
  })();

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TN";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f172a] text-white font-sans selection:bg-orange-500/30 selection:text-orange-200">
      {/* ============ AMBIENT BACKGROUND GLOW ============ */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-20 h-[32rem] w-[32rem] rounded-full blur-3xl opacity-40"
          style={{ background: isAdmin ? "radial-gradient(circle at 30% 30%, #8b5cf6 0%, #6366f1 40%, transparent 70%)" : "radial-gradient(circle at 30% 30%, #fb923c 0%, #f97316 40%, transparent 70%)" }}
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -right-20 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-35"
          style={{ background: "radial-gradient(circle at 70% 30%, #6366f1 0%, #4338ca 40%, transparent 70%)" }}
          animate={{ x: [0, -30, 0], y: [0, 25, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute -bottom-20 left-1/3 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle at 50% 50%, #06b6d4 0%, #0284c7 40%, transparent 70%)" }}
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* subtle grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
          }}
        />
      </div>

      <div className="relative z-10">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 space-y-6 sm:space-y-8">

          {isAdmin ? (
            <AdminPanel />
          ) : (
            <>
              {/* ============ HERO (GLASS CTA) ============ */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="relative rounded-3xl overflow-hidden border border-white/10
                           bg-white/5 backdrop-blur-2xl shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]
                           before:absolute before:inset-0 before:pointer-events-none
                           before:bg-gradient-to-br before:from-white/10 before:via-white/[0.02] before:to-transparent"
              >
                <div className="relative p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-orange-200/80 backdrop-blur">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                      {nextTrip ? "Next trip is coming up" : "Start planning your next adventure"}
                    </span>

                    <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight">
                      Welcome back,{" "}
                      <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                        {user?.name ?? "Explorer"}
                      </span>
                    </h1>

                    <p className="mt-3 max-w-xl text-sm sm:text-base text-white/70 leading-relaxed">
                      Plan, budget, and document every leg of your journeys — all in one beautiful place.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      <Link
                        href="/trips/create"
                        className="inline-flex items-center gap-2 rounded-2xl
                                   bg-gradient-to-r from-orange-500 via-orange-500 to-rose-500
                                   hover:brightness-110 active:brightness-95
                                   px-6 py-3 text-sm font-semibold text-white
                                   shadow-[0_10px_30px_-10px_rgba(249,115,22,0.6)]
                                   ring-1 ring-white/10 active:scale-95 transition-all duration-150"
                      >
                        <Plus className="w-4 h-4" />
                        <span>New Trip</span>
                      </Link>

                      <Link
                        href="/trips"
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/15
                                   bg-white/5 hover:bg-white/10 hover:border-white/25 backdrop-blur
                                   px-5 py-3 text-sm font-medium text-white/90
                                   active:scale-95 transition-all duration-150"
                      >
                        <Compass className="w-4 h-4 text-white/70" />
                        <span>All Trips</span>
                      </Link>
                    </div>
                  </div>

                  {/* Hero card avatar & countdown/completion */}
                  <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6 lg:w-80 shadow-inner">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        {user?.profilePhotoUrl ? (
                          <img
                            src={user.profilePhotoUrl}
                            alt={user.name}
                            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/20 shadow-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-white font-bold text-2xl flex items-center justify-center shadow-lg ring-2 ring-white/10">
                            {userInitials || "?"}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-[#0f172a]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{user?.name}</p>
                        <p className="text-xs text-white/50 truncate">{user?.email}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-orange-200/80 font-medium">
                          <MapPin className="w-3 h-3 text-orange-400" />
                          TripNest Traveler
                        </p>
                      </div>
                    </div>

                    {/* Progress / countdown */}
                    {nextTrip && daysUntilNext !== null ? (
                      <div className="mt-5 pt-5 border-t border-white/10">
                        <div className="flex items-baseline justify-between">
                          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Days until {nextTrip.destinationName ?? "trip"}</p>
                          <span className="text-3xl font-bold bg-gradient-to-br from-orange-300 to-rose-300 bg-clip-text text-transparent leading-none tabular-nums">
                            {daysUntilNext}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/50 truncate">{nextTrip.title}</p>
                        <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-400 transition-[width] duration-700"
                            style={{ width: `${daysUntilNext === 0 ? 100 : Math.min(100, 100 - daysUntilNext * 2)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 pt-5 border-t border-white/10">
                        <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Completion</p>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-xs text-white/60">{stats.completed} of {stats.total} trips</span>
                          <span className="text-2xl font-bold text-white tabular-nums">{stats.completionPct}<span className="text-sm text-white/50">%</span></span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-[width] duration-700"
                            style={{ width: `${stats.completionPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>

              {/* ============ ERROR BANNER ============ */}
              {error && (
                <div className="glass-banner glass-banner--error flex items-center justify-between gap-3 p-4 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span className="text-sm text-rose-200">{error}</span>
                  </div>
                  <button
                    onClick={loadDashboardData}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              {/* ============ STATS GRID ============ */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl space-y-3 animate-pulse">
                      <div className="flex justify-between items-center">
                        <div className="h-3.5 bg-white/10 rounded w-1/2" />
                        <div className="w-8 h-8 rounded-xl bg-white/10" />
                      </div>
                      <div className="h-8 bg-white/10 rounded w-1/3" />
                      <div className="h-3 bg-white/5 rounded w-2/3" />
                    </div>
                  ))
                ) : (
                  <>
                    <StatCard
                      title="Total Trips"
                      value={stats.total}
                      hint="Create your first trip"
                      icon={<Compass className="w-5 h-5 text-amber-300" />}
                      accent="from-amber-400 to-orange-500"
                      softBg="from-orange-500/10 via-amber-500/5 to-transparent"
                      delay={0.05}
                    />
                    <StatCard
                      title="Planned"
                      value={stats.planned}
                      hint={stats.planned > 0 ? "Ready to embark" : "No upcoming plans"}
                      icon={<Calendar className="w-5 h-5 text-sky-300" />}
                      accent="from-sky-400 to-blue-500"
                      softBg="from-sky-500/10 via-blue-500/5 to-transparent"
                      delay={0.1}
                    />
                    <StatCard
                      title="Ongoing"
                      value={stats.ongoing}
                      hint={stats.ongoing > 0 ? "Enjoy your journey!" : "Currently grounded"}
                      icon={<Clock className="w-5 h-5 text-emerald-300" />}
                      accent="from-emerald-400 to-teal-500"
                      softBg="from-emerald-500/10 via-teal-500/5 to-transparent"
                      delay={0.15}
                    />
                    <StatCard
                      title="Budget Plan"
                      value={stats.totalBudget}
                      hint={stats.totalBudget > 0 ? "Total allocated" : "No budgets set"}
                      prefix="₹"
                      icon={<Wallet className="w-5 h-5 text-purple-300" />}
                      accent="from-purple-400 to-rose-400"
                      softBg="from-purple-500/10 via-rose-500/5 to-transparent"
                      delay={0.2}
                    />
                  </>
                )}
              </section>

              {/* ============ BUDGET OVERVIEW & EXPENSE SUMMARY ============ */}
              {dashboardData && (dashboardData.budgetOverview || dashboardData.expenseSummary?.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Budget Burn-Rate Card */}
                  <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wider font-bold text-orange-300">Financial Health</span>
                        {dashboardData.budgetOverview?.overBudget ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Over Budget</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>On Track</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mt-2">Combined Budget Overview</h3>
                      <p className="text-xs text-white/50 mt-0.5">Aggregated across all of your active and past trips</p>
                    </div>

                    <div className="my-6 space-y-4">
                      <div className="flex justify-between items-baseline">
                        <div>
                          <p className="text-xs text-white/50">Total Spent</p>
                          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                            ₹{(dashboardData.budgetOverview?.totalSpent ?? 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/50">Total Budget</p>
                          <p className="text-lg font-bold text-white/80 mt-0.5">
                            ₹{(dashboardData.budgetOverview?.totalBudgeted ?? 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Burn-rate progress bar */}
                      <div className="space-y-1.5">
                        <div className="h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
                          <div
                            className={`h-full rounded-full transition-[width] duration-700 ${
                              dashboardData.budgetOverview?.overBudget
                                ? "bg-gradient-to-r from-orange-500 to-rose-500"
                                : "bg-gradient-to-r from-amber-400 to-emerald-400"
                            }`}
                            style={{
                              width: `${
                                dashboardData.budgetOverview?.totalBudgeted > 0
                                  ? Math.min(
                                      100,
                                      Math.round(
                                        ((dashboardData.budgetOverview?.totalSpent ?? 0) /
                                          dashboardData.budgetOverview.totalBudgeted) *
                                          100
                                      )
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-white/40">
                          <span>
                            {dashboardData.budgetOverview?.totalBudgeted > 0
                              ? `${Math.round(
                                  ((dashboardData.budgetOverview?.totalSpent ?? 0) /
                                    dashboardData.budgetOverview.totalBudgeted) *
                                    100
                                )}% spent`
                              : "0% spent"}
                          </span>
                          <span>
                            Remaining: ₹{(dashboardData.budgetOverview?.remainingBudget ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-white/60 flex items-center gap-2.5">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Manage individual trip budgets in your itinerary details.</span>
                    </div>
                  </div>

                  {/* Expense Category Breakdown */}
                  <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">Expense Breakdown</h3>
                        <p className="text-xs text-white/50 mt-0.5">Categorized spending across all journeys</p>
                      </div>
                      <span className="text-xs font-semibold text-orange-300">
                        {dashboardData.expenseSummary?.length ?? 0} Categories
                      </span>
                    </div>

                    {(!dashboardData.expenseSummary || dashboardData.expenseSummary.length === 0) ? (
                      <div className="py-12 text-center text-white/40 text-xs">
                        No expenses logged yet. Add expenses to your trips to see your category summary!
                      </div>
                    ) : (
                      <div className="space-y-3.5 mt-4">
                        {dashboardData.expenseSummary.map((cat) => {
                          const totalSum = dashboardData.budgetOverview?.totalSpent ?? 1;
                          const pct = totalSum > 0 ? Math.round((cat.totalAmount / totalSum) * 100) : 0;
                          const cfg = CATEGORY_COLORS[cat.category] ?? {
                            bg: "from-slate-500 to-gray-400",
                            text: "text-white",
                            icon: <Tag className="w-3.5 h-3.5 text-slate-400" />,
                          };

                          return (
                            <div key={cat.category} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span>{cfg.icon}</span>
                                  <span className="font-semibold text-white/90">{cat.category}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">₹{cat.totalAmount.toLocaleString()}</span>
                                  <span className="text-white/40 text-[11px]">({pct}%)</span>
                                </div>
                              </div>
                              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${cfg.bg} transition-all duration-700`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============ FAVORITE & MOST VISITED DESTINATIONS ============ */}
              {dashboardData?.destinationStats && (dashboardData.destinationStats.favoriteDestination || dashboardData.destinationStats.mostVisitedDestinations?.length > 0) && (
                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Favorite & Most-Visited Spots</h2>
                      <p className="text-xs text-white/50 mt-0.5">Destinations you travel to the most</p>
                    </div>
                    <Link href="/destinations" className="text-xs font-semibold text-orange-300 hover:text-orange-200 transition-colors flex items-center gap-1">
                      <span>Explore all</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Favorite destination spotlight */}
                    {dashboardData.destinationStats.favoriteDestination && (
                      <div className="relative rounded-2xl overflow-hidden border border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent backdrop-blur-xl p-5 shadow-lg flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                            <span>Favorite Destination</span>
                          </div>
                          <h3 className="text-lg font-bold text-white">
                            {dashboardData.destinationStats.favoriteDestination.name}
                          </h3>
                          <p className="text-xs text-white/60 mt-0.5">
                            {dashboardData.destinationStats.favoriteDestination.city}, {dashboardData.destinationStats.favoriteDestination.country}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[11px] text-amber-200/80">Saved in Profile</span>
                          <Link href={`/destinations/${dashboardData.destinationStats.favoriteDestination.id}`} className="text-xs font-bold text-amber-300 hover:text-white transition-colors flex items-center gap-1">
                            <span>View Spot</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Most-visited destinations list */}
                    {dashboardData.destinationStats.mostVisitedDestinations?.slice(0, dashboardData.destinationStats.favoriteDestination ? 2 : 3).map((item) => (
                      <div key={item.destinationId} className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 shadow-lg flex flex-col justify-between hover:border-white/20 transition-all">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-orange-300 uppercase tracking-wider">Top Destination</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white">
                              {item.visitCount} {item.visitCount === 1 ? "Trip" : "Trips"}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white">{item.destinationName}</h3>
                          <p className="text-xs text-white/60 mt-0.5">{item.city}, {item.country}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[11px] text-white/40">Frequent destination</span>
                          <Link href={`/destinations/${item.destinationId}`} className="text-xs font-bold text-orange-300 hover:text-white transition-colors">
                            Explore →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============ RECENT TRIPS SECTION ============ */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.25, ease: "easeOut" }}
                className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]"
              >
                <div className="flex items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Recent Itineraries</h2>
                    <p className="text-xs text-white/50 mt-0.5">Your latest booked and planned travel packages</p>
                  </div>
                  <Link
                    href="/trips"
                    className="text-xs font-semibold text-orange-300 hover:text-orange-200 transition-colors flex items-center gap-1"
                  >
                    <span>View all</span>
                    <span>→</span>
                  </Link>
                </div>

                <div className="mt-6">
                  {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3 animate-pulse">
                          <div className="flex justify-between items-center">
                            <div className="h-4 bg-white/10 rounded w-1/3" />
                            <div className="h-5 bg-white/10 rounded-full w-20" />
                          </div>
                          <div className="h-3 bg-white/5 rounded w-1/2" />
                          <div className="h-3 bg-white/5 rounded w-2/3" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!loading && recentTrips.length === 0 && (
                    <div className="text-center py-14 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                      <div className="mx-auto h-16 w-16 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-orange-300/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h18"/><path d="M5.5 5.5A8.5 8.5 0 0 1 18.5 12a8.5 8.5 0 0 1-13 6.5L2 12l3.5-6.5Z"/></svg>
                      </div>
                      <p className="text-white/70 font-medium">No trips yet</p>
                      <p className="text-white/40 mt-1 text-sm">Start planning your first adventure!</p>
                      <div className="mt-6">
                        <Link
                          href="/trips/create"
                          className="inline-flex items-center gap-2 rounded-2xl
                                     bg-gradient-to-br from-orange-500 via-orange-500 to-rose-500
                                     text-white px-5 py-2.5 text-sm font-semibold
                                     shadow-[0_10px_30px_-10px_rgba(249,115,22,0.6)]
                                     ring-1 ring-white/10"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                          Create Your First Trip
                        </Link>
                      </div>
                    </div>
                  )}

              {!loading && recentTrips.length > 0 && (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentTrips.map((trip, idx) => {
                    const statusCfg = STATUS_CONFIG[trip.status ?? "PLANNED"] ?? FALLBACK_STATUS;
                    return (
                      <motion.li
                        key={trip.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.25 + idx * 0.06 }}
                      >
                        <Link
                          href={`/trips/${trip.id}`}
                          className="group relative block h-full rounded-2xl overflow-hidden
                                     border border-white/10 bg-white/[0.04] hover:bg-white/[0.07]
                                     backdrop-blur-xl
                                     transition-all duration-200
                                     hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)]
                                     before:absolute before:inset-0 before:pointer-events-none
                                     before:bg-gradient-to-br before:from-white/10 before:via-white/[0.02] before:to-transparent"
                        >
                          <div className="relative p-5 sm:p-6">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className={`inline-flex h-2 w-2 rounded-full ${statusCfg.dot}`} />
                                  <span className={`text-[11px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${statusCfg.pill}`}>
                                    {trip.status ?? "PLANNED"}
                                  </span>
                                </div>
                                <h3 className="text-white font-semibold truncate group-hover:text-orange-200 transition-colors">
                                  {trip.title}
                                </h3>
                                <p className="text-sm text-white/55 mt-0.5 truncate">
                                  <span className="inline-flex items-center gap-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-orange-300/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                    {trip.destinationName ?? "Unassigned destination"}
                                  </span>
                                </p>
                              </div>

                              <div className="shrink-0 text-right">
                                <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Dates</p>
                                <p className="text-xs text-white/70 mt-0.5">
                                  {formatDate(trip.startDate)}
                                  <span className="mx-1 text-white/30">→</span>
                                  {formatDate(trip.endDate)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Budget</p>
                                <p className="text-sm font-semibold text-white mt-0.5 tabular-nums">
                                  {trip.budget != null ? `₹${trip.budget.toLocaleString()}` : "Not set"}
                                </p>
                              </div>
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-300/90 group-hover:text-orange-200 transition-colors">
                                Open trip
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.section>
          </>
          )}

        </main>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

/* ===== GLASS STAT CARD ===== */
function StatCard({
  title,
  value,
  hint,
  icon,
  accent,
  softBg,
  prefix,
  delay = 0,
}: {
  title: string;
  value: number;
  hint?: string;
  icon: React.ReactNode;
  accent: string;
  softBg: string;
  prefix?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="group relative rounded-2xl overflow-hidden border border-white/10
                 bg-white/[0.04] backdrop-blur-2xl
                 hover:bg-white/[0.07] transition-all duration-200
                 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)]
                 before:absolute before:inset-0 before:pointer-events-none
                 before:bg-gradient-to-br before:from-white/10 before:via-white/[0.02] before:to-transparent"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${softBg} opacity-70 pointer-events-none`} />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ring-1 ring-white/10 bg-white/5 text-white shadow-sm
                          bg-gradient-to-br ${accent} bg-clip-border`}>
            {icon}
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white/30 group-hover:text-white/50 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
        </div>

        <p className="mt-4 text-xs uppercase tracking-wider font-semibold text-white/50">{title}</p>
        <div className="mt-1 flex items-baseline gap-1">
          {prefix && <span className={`text-lg font-bold bg-gradient-to-br ${accent} bg-clip-text text-transparent`}>{prefix}</span>}
          <span className={`text-3xl sm:text-4xl font-bold leading-none tracking-tight tabular-nums bg-gradient-to-br ${accent} bg-clip-text text-transparent`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
        </div>
        {hint && <p className="mt-2 text-xs text-white/50 leading-relaxed">{hint}</p>}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  return <ProtectedRoute><DashboardContent /></ProtectedRoute>;
}
