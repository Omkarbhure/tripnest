"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (!res.token) { setError("Login failed — no token received."); return; }
      login({ id: res.id, name: res.name, email: res.email, role: res.role, token: res.token });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-[1.75rem] font-extrabold text-white tracking-tight leading-snug mb-1.5">
          Welcome back
        </h1>
        <p className="text-white/65 text-sm leading-relaxed">
          Sign in to access your curated trips, itineraries, and travel budgets.
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-2xl bg-rose-500/15 border border-rose-500/30 px-4 py-3 text-sm text-rose-200 flex items-start gap-2.5 backdrop-blur-xl shadow-lg"
        >
          <span className="shrink-0 text-base">⚠️</span>
          <span className="leading-snug">{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.08] px-4 py-3 text-sm
                         text-white placeholder-white/40 backdrop-blur-xl
                         focus:outline-none focus:border-orange-400 focus:bg-white/[0.1] focus:ring-4 focus:ring-orange-500/20
                         transition-all duration-200"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-orange-300 hover:text-orange-200 font-medium hover:underline transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"} required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.08] px-4 py-3 text-sm
                         text-white placeholder-white/40 backdrop-blur-xl pr-16
                         focus:outline-none focus:border-orange-400 focus:bg-white/[0.1] focus:ring-4 focus:ring-orange-500/20
                         transition-all duration-200"
            />
            <button
              type="button" onClick={() => setShowPw(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/60
                         hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors duration-150"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Login button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit" disabled={loading}
          className="w-full rounded-2xl
                     bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500
                     hover:brightness-110 active:brightness-95
                     px-8 py-3.5 text-sm font-bold text-white
                     transition-all duration-200 cursor-pointer
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
                     shadow-[0_12px_28px_-8px_rgba(249,115,22,0.55),0_0_0_1px_rgba(255,255,255,0.2)_inset]"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Signing in…
            </span>
          ) : (
            "Sign In"
          )}
        </motion.button>
      </form>

      {/* Sign up link */}
      <p className="mt-6 text-sm text-center text-white/60">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-orange-300 font-semibold hover:text-orange-200 hover:underline transition-colors ml-1">
          Sign Up
        </Link>
      </p>
    </>
  );
}
