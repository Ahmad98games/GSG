"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WorkshopRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/production');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <span className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin inline-block" />
        <p className="text-xs text-slate-400 font-mono">Loading Workshop Operations...</p>
      </div>
    </div>
  );
}
