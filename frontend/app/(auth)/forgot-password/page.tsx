"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { ShieldCheck, Mail, KeyRound, Lock, ArrowRight, CheckCircle2, RefreshCw, Eye, EyeOff } from "lucide-react";

type Step = "EMAIL" | "OTP" | "RESET" | "SUCCESS";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Timer for resending OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Step 1: Send OTP to email
  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await authApi.sendForgotPasswordOtp(email.trim());
      setSuccessMsg(res.message || `A 6-digit OTP has been sent to ${email}`);
      setStep("OTP");
      setCountdown(60); // 60s cooldown for resend
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP code";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP
  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (otp.trim().length !== 6) {
      setError("Please enter a valid 6-digit OTP code.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email.trim(), otp.trim());
      setSuccessMsg(res.message || "OTP verified! Please set your new password.");
      setStep("RESET");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid or expired OTP code.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Submit New Password
  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPasswordWithOtp(email.trim(), otp.trim(), newPassword);
      setSuccessMsg(res.message || "Your password has been reset successfully!");
      setStep("SUCCESS");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP action
  async function handleResendOtp() {
    if (countdown > 0 || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await authApi.sendForgotPasswordOtp(email.trim());
      setSuccessMsg(res.message || "A new 6-digit OTP has been sent to your email.");
      setCountdown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend OTP.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Step Progress Indicator ── */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === "EMAIL"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                : "bg-white/10 text-white/70"
            }`}
          >
            1
          </span>
          <span className="text-xs font-medium text-white/70 hidden sm:inline">Email</span>
        </div>
        <div className="w-8 h-px bg-white/10" />
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === "OTP"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                : step === "RESET" || step === "SUCCESS"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-white/10 text-white/70"
            }`}
          >
            2
          </span>
          <span className="text-xs font-medium text-white/70 hidden sm:inline">OTP</span>
        </div>
        <div className="w-8 h-px bg-white/10" />
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === "RESET" || step === "SUCCESS"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                : "bg-white/10 text-white/70"
            }`}
          >
            3
          </span>
          <span className="text-xs font-medium text-white/70 hidden sm:inline">Reset</span>
        </div>
      </div>

      {/* ── Heading ── */}
      {step === "EMAIL" && (
        <>
          <h1 className="text-[1.75rem] font-bold text-white leading-snug mb-2">
            Forgot your <span className="text-orange-400">password?</span>
          </h1>
          <p className="text-white/60 text-sm mb-6 leading-relaxed">
            Enter your registered email address to receive a secure 6-digit verification code.
          </p>
        </>
      )}

      {step === "OTP" && (
        <>
          <h1 className="text-[1.75rem] font-bold text-white leading-snug mb-2">
            Verify <span className="text-orange-400">Security Code</span>
          </h1>
          <p className="text-white/60 text-sm mb-6 leading-relaxed">
            Enter the 6-digit code sent to <strong className="text-white">{email}</strong>.
          </p>
        </>
      )}

      {step === "RESET" && (
        <>
          <h1 className="text-[1.75rem] font-bold text-white leading-snug mb-2">
            Set New <span className="text-orange-400">Password</span>
          </h1>
          <p className="text-white/60 text-sm mb-6 leading-relaxed">
            OTP confirmed. Please enter your new password below.
          </p>
        </>
      )}

      {step === "SUCCESS" && (
        <>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-[1.75rem] font-bold text-white leading-snug mb-2">
            Password <span className="text-emerald-400">Reset Successfully!</span>
          </h1>
          <p className="text-white/60 text-sm mb-6 leading-relaxed">
            Your account credentials have been updated. You can now log in with your new password.
          </p>
        </>
      )}

      {/* ── Status Banners ── */}
      {error && (
        <div className="glass-banner glass-banner--error mb-5 flex items-center gap-2">
          <span className="shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {successMsg && step !== "SUCCESS" && (
        <div className="glass-banner glass-banner--success mb-5 flex items-center gap-2">
          <span className="shrink-0">✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── STEP 1: Email Form ── */}
      {step === "EMAIL" && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label className="glass-label flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-orange-400" />
              <span>Registered Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@example.com"
              className="glass-input"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="glass-btn-primary w-full px-6 py-3.5 flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sending 6-Digit OTP…</span>
              </>
            ) : (
              <>
                <span>Send Verification Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* ── STEP 2: OTP Verification Form ── */}
      {step === "OTP" && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="glass-label flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-orange-400" />
                <span>6-Digit Verification Code</span>
              </label>
              <button
                type="button"
                onClick={() => { setStep("EMAIL"); setError(""); }}
                className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
              >
                Change Email
              </button>
            </div>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="glass-input tracking-[0.5em] text-center text-xl font-mono font-bold"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="glass-btn-primary w-full px-6 py-3.5 flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying OTP…</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Open Reset Module</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-xs text-white/50 pt-1">
            <span>Didn&apos;t receive the code?</span>
            <button
              type="button"
              disabled={countdown > 0 || loading}
              onClick={handleResendOtp}
              className="font-semibold text-orange-400 hover:text-orange-300 disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
            >
              {countdown > 0 ? `Resend code in ${countdown}s` : "Resend OTP"}
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 3: Password Reset Module ── */}
      {step === "RESET" && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="glass-label flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-orange-400" />
              <span>New Password</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 chars)"
                className="glass-input pr-12"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="glass-label flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-orange-400" />
              <span>Confirm New Password</span>
            </label>
            <div className="relative">
              <input
                type={showCf ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="glass-input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowCf((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="glass-btn-primary w-full px-6 py-3.5 flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving New Password…</span>
              </>
            ) : (
              <>
                <span>Save New Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* ── STEP 4: Success Action ── */}
      {step === "SUCCESS" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="glass-btn-primary w-full px-6 py-3.5 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-orange-500/20"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Footer Link ── */}
      {step !== "SUCCESS" && (
        <p className="mt-8 text-sm text-white/60">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-orange-400 font-semibold hover:text-orange-300 hover:underline transition-colors"
          >
            Back to Log In
          </Link>
        </p>
      )}
    </>
  );
}
