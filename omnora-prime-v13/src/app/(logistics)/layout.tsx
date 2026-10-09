// src/app/(logistics)/layout.tsx
"use client";

import { usePersona } from "@/hooks/usePersona";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogisticsLayout({ children }: { children: React.ReactNode }) {
  const { persona, isLoading } = usePersona();
  const router = useRouter();

  return <>{children}</>;
}

