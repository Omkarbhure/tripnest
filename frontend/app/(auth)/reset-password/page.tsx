"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the unified OTP-verified forgot password flow
    router.replace("/forgot-password");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-sm text-white/60">Redirecting to verification portal…</div>
    </div>
  );
}
