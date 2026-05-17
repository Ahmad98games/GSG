import React from "react";
import { cn } from "@/lib/utils";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-surface border border-white/5 p-6 rounded-sm animate-pulse space-y-4", className)}>
      <div className="h-4 bg-white/5 rounded w-1/3" />
      <div className="h-8 bg-white/5 rounded w-1/2" />
      <div className="h-3 bg-white/5 rounded w-2/3" />
    </div>
  );
}
