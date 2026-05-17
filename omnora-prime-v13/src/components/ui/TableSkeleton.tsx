import React from "react";
import { cn } from "@/lib/utils";

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number, cols?: number }) {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className="flex space-x-4 border-b border-white/5 pb-4">
        {[...Array(cols)].map((_, i) => (
          <div key={i} className="h-4 bg-white/5 rounded w-1/4" />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex space-x-4 py-4 border-b border-white/[0.02]">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="h-3 bg-white/5 rounded w-1/4" />
          ))}
        </div>
      ))}
    </div>
  );
}
