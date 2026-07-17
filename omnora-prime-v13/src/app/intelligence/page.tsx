'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  generateInsights,
  BusinessInsight,
} from '@/lib/intelligence/engine'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useIndustryConfig } from '@/hooks/useIndustryConfig'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Lightbulb,
} from 'lucide-react'

const TYPE_CONFIG = {
  critical: {
    icon: AlertTriangle,
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    label: 'Action Required',
  },
  warning: {
    icon: AlertTriangle,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    label: 'Watch This',
  },
  opportunity: {
    icon: Lightbulb,
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.2)',
    label: 'Opportunity',
  },
  positive: {
    icon: TrendingUp,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    label: 'Going Well',
  },
}

const CATEGORY_LABELS = {
  cash_flow: 'Cash Flow',
  inventory: 'Inventory',
  production: 'Production',
  receivables: 'Receivables',
  payroll: 'Payroll',
  customers: 'Customers',
}

export default function IntelligencePage() {
  const router = useRouter()
  const { profile } = useBusinessProfile()
  const { fmt } = useIndustryConfig()
  const [filter, setFilter] = useState<string>('all')

  const {
    data: insights = [],
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['intelligence', profile?.id],
    queryFn: () => generateInsights(
      profile!.id,
      profile?.currency || 'PKR'
    ),
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  })

  const categories = [
    'all',
    ...Array.from(new Set(
      insights.map(i => i.category)
    )),
  ]

  const filtered = filter === 'all'
    ? insights
    : insights.filter(
        i => i.category === filter
      )

  const criticalCount = insights.filter(
    i => i.type === 'critical'
  ).length
  const warningCount = insights.filter(
    i => i.type === 'warning'
  ).length
  const positiveCount = insights.filter(
    i => i.type === 'positive'
  ).length

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Business Intelligence
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            What your numbers actually mean — updated every 15 minutes
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-300 transition-colors px-3 py-1.5 border border-white/8 hover:border-white/18"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Summary bar */}
      {insights.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              label: 'Action Required',
              count: criticalCount + warningCount,
              color: criticalCount > 0 ? '#EF4444' : '#F59E0B',
            },
            {
              label: 'Going Well',
              count: positiveCount,
              color: '#10B981',
            },
            {
              label: 'Total Insights',
              count: insights.length,
              color: '#60A5FA',
            },
          ].map(item => (
            <div
              key={item.label}
              className="p-4 bg-[#0F1114] border border-white/8 rounded-sm text-center"
            >
              <p
                className="text-2xl font-mono font-bold"
                style={{ color: item.color }}
              >
                {item.count}
              </p>
              <p className="text-[10px] text-gray-600 mt-1">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap ${
                filter === cat
                  ? 'border-[#60A5FA]/50 bg-[#60A5FA]/10 text-[#60A5FA]'
                  : 'border-white/8 text-gray-500 hover:border-white/18'
              }`}
            >
              {cat === 'all'
                ? 'All'
                : CATEGORY_LABELS[
                    cat as keyof typeof CATEGORY_LABELS
                  ] || cat}
            </button>
          ))}
        </div>
      )}

      {/* Insights list */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-28 bg-white/4 rounded-sm"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-[#0F1114] border border-white/8 rounded-sm">
          <CheckCircle
            size={32}
            className="text-emerald-500 mx-auto mb-3"
          />
          <p className="text-sm font-semibold text-emerald-400 mb-1">
            {filter === 'all'
              ? 'Everything looks good'
              : `No ${CATEGORY_LABELS[
                  filter as keyof typeof CATEGORY_LABELS
                ] || filter} insights right now`}
          </p>
          <p className="text-xs text-gray-600">
            {filter === 'all'
              ? 'No critical issues detected. Keep tracking daily activity for ongoing insights.'
              : 'Check back after more activity is recorded.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(insight => {
            const config = TYPE_CONFIG[insight.type]
            const Icon = config.icon
            return (
              <div
                key={insight.id}
                className="rounded-sm border p-5 transition-all"
                style={{
                  backgroundColor: config.bg,
                  borderColor: config.border,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Icon
                      size={16}
                      className="flex-shrink-0 mt-0.5"
                      color={config.color}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p
                          className="text-sm font-bold"
                          style={{ color: config.color }}
                        >
                          {insight.title}
                        </p>
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{
                            color: config.color,
                            backgroundColor: config.color + '20',
                          }}
                        >
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {insight.detail}
                      </p>
                    </div>
                  </div>
                  <p
                    className="text-base font-mono font-bold flex-shrink-0"
                    style={{ color: config.color }}
                  >
                    {insight.metric}
                  </p>
                </div>

                {insight.actionRoute && (
                  <button
                    onClick={() => router.push(insight.actionRoute!)}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    style={{ color: config.color }}
                  >
                    {insight.action}
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {dataUpdatedAt > 0 && (
        <p className="text-[10px] text-gray-700 text-center mt-6">
          Last analyzed: {new Date(dataUpdatedAt).toLocaleTimeString('en-PK')}
        </p>
      )}
    </div>
  )
}
