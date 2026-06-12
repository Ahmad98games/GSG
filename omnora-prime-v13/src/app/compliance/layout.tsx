// src/app/(compliance)/layout.tsx
"use client";

import { usePersona } from "@/hooks/usePersona";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  const { persona, isLoading, can } = usePersona();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !can('compliance_features')) {
      router.push("/dashboard");
    }
  }, [persona, isLoading, router, can]);

  if (isLoading || !can('compliance_features')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-onyx text-electric-blue font-mono uppercase tracking-[0.3em] text-sm animate-pulse">
        Accessing Governance Records...
      </div>
    );
  }

  return <>{children}</>;
}

