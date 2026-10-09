// src/app/(medical)/layout.tsx
"use client";

import { usePersona } from "@/hooks/usePersona";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MedicalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

