"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ExpiryRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams?.get('status');
    const destination = status ? `/inventory/expiry?status=${encodeURIComponent(status)}` : '/inventory/expiry';
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <span className="w-6 h-6 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin inline-block" />
        <p className="text-xs text-slate-400 font-mono">Redirecting to Expiry & Batch Management...</p>
      </div>
    </div>
  );
}
