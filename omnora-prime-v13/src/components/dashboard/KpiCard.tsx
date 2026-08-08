'use client'
import { memo, useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string
  subValue?: string
  trend?: 'up' | 'down' | 'flat' | null
  trendPct?: number
  color?: string
  icon?: React.ReactNode
  onClick?: () => void
  loading?: boolean
}

export const KpiCard = memo(
  function KpiCard({
    label, value, subValue, trend,
    trendPct, color = '#60A5FA',
    icon, onClick, loading,
  }: KpiCardProps) {
    const [displayed, setDisplayed] = useState('0')
    const [mounted, setMounted] = useState(false)

    // Count-up animation
    useEffect(() => {
      if (loading) return
      setMounted(true)
      const numericValue = parseFloat(
        value.replace(/[^0-9.]/g, '')
      )
      if (isNaN(numericValue)) {
        setDisplayed(value)
        return
      }

      // Fast count-up in 600ms
      const steps = 20
      const duration = 600
      const increment = numericValue / steps
      let current = 0
      let step = 0

      const prefix = value.replace(
        /[\d.,]+/, ''
      ).split(/[\d]/)[0]

      const timer = setInterval(() => {
        step++
        current = Math.min(
          current + increment, numericValue
        )
        const formatted = value.includes(',')
          ? Math.round(current)
              .toLocaleString('en-PK')
          : Math.round(current).toString()
        setDisplayed(prefix + formatted)
        if (step >= steps) clearInterval(timer)
      }, duration / steps)

      return () => clearInterval(timer)
    }, [value, loading])

    if (loading) {
      return (
        <div className="p-5 bg-[#0F1114] border border-white/6 rounded-sm animate-pulse">
          <div className="h-3 bg-white/8 rounded w-1/3 mb-3" />
          <div className="h-8 bg-white/8 rounded w-2/3 mb-2" />
          <div className="h-2 bg-white/5 rounded w-1/2" />
        </div>
      )
    }

    const TrendIcon = trend === 'up'
      ? TrendingUp
      : trend === 'down'
      ? TrendingDown
      : Minus

    const trendColor = trend === 'up'
      ? '#10B981'
      : trend === 'down'
      ? '#EF4444'
      : '#4B5563'

    return (
      <div
        onClick={onClick}
        className={`
          p-5 bg-[#0F1114]
          border border-white/6 rounded-sm
          transition-all duration-150
          group relative overflow-hidden
          ${onClick
            ? 'cursor-pointer hover:border-white/15 hover:bg-[#161A1F]'
            : ''}
          ${mounted
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2'}
        `}
        style={{
          transition: 'opacity 300ms ease, transform 300ms ease',
        }}
      >
        {/* Subtle color strip at top */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
          style={{ background: color }}
        />

        {/* Label */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {label}
          </p>
          {icon && (
            <div className="opacity-30 group-hover:opacity-60 transition-opacity">
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <p
          className="text-2xl font-black font-mono tracking-tight leading-none mb-2"
          style={{ color }}
        >
          {displayed}
        </p>

        {/* Sub-value and trend */}
        <div className="flex items-center justify-between mt-2">
          {subValue && (
            <p className="text-[10px] text-gray-600">
              {subValue}
            </p>
          )}
          {trend && trendPct !== undefined && (
            <div className="flex items-center gap-1">
              <TrendIcon
                size={10}
                color={trendColor}
              />
              <span
                className="text-[10px] font-bold"
                style={{ color: trendColor }}
              >
                {trendPct > 0 ? '+' : ''}
                {trendPct}%
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }
)
