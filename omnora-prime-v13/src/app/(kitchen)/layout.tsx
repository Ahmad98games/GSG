// src/app/(kitchen)/layout.tsx
"use client";

import { usePersona } from "@/hooks/usePersona";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  const { persona, isLoading } = usePersona();
  const router = useRouter();

  return <>{children}</>;
}

