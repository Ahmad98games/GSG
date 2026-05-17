import React from "react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-[#0F1113]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-xs font-mono uppercase tracking-[0.2em]">
          Loading...
        </p>
      </div>
    </div>
  );
}
