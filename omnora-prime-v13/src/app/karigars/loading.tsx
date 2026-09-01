import React from "react";

export default function KarigarsLoading() {
  return (
    <div className="min-h-screen bg-noxis-bg text-slate-200 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-white/[0.04] animate-pulse rounded-sm" />
            <div className="h-3 w-64 bg-white/[0.03] animate-pulse rounded-sm" />
          </div>
          <div className="h-9 w-36 bg-white/[0.04] animate-pulse rounded-sm" />
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface border border-white/5 p-4 space-y-3">
              <div className="h-3 w-24 bg-white/[0.04] animate-pulse rounded-sm" />
              <div className="h-7 w-16 bg-white/[0.06] animate-pulse rounded-sm" />
              <div className="h-2 w-20 bg-white/[0.03] animate-pulse rounded-sm" />
            </div>
          ))}
        </div>

        {/* Search/Filter Bar Skeleton */}
        <div className="bg-surface border border-white/5 p-4 flex items-center justify-between">
          <div className="h-8 w-96 bg-white/[0.04] animate-pulse rounded-sm" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-white/[0.04] animate-pulse rounded-sm" />
            <div className="h-8 w-32 bg-white/[0.04] animate-pulse rounded-sm" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-surface border border-white/5 overflow-hidden">
          <div className="bg-[#1A1D21] border-b border-white/10 px-6 py-4 flex gap-8">
            {["Name", "Code", "Grade", "Pay Type", "Rate", "Advance", "Actions"].map((h) => (
              <div key={h} className="h-3 w-16 bg-white/[0.04] animate-pulse rounded-sm" />
            ))}
          </div>
          <div className="divide-y divide-white/[0.04]">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="px-6 py-3 flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/[0.04] animate-pulse flex-shrink-0" />
                  <div className="h-4 w-28 bg-white/[0.04] animate-pulse rounded-sm" />
                </div>
                <div className="h-3 w-20 bg-white/[0.03] animate-pulse rounded-sm" />
                <div className="h-3 w-12 bg-white/[0.03] animate-pulse rounded-sm" />
                <div className="h-5 w-20 bg-white/[0.04] animate-pulse rounded-sm" />
                <div className="h-3 w-16 bg-white/[0.03] animate-pulse rounded-sm" />
                <div className="h-3 w-14 bg-white/[0.03] animate-pulse rounded-sm" />
                <div className="flex gap-2">
                  <div className="h-7 w-7 bg-white/[0.03] animate-pulse rounded-sm" />
                  <div className="h-7 w-7 bg-white/[0.03] animate-pulse rounded-sm" />
                  <div className="h-7 w-7 bg-white/[0.03] animate-pulse rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
