'use client'
import { AlertCircle, RefreshCw } from 'lucide-react'

export function ErrorState({
  error,
  retry,
}: {
  error?: string
  retry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/8 border border-red-500/15 flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-red-400" />
      </div>
      <h3 className="text-base font-bold text-white mb-2">
        Failed to load
      </h3>
      <p className="text-xs text-gray-500 mb-5 max-w-xs">
        {error || 'Something went wrong. Check your connection and try again.'}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="flex items-center gap-2 px-4 py-2 border border-white/10 text-gray-400 text-sm hover:border-white/20 transition-all"
        >
          <RefreshCw size={13} />
          Try Again
        </button>
      )}
    </div>
  )
}
