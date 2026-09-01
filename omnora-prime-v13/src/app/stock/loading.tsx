import React from "react";

export default function StockLoading() {
  return (
    <div className="min-h-screen bg-onyx text-slate-200">
      <main>
        {/* TopBar Skeleton */}
        <div className="h-14 bg-surface border-b border-white/5 flex items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <div className="h-3 w-20 bg-white/[0.04] animate-pulse rounded-sm" />
            <div className="h-3 w-2 bg-white/[0.03] animate-pulse rounded-sm" />
            <div className="h-3 w-24 bg-white/[0.05] animate-pulse rounded-sm" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-7 w-28 bg-white/[0.04] animate-pulse rounded-sm" />
            <div className="h-7 w-24 bg-electric-blue/20 animate-pulse rounded-sm" />
          </div>
        </div>

        <div className="p-8 max-w-[1600px] mx-auto space-y-6">
          {/* Controls Skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-9 w-96 bg-white/[0.04] animate-pulse rounded-sm" />
            <div className="h-9 w-40 bg-white/[0.04] animate-pulse rounded-sm" />
          </div>

          {/* Table Skeleton */}
          <div className="bg-surface border border-white/5 overflow-hidden">
            <div className="bg-onyx/50 border-b border-white/5 px-6 py-4 flex gap-8">
              {["SKU Code", "Visual", "Product Name", "Location", "On Hand", "Cost", "Sale", "Batch", "Actions"].map((h) => (
                <div key={h} className="h-3 w-16 bg-white/[0.04] animate-pulse rounded-sm" />
              ))}
            </div>
            <div>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="px-6 py-3 border-b border-white/5 flex items-center gap-8">
                  <div className="h-4 w-20 bg-white/[0.04] animate-pulse rounded-sm font-mono" />
                  <div className="w-8 h-8 bg-white/[0.04] animate-pulse rounded-sm flex-shrink-0" />
                  <div className="h-4 w-36 bg-white/[0.04] animate-pulse rounded-sm" />
                  <div className="h-3 w-24 bg-white/[0.03] animate-pulse rounded-sm" />
                  <div className="h-4 w-12 bg-white/[0.04] animate-pulse rounded-sm" />
                  <div className="h-4 w-16 bg-white/[0.04] animate-pulse rounded-sm" />
                  <div className="h-4 w-16 bg-white/[0.04] animate-pulse rounded-sm" />
                  <div className="h-5 w-24 bg-purple-500/10 animate-pulse rounded-sm" />
                  <div className="flex gap-2 ml-auto">
                    <div className="h-6 w-6 bg-white/[0.03] animate-pulse rounded-sm" />
                    <div className="h-6 w-6 bg-white/[0.03] animate-pulse rounded-sm" />
                    <div className="h-6 w-6 bg-white/[0.03] animate-pulse rounded-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
