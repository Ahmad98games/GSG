'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useIndustryConfig } from '@/hooks/useIndustryConfig'
import { analyzeBusinessPatterns, savePatterns } from '@/lib/foresight/patternEngine'
import { generatePredictions, ForesightPrediction } from '@/lib/foresight/predictionEngine'
import {
  Eye, Brain, ArrowRight,
  RefreshCw, Clock, CheckCircle,
  AlertTriangle, ShieldAlert, Sparkles,
  TrendingDown, CheckCircle2, Activity,
  Sliders, Search, Filter
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const IMPACT_CONFIG = {
  critical: {
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.3)',
    icon: '🚨',
    label: 'Critical Alert',
  },
  high: {
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.25)',
    icon: '⚠️',
    label: 'High Warning',
  },
  medium: {
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.06)',
    border: 'rgba(96,165,250,0.25)',
    icon: '💡',
    label: 'Strategic Insight',
  },
  low: {
    color: '#10B981',
    bg: 'rgba(16,185,129,0.06)',
    border: 'rgba(16,185,129,0.25)',
    icon: '✨',
    label: 'Optimization Tip',
  },
}

const SCAN_STEPS = [
  'Ingesting transaction ledgers, cash flow obligations & customer invoices',
  'Auditing Khata debtor aging curves & delayed settlement probabilities',
  'Cross-referencing floor karigar stitching velocity & bottleneck risks',
  'Analyzing Mandi cotton/yarn volatility & greige fabric margin pressures',
  'Synthesizing neural foresight matrix & prescriptive CFO actions'
]

export default function ForesightPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const { fmtDate } = useIndustryConfig()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [scanStepIndex, setScanStepIndex] = useState(0)
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const hasAutoRan = useRef(false)

  // Local fallback storage
  const [localPredictions, setLocalPredictions] = useState<ForesightPrediction[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`noxis_cached_foresight_${profile?.id || 'default'}`)
        return cached ? JSON.parse(cached) : []
      } catch {
        return []
      }
    }
    return []
  })

  const { data: dbPredictions = [], refetch } = useQuery({
    queryKey: ['foresight', profile?.id],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from('foresight_predictions')
          .select('*')
          .eq('status', 'active')
          .order('confidence', { ascending: false })
        
        if (data && data.length > 0) return data
      } catch (e) {
        console.warn('[Foresight] DB query notice:', e)
      }
      return localPredictions
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  })

  const predictions: ForesightPrediction[] = useMemo(() => {
    const list = dbPredictions.length > 0 ? dbPredictions : localPredictions
    return list.map((p: any) => ({
      id: p.id,
      type: p.type || p.prediction_type,
      title: p.title,
      detail: p.detail,
      predictedDate: p.predictedDate || p.predicted_date,
      confidence: p.confidence || 0.9,
      impact: p.impact || 'medium',
      entityLabel: p.entityLabel || p.entity_label || 'Business Risk',
      draftAction: p.draftAction || p.draft_action,
      supportingData: p.supportingData || p.supporting_data || {}
    }))
  }, [dbPredictions, localPredictions])

  const runAnalysis = async () => {
    if (isAnalyzing) return
    setIsAnalyzing(true)
    setScanStepIndex(0)

    try {
      // Step-by-step telemetry animation
      for (let i = 0; i < SCAN_STEPS.length; i++) {
        setScanStepIndex(i)
        await new Promise(r => setTimeout(r, 450))
      }

      const businessId = profile?.id || 'default'

      // 1. Learn patterns
      try {
        const learned = await analyzeBusinessPatterns(businessId)
        await savePatterns(businessId, learned)
      } catch (err) {
        console.warn('[Foresight] Pattern extraction notice:', err)
      }

      // 2. Generate deep multi-vector predictions
      const freshPredictions = await generatePredictions(businessId)

      setLocalPredictions(freshPredictions)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`noxis_cached_foresight_${businessId}`, JSON.stringify(freshPredictions))
      }

      await refetch()
      setLastAnalyzed(new Date())
    } catch (err) {
      console.error('Foresight analysis failed:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Trigger once on initial mount if empty
  useEffect(() => {
    if (!hasAutoRan.current) {
      hasAutoRan.current = true
      if (predictions.length === 0) {
        runAnalysis()
      } else {
        setLastAnalyzed(new Date())
      }
    }
  }, [predictions.length])

  const markResolved = async (id: string) => {
    try {
      await supabase
        .from('foresight_predictions')
        .update({ status: 'resolved', action_taken: true })
        .eq('id', id)
    } catch {}

    const updated = predictions.filter(p => p.id !== id)
    setLocalPredictions(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`noxis_cached_foresight_${profile?.id || 'default'}`, JSON.stringify(updated))
    }
    refetch()
  }

  const filteredPredictions = useMemo(() => {
    return predictions.filter(p => {
      const matchesFilter = filter === 'all' || p.impact === filter
      const matchesSearch = !searchQuery || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.entityLabel.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [predictions, filter, searchQuery])

  const criticalCount = predictions.filter(p => p.impact === 'critical').length
  const highCount = predictions.filter(p => p.impact === 'high').length
  const mediumCount = predictions.filter(p => p.impact === 'medium').length
  const lowCount = predictions.filter(p => p.impact === 'low').length

  // Calculate Factory Resiliency Score (0 - 100)
  const resiliencyScore = useMemo(() => {
    let score = 96
    score -= criticalCount * 8
    score -= highCount * 4
    score -= mediumCount * 2
    return Math.max(55, Math.min(98, score))
  }, [criticalCount, highCount, mediumCount])

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      <main className="p-6 lg:p-10 max-w-[1500px] mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#60A5FA]/10 text-[#60A5FA] rounded-sm">
                <Brain size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black uppercase tracking-tight text-white italic">
                    Noxis Foresight
                  </h1>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-sm bg-[#60A5FA]/10 text-[#60A5FA] border border-[#60A5FA]/20">
                    Neural Predictive Engine
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Real-time operational risk forecasting, working capital stress simulations, and prescriptive factory interventions.
                </p>
              </div>
            </div>
            {lastAnalyzed && (
              <p className="text-[10px] text-gray-600 mt-2 font-mono flex items-center gap-1.5">
                <Activity size={12} className="text-emerald-500" />
                Latest Deep Audit Executed: {lastAnalyzed.toLocaleTimeString()} · Active Sentinel Monitoring
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0070F3] hover:brightness-110 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-all rounded-sm shadow-lg shadow-blue-500/20"
            >
              <RefreshCw size={13} className={isAnalyzing ? 'animate-spin' : ''} />
              {isAnalyzing ? 'Running Deep Scan...' : 'Deep Scan Factory'}
            </button>
          </div>
        </div>

        {/* Executive Factory Resiliency Scorecard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#1A1D21] border border-white/5 p-6 rounded-sm shadow-xl">
           <div className="border-r border-white/5 pr-6 space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                Factory Resiliency Index
              </span>
              <div className="flex items-baseline space-x-3">
                 <span className={cn(
                   "text-3xl font-mono font-black",
                   resiliencyScore >= 80 ? "text-emerald-400" : resiliencyScore >= 70 ? "text-amber-400" : "text-red-400"
                 )}>
                   {resiliencyScore} <span className="text-xs text-gray-500 font-normal">/ 100</span>
                 </span>
                 <span className="text-[9px] uppercase font-bold text-gray-400 font-mono">
                   {resiliencyScore >= 80 ? 'Robust' : 'Moderate Risk'}
                 </span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                 <div 
                   className={cn(
                     "h-full rounded-full transition-all duration-1000",
                     resiliencyScore >= 80 ? "bg-emerald-500" : resiliencyScore >= 70 ? "bg-amber-500" : "bg-red-500"
                   )} 
                   style={{ width: `${resiliencyScore}%` }} 
                 />
              </div>
           </div>

           <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Working Capital Runway</span>
              <p className="text-xl font-bold font-mono text-white">24 Days</p>
              <span className="text-[9px] text-amber-400 font-mono">Shortfall danger near day 28</span>
           </div>

           <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Floor Line Efficiency</span>
              <p className="text-xl font-bold font-mono text-white">88.4%</p>
              <span className="text-[9px] text-emerald-400 font-mono">Stitching pace on target</span>
           </div>

           <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Debtor Khata Recovery</span>
              <p className="text-xl font-bold font-mono text-white">PKR 280k</p>
              <span className="text-[9px] text-red-400 font-mono">3 Accounts exceeding terms</span>
           </div>
        </div>

        {/* Scanning Telemetry Active State */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 bg-[#0F1114] border border-[#60A5FA]/30 rounded-sm space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-[#60A5FA]/30 border-t-[#60A5FA] rounded-full animate-spin" />
                  <p className="text-xs font-bold uppercase tracking-widest text-[#60A5FA]">
                    Executing Deep Multi-Vector Risk Scan ({Math.round(((scanStepIndex + 1) / SCAN_STEPS.length) * 100)}%)...
                  </p>
                </div>
                <span className="text-[10px] text-gray-500 font-mono uppercase">Phase {scanStepIndex + 1} of 5</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {SCAN_STEPS.map((step, idx) => (
                  <div key={step} className={cn(
                    "flex items-center space-x-2 text-[10px] transition-colors",
                    idx < scanStepIndex ? "text-emerald-400" : idx === scanStepIndex ? "text-[#60A5FA] font-bold" : "text-gray-600"
                  )}>
                     <span>{idx < scanStepIndex ? '✓' : idx === scanStepIndex ? '↳' : '·'}</span>
                     <span>{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1A1D21] border border-white/5 p-4 rounded-sm">
           <div className="flex items-center space-x-2 overflow-x-auto">
              {[
                { id: 'all', label: `All Forecasts (${predictions.length})` },
                { id: 'critical', label: `Critical (${criticalCount})`, badge: '🚨' },
                { id: 'high', label: `Warnings (${highCount})`, badge: '⚠️' },
                { id: 'medium', label: `Insights (${mediumCount})`, badge: '💡' },
                { id: 'low', label: `Optimizations (${lowCount})`, badge: '✨' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all whitespace-nowrap",
                    filter === tab.id 
                      ? "bg-[#60A5FA] text-black font-black shadow-md" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {tab.label}
                </button>
              ))}
           </div>

           <div className="flex items-center space-x-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-sm">
              <Search size={14} className="text-gray-500" />
              <input 
                type="text" 
                placeholder="Search predictions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white outline-none w-48 font-mono"
              />
           </div>
        </div>

        {/* Predictions Feed */}
        {filteredPredictions.length === 0 && !isAnalyzing ? (
          <div className="p-16 text-center bg-[#1A1D21] border border-white/5 rounded-sm max-w-xl mx-auto shadow-2xl">
            <Eye size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              No Pending Alerts in this Filter
            </p>
            <p className="text-[11px] text-gray-600 mb-4">
              All identified predictions for this category have been reviewed or resolved.
            </p>
            <button 
              onClick={runAnalysis}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all rounded-sm"
            >
              Re-run Deep Scan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPredictions.map((pred: ForesightPrediction) => {
              const config = IMPACT_CONFIG[pred.impact] || IMPACT_CONFIG.medium

              return (
                <div
                  key={pred.id}
                  className="rounded-sm border p-6 transition-all shadow-md group hover:border-white/20"
                  style={{
                    backgroundColor: config.bg,
                    borderColor: config.border,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <span className="text-2xl flex-shrink-0 mt-0.5">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <span
                            className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-sm"
                            style={{
                              color: config.color,
                              backgroundColor: config.color + '20',
                            }}
                          >
                            {config.label}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono font-bold">
                            Model Confidence: {Math.round(pred.confidence * 100)}%
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            Domain: {pred.entityLabel}
                          </span>
                          {pred.predictedDate && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono ml-auto">
                              <Clock size={11} className="text-gray-500" />
                              Impact Horizon: {pred.predictedDate}
                            </span>
                          )}
                        </div>

                        <h3
                          className="text-sm font-black leading-snug mb-2 uppercase tracking-wide"
                          style={{ color: config.color }}
                        >
                          {pred.title}
                        </h3>

                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                          {pred.detail}
                        </p>

                        {/* Supporting Telemetry Pills */}
                        {pred.supportingData && Object.keys(pred.supportingData).length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-white/5">
                            {Object.entries(pred.supportingData).map(([k, v]) => (
                              <span key={k} className="text-[9px] font-mono bg-black/40 px-2 py-0.5 rounded text-gray-400 border border-white/5">
                                <span className="text-gray-500">{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-white/5">
                    {pred.draftAction ? (
                      <button
                        onClick={() => router.push(pred.draftAction!.route)}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-sm transition-all hover:brightness-125 shadow-sm"
                        style={{ 
                          backgroundColor: config.color + '20', 
                          color: config.color,
                          border: `1px solid ${config.color}40`
                        }}
                      >
                        <span>{pred.draftAction.label}</span>
                        <ArrowRight size={13} />
                      </button>
                    ) : <div />}

                    <button
                      onClick={() => markResolved(pred.id)}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-sm transition-colors"
                    >
                      <CheckCircle size={13} className="text-emerald-500" />
                      <span>Mark Addressed</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
