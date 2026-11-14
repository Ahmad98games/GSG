'use client'
import React, { useState, useEffect, useRef } from 'react'
import { RotateCcw, X, Clock, Play } from 'lucide-react'

export interface AutoStartRecoveryBannerProps {
  itemCount?: number
  totalAmount?: number
  entityLabel?: string
  title?: string
  subtitle?: string
  onResume: () => void
  onDiscard: () => void
  countdownSeconds?: number
  className?: string
}

export function AutoStartRecoveryBanner({
  itemCount,
  totalAmount,
  entityLabel = 'sale',
  title,
  subtitle,
  onResume,
  onDiscard,
  countdownSeconds = 10,
  className = '',
}: AutoStartRecoveryBannerProps) {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds)
  const [isPaused, setIsPaused] = useState(false)
  const hasTriggeredRef = useRef(false)

  // Format exact progress description
  const computedTitle = title || (
    typeof itemCount === 'number' && typeof totalAmount === 'number'
      ? `Recovering ${entityLabel} with ${itemCount} item${itemCount === 1 ? '' : 's'} — Rs ${totalAmount.toLocaleString()} total`
      : typeof itemCount === 'number'
      ? `Recovering draft ${entityLabel} with ${itemCount} item${itemCount === 1 ? '' : 's'}`
      : `Unsaved ${entityLabel} recovered from prior session`
  )

  useEffect(() => {
    if (isPaused || hasTriggeredRef.current) return

    if (timeLeft <= 0) {
      hasTriggeredRef.current = true
      onResume()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, isPaused, onResume])

  const handleResumeClick = () => {
    hasTriggeredRef.current = true
    onResume()
  }

  const handleDiscardClick = () => {
    hasTriggeredRef.current = true
    onDiscard()
  }

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`mx-auto mb-4 p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-lg shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 text-amber-100 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-md bg-amber-500/25 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
          <RotateCcw size={16} className="animate-spin-slow" />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-amber-200 truncate">
            {computedTitle}
          </p>
          <p className="text-[11px] text-amber-300/80 flex items-center gap-1.5">
            <Clock size={11} className="shrink-0" />
            <span>
              {subtitle || (
                timeLeft > 0
                  ? `Auto-resuming in ${timeLeft}s... (click Resume or wait)`
                  : 'Restoring state now...'
              )}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <button
          type="button"
          onClick={handleResumeClick}
          className="text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 active:scale-95 px-3.5 py-1.5 rounded-md shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Play size={13} className="fill-black" />
          <span>Resume {entityLabel === 'sale' ? 'last sale' : 'draft'} ({timeLeft}s)</span>
        </button>

        <button
          type="button"
          onClick={handleDiscardClick}
          className="text-xs font-semibold text-amber-200/90 hover:text-red-300 bg-amber-950/40 hover:bg-red-950/40 border border-amber-500/30 hover:border-red-500/40 px-3 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer"
        >
          <X size={13} />
          <span>Start fresh</span>
        </button>
      </div>
    </div>
  )
}

export default AutoStartRecoveryBanner

