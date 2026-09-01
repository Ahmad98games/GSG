import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-noxis-bg text-slate-200 p-6 animate-in fade-in duration-200">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-white/[0.04] animate-pulse rounded-sm" />
            <div className="h-3 w-72 bg-white/[0.03] animate-pulse rounded-sm" />
          </div>
          <div className="h-9 w-36 bg-white/[0.04] animate-pulse rounded-sm" />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface border border-white/5 p-4 space-y-3">
              <div className="h-3 w-24 bg-white/[0.04] animate-pulse rounded-sm" />
              <div className="h-7 w-16 bg-white/[0.06] animate-pulse rounded-sm" />
              <div className="h-2 w-20 bg-white/[0.03] animate-pulse rounded-sm" />
            </div>
          ))}
        </div>

        {/* Filter / Search Bar */}
        <div className="flex items-center gap-4 bg-surface border border-white/5 p-4">
          <div className="h-9 flex-1 bg-white/[0.04] animate-pulse rounded-sm" />
          <div className="h-9 w-28 bg-white/[0.04] animate-pulse rounded-sm" />
          <div className="h-9 w-28 bg-electric-blue/20 animate-pulse rounded-sm" />
        </div>

        {/* Table */}
        <div className="bg-surface border border-white/5 overflow-hidden">
          <div className="bg-[#0F1114] border-b border-white/[0.08] px-4 py-3 flex gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-3 w-16 bg-white/[0.04] animate-pulse rounded-sm" />
            ))}
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-6">
              <div className="h-4 w-24 bg-white/[0.04] animate-pulse rounded-sm" />
              <div className="h-4 w-36 bg-white/[0.04] animate-pulse rounded-sm" />
              <div className="h-5 w-20 bg-white/[0.03] animate-pulse rounded-sm" />
              <div className="h-4 w-16 bg-white/[0.04] animate-pulse rounded-sm" />
              <div className="h-4 w-16 bg-white/[0.04] animate-pulse rounded-sm" />
              <div className="h-4 w-20 bg-white/[0.03] animate-pulse rounded-sm ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
