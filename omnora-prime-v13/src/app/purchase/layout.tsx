// src/app/purchase/layout.tsx
"use client";


import { useSidebarState } from "@/hooks/useSidebarState";
import { usePersona } from "@/hooks/usePersona";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PurchaseLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebarState();
  const { isLoading, can } = usePersona();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !can('purchase_features')) {
      // In a real scenario, we might redirect if the persona shouldn't see procurement
      // But for this phase, we assume procurement is a core feature for the assigned personas.
    }
  }, [isLoading, can, router]);

  

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-onyx text-slate-200">
      
      <main className={cn( "transition-all duration-300 min-h-screen")}>
        {children}
      </main>
    </div>
  );
}

