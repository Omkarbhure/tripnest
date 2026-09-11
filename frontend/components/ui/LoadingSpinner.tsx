"use client";

import { motion } from "framer-motion";
import { Compass, Sparkles, Plane } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "fullscreen";
  message?: string;
  subMessage?: string;
  icon?: "compass" | "sparkles" | "plane";
}

export default function LoadingSpinner({
  size = "md",
  message = "Loading...",
  subMessage,
  icon = "compass",
}: LoadingSpinnerProps) {
  const IconComponent =
    icon === "sparkles" ? Sparkles : icon === "plane" ? Plane : Compass;

  if (size === "fullscreen") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative z-20 px-4">
        {/* Glowing concentric background glow */}
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-orange-500/20 via-amber-500/20 to-rose-500/20 blur-3xl pointer-events-none animate-pulse" />

        <div className="relative flex flex-col items-center">
          {/* Animated Glowing Ring & Icon */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Outer spinning gradient ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-400 border-r-amber-400 border-b-rose-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            {/* Inner counter-spinning ring */}
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-transparent border-t-sky-400 border-l-violet-400"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            {/* Center pulsing icon */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg text-orange-400 shadow-orange-500/20"
            >
              <IconComponent className="w-6 h-6 text-amber-300" />
            </motion.div>
          </div>

          {/* Text labels */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center space-y-1.5"
          >
            <p className="text-base font-bold bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400 bg-clip-text text-transparent tracking-wide">
              {message}
            </p>
            {subMessage && (
              <p className="text-xs text-white/50 max-w-xs">{subMessage}</p>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  if (size === "lg") {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-4">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-400 border-r-amber-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-1.5 rounded-full border-2 border-transparent border-b-rose-400 border-l-sky-400"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          />
          <IconComponent className="w-5 h-5 text-amber-400 animate-pulse" />
        </div>
        {message && (
          <p className="text-xs font-semibold text-white/70 tracking-wide">
            {message}
          </p>
        )}
      </div>
    );
  }

  if (size === "sm") {
    return (
      <div className="inline-flex items-center gap-2">
        <div className="relative w-4 h-4 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border-[2px] border-orange-400 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        </div>
        {message && <span className="text-xs text-white/80">{message}</span>}
      </div>
    );
  }

  // Default "md"
  return (
    <div className="py-8 flex flex-col items-center justify-center gap-3">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-400 border-r-amber-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-1 rounded-full border-2 border-transparent border-b-rose-400"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        />
        <IconComponent className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
      </div>
      {message && (
        <p className="text-xs font-medium text-white/60 tracking-wide">
          {message}
        </p>
      )}
    </div>
  );
}
