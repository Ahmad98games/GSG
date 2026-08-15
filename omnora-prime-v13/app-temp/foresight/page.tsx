'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useIndustryConfig } from '@/hooks/useIndustryConfig'
import { analyzeBusinessPatterns, savePatterns } from '@/lib/foresight/patternEngine'
import { generatePredictions } from '@/lib/foresight/predictionEngine'
import {
  Eye, Brain, ArrowRight,
  RefreshCw, Clock, CheckCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const IMPACT_CONFIG = {
  critical: {
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.04)',
    border: 'rgba(239,68,68,0.18)',
    icon: '🚨',
    label: 'Critical Alert',
  },
  high: {
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.04)',
    border: 'rgba(245,158,11,0.15)',
    icon: '⚠️',
    label: 'Warning',
  },
  medium: {
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.04)',
    border: 'rgba(96,165,250,0.15)',
    icon: '💡',
    label: 'Insight',
  },
  low: {
    color: '#10B981',
    bg: 'rgba(16,185,129,0.04)',
    border: 'rgba(16,185,129,0.15)',
    icon: '✨',
    label: 'Tip',
  },
}

export default function ForesightPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const { fmtDate } = useIndustryConfig()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const { data: predictions = [], refetch } = useQuery({
    queryKey: ['foresight', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('foresight_predictions')
        .select('*')
        .eq('business_id', profile!.id)
        .eq('status', 'active')
        .order('confidence', { ascending: false })
      return data || []
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
  })

  const { data: patterns = [] } = useQuery({
    queryKey: ['patterns', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('business_patterns')
        .select('*')
        .eq('business_id', profile!.id)
        .order('confidence_score', { ascending: false })
      return data || []
    },
    enabled: !!profile?.id,
  })

  const runAnalysis = async () => {
    if (!profile?.id || isAnalyzing) return
    setIsAnalyzing(true)

    try {
      // 1. Learn patterns from history
      const learnedPatterns = await analyzeBusinessPatterns(profile.id)

      // 2. Save patterns to database
      await savePatterns(profile.id, learnedPatterns)

      // 3. Generate predictions from patterns
      await generatePredictions(profile.id)

      // 4. Refresh UI
      await refetch()

      setLastAnalyzed(new Date())
    } catch (err) {
      console.error('Foresight analysis failed:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-run on first load if no predictions
  useEffect(() => {
    if (profile?.id && predictions.length === 0) {
      runAnalysis()
    }
  }, [profile?.id])

  const markResolved = async (id: string) => {
    const { error } = await supabase
      .from('foresight_predictions')
      .update({ status: 'resolved', action_taken: true })
      .eq('id', id)
    if (error) {
      console.error('Failed to mark resolved:', error)
    }
    await refetch()
  }

  const filteredPredictions = filter === 'all'
    ? predictions
    : predictions.filter((p: any) => p.impact === filter)

  const criticalCount = predictions.filter((p: any) => p.impact === 'critical').length
  const highCount = predictions.filter((p: any) => p.impact === 'high').length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={20} className="text-[#60A5FA]" />
            <h1 className="text-xl font-bold text-white tracking-tight uppercase italic flex items-center gap-2">
              Noxis Foresight
            </h1>
          </div>
          <p className="text-xs text-gray-500">
            A real-time business memory and predictions engine tracking potential operational risks.
          </p>
          {lastAnalyzed && (
            <p className="text-[10px] text-gray-700 mt-1 font-mono">
              Last analyzed: {lastAnalyzed.toLocaleTimeString()} · {patterns.length} patterns loaded
            </p>
          )}
        </div>
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-gray-400 text-xs font-black uppercase tracking-widest hover:border-white/20 disabled:opacity-50 transition-all"
        >
          <RefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
          {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
        </button>
      </div>

      {/* Analysis running state */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 bg-[#0F1114] border border-[#60A5FA]/20 rounded-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#60A5FA]/30 border-t-[#60A5FA] rounded-full animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#60A5FA]">
                Scanning Historical Workflows & Logs...
              </p>
            </div>
            <div className="space-y-1.5 text-[10px] text-gray-550 font-mono">
              <p>↳ Processing customer receipt settlement speed averages</p>
              <p>↳ Simulating daily component & inventory depletion thresholds</p>
              <p>↳ Mapping supplier delivery timelines and worst-case buffers</p>
              <p>↳ Aggregating karigar output efficiency and defect rates</p>
              <p>↳ Correlating monthly sales seasonality curves</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert summary */}
      {(criticalCount > 0 || highCount > 0) && (
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-sm">
          <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">
            {criticalCount > 0
              ? `${criticalCount} Critical Prediction${criticalCount > 1 ? 's' : ''} Require Immediate Attention`
              : `${highCount} High Priority Warning${highCount > 1 ? 's' : ''} Identified`}
          </p>
          <p className="text-[11px] text-gray-550">
            Foresight calculated these alerts from your factory history. Review the items below.
          </p>
        </div>
      )}

      {/* Impact filter */}
      {predictions.length > 3 && (
        <div className="flex gap-2">
          {['all', 'critical', 'high', 'medium', 'low'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all ${
                filter === f
                  ? 'border-[#60A5FA]/40 bg-[#60A5FA]/10 text-[#60A5FA]'
                  : 'border-white/5 text-gray-650 hover:border-white/15'
              }`}
            >
              {f === 'all' ? `All (${predictions.length})` : f}
            </button>
          ))}
        </div>
      )}

      {/* Predictions */}
      {filteredPredictions.length === 0 && !isAnalyzing ? (
        <div className="p-12 text-center bg-[#0F1114] border border-white/5 rounded-sm max-w-xl mx-auto shadow-2xl">
          <Eye size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            {predictions.length === 0 ? 'Calibrating Foresight Engine' : 'Filter returned no results'}
          </p>
          <p className="text-[11px] text-gray-650">
            {predictions.length === 0
              ? 'Foresight requires transactional history (invoices, piece rates) to learn patterns. Continue standard usage and re-analyze.'
              : 'All predictions for this category have been marked resolved.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPredictions.map((pred: any) => {
            const config = IMPACT_CONFIG[pred.impact as keyof typeof IMPACT_CONFIG] || IMPACT_CONFIG.medium

            return (
              <div
                key={pred.id}
                className="rounded-sm border p-5 transition-all shadow-md"
                style={{
                  backgroundColor: config.bg,
                  borderColor: config.border,
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl flex-shrink-0 mt-0.5">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-2">
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm"
                          style={{
                            color: config.color,
                            backgroundColor: config.color + '15',
                          }}
                        >
                          {config.label}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          Confidence: {Math.round(pred.confidence * 100)}%
                        </span>
                        {pred.predicted_date && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                            <Clock size={10} />
                            ETA: {fmtDate(pred.predicted_date)}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs font-bold leading-snug mb-1.5 uppercase tracking-wide"
                        style={{ color: config.color }}
                      >
                        {pred.title}
                      </p>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                        {pred.detail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/5">
                  {pred.draft_action && (
                    <button
                      onClick={() => router.push(pred.draft_action.route)}
                      className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-all hover:brightness-110"
                      style={{ color: config.color }}
                    >
                      {pred.draft_action.label}
                      <ArrowRight size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => markResolved(pred.id)}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-650 hover:text-gray-400 ml-auto transition-colors"
                  >
                    <CheckCircle size={12} />
                    Mark Resolved
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* What Foresight has learned */}
      {patterns.length > 0 && (
        <div className="p-6 bg-[#0F1114] border border-white/5 rounded-sm space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            Learned Business Patterns
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                label: 'Customer Payment Profiles',
                count: patterns.filter((p: any) => p.pattern_type === 'customer_payment_cycle').length,
                icon: '💰',
              },
              {
                label: 'Supplier Lead Time Medians',
                count: patterns.filter((p: any) => p.pattern_type === 'supplier_lead_time').length,
                icon: '🚚',
              },
              {
                label: 'Worker Output Trends',
                count: patterns.filter((p: any) => p.pattern_type === 'karigar_performance').length,
                icon: '👷',
              },
              {
                label: 'Stock Consumption Rates',
                count: patterns.filter((p: any) => p.pattern_type === 'stock_consumption_rate').length,
                icon: '📦',
              },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-white/[0.01] border border-white/5 rounded-sm">
                <span className="text-xl bg-white/5 p-1 rounded-sm">{item.icon}</span>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {item.count} Active Pattern{item.count !== 1 ? 's' : ''}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 font-medium">
            Patterns update continuously in the background as you process inventory modifications, invoices, and karigar attendance logs.
          </p>
        </div>
      )}
    </div>
  )
}
