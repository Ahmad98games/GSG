"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#121417] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-white text-xl font-semibold mb-2">
          Something went wrong!
        </h2>
        <p className="text-gray-400 text-sm mb-2">
          {error.message || 'An unexpected error occurred'}
        </p>
        {error.digest && (
          <p className="text-gray-600 text-xs font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-electric-blue/10 border border-electric-blue text-electric-blue text-sm hover:bg-electric-blue/20 transition-colors"
          >
            Try Again
          </button>
          <Link href="/dashboard"
            className="px-4 py-2 bg-white/5 border border-white/10 text-gray-400 text-sm hover:bg-white/10 transition-colors"
          >
           Go Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
