"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button onClick={() => router.back()} className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors mr-8">
      <ArrowLeft size={16} />
      <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
    </button>
  );
}
