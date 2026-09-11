"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="glass-canvas min-h-screen">
        <div className="glass-orbs" aria-hidden>
          <motion.div
            className="glass-orb glass-orb--orange"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="glass-orb glass-orb--violet"
            animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div
            className="glass-orb glass-orb--cyan"
            animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <div className="glass-grain" />
        </div>
        <LoadingSpinner
          size="fullscreen"
          message="Welcome to TripNest"
          subMessage="Preparing your travel workspace..."
          icon="compass"
        />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
