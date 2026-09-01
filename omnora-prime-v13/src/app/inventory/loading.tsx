import React from "react";

export default function InventoryLoading() {
  return (
    <div className="min-h-screen bg-[#121417] text-slate-200 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6 w-full">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-5 w-40 bg-white/[0.04] animate-pulse rounded-sm" />
            <div className="h-3 w-56 bg-white/[0.03] animate-pulse rounded-sm" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-28 bg-white/[0.04] animate-pulse rounded-sm" />
            <div className="h-8 w-24 bg-white/[0.04] animate-pulse rounded-sm" />
          </div>
        </div>

        {/* Filters & Actions Bar Skeleton */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-surface border border-white/5 p-4">
          <div className="relative flex-1 h-9 bg-white/[0.04] animate-pulse rounded-sm" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-24 bg-white/[0.04] animate-pulse rounded-sm" />
            <div className="h-9 w-24 bg-electric-blue/20 animate-pulse rounded-sm" />
            <div className="h-9 w-32 bg-white/[0.04] animate-pulse rounded-sm" />
            <div className="h-9 w-28 bg-white/[0.04] animate-pulse rounded-sm" />
            <div className="h-9 w-28 bg-white/[0.04] animate-pulse rounded-sm" />
            <div className="h-9 w-8 bg-white/[0.04] animate-pulse rounded-sm" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-surface border border-white/5 overflow-hidden max-h-[700px]">
          {/* Table Header */}
          <div className="bg-[#0F1114] border-b border-white/[0.08] px-4 py-3 flex gap-6">
            {["SKU Code", "Product Name", "Category", "On Hand", "Status", "Unit", "Cost", "Sale", "Actions"].map((h) => (
              <div key={h} className="h-3 w-16 bg-white/[0.04] animate-pulse rounded-sm" />
            ))}
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-white/[0.04]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div key={i} className="px-4 py-2.5 flex items-center gap-6">
                <div className="h-4 w-20 bg-white/[0.04] animate-pulse rounded-sm font-mono" />
                <div className="h-4 w-36 bg-white/[0.04] animate-pulse rounded-sm" />
                <div className="h-5 w-24 bg-white/[0.03] animate-pulse rounded-sm" />
                <div className="h-4 w-12 bg-white/[0.04] animate-pulse rounded-sm" />
                <div className="h-5 w-20 bg-emerald-500/10 animate-pulse rounded-sm" />
                <div className="h-3 w-8 bg-white/[0.03] animate-pulse rounded-sm" />
                <div className="h-4 w-16 bg-white/[0.04] animate-pulse rounded-sm" />
                <div className="h-4 w-16 bg-white/[0.04] animate-pulse rounded-sm" />
                <div className="h-7 w-7 bg-white/[0.03] animate-pulse rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
