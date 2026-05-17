import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#121417] flex items-center justify-center p-8">
      <div className="text-center">
        <p className="text-[#C5A059] font-mono text-6xl font-bold mb-4">404</p>
        <h2 className="text-white text-xl font-semibold mb-2">
          Page not found
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          This page does not exist or has been moved.
        </p>
        <Link href="/dashboard"
          className="px-4 py-2 border border-electric-blue text-electric-blue text-sm hover:bg-electric-blue/10 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
