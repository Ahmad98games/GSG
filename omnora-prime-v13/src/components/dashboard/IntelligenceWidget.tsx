'use client'

import { useEffect, useState } from 'react'
import { generateInsights, IntelligenceInsight }
  from '@/lib/intelligence/engine'
import { generatePredictions }
  from '@/lib/intelligence/predictions'
import { useBusinessProfile }
  from '@/hooks/useBusinessProfile'
import { createClient }
  from '@/lib/supabase/client'
import Link from 'next/link'
import { BrainCircuit, Loader2, Sparkles } from 'lucide-react'

export function IntelligenceWidget() {
  const { profile } = useBusinessProfile()
  const supabase = createClient()
  const [insights, setInsights] = useState<IntelligenceInsight[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!profile?.id) return
    loadIntelligence()
  }, [profile?.id])
  
  const loadIntelligence = async () => {
    if (!profile) return
    
    try {
      // Generate fresh insights
      const fresh = await generateInsights({
        id: profile.id,
        industry: profile.industry_key || 'general',
        city: profile.city || '',
        country_code: profile.country_code || 'PK',
        currency: profile.currency || 'PKR',
      })
      setInsights(fresh)
      
      // Generate predictions (async, non-blocking)
      generatePredictions(profile.id).catch(() => {})
      
      // Load saved predictions
      const { data: preds } = await supabase
        .from('predictions')
        .select('*')
        .eq('business_id', profile.id)
        .eq('status', 'active')
        .order('urgency', { ascending: false })
        .limit(5)
      
      setPredictions(preds || [])
    } catch (e) {
      // Silent — widget is supplementary
    } finally {
      setLoading(false)
    }
  }
  
  const dismissPrediction = async (id: string) => {
    await supabase.from('predictions')
      .update({ 
        status: 'dismissed',
        dismissed_at: new Date().toISOString() 
      })
      .eq('id', id)
    
    setPredictions(prev => prev.filter(p => p.id !== id))
  }
  
  const urgencyColor = (u: string) => {
    const classes: Record<string, string> = {
      critical: 'text-red-400 border-red-500/20 bg-red-500/5',
      high: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
      medium: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
      low: 'text-gray-400 border-white/8 bg-[#0F1114]',
      warning: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
      info: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    }
    return classes[u] || 'text-gray-400 border-white/8 bg-[#0F1114]'
  }
  
  if (loading) return (
    <div className="mb-6 p-4 bg-surface border border-white/5 flex items-center justify-center gap-2">
      <Loader2 className="w-4 h-4 text-electric-blue animate-spin" />
      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Compiling Predictor Mesh...</span>
    </div>
  )
  
  const allItems = [
    ...predictions.map(p => ({
      ...p,
      _source: 'prediction'
    })),
    ...insights.map(i => ({
      ...i,
      _source: 'insight',
      id: `insight-${i.type}`,
    })),
  ]
  
  if (allItems.length === 0) return null
  
  return (
    <div className="mb-6 bg-surface/30 p-4 border border-white/5 rounded-sm shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,229,255,0.015)_0%,transparent_60%)] pointer-events-none" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-electric-blue animate-pulse" size={16} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            Noxis Intelligence
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-electric-blue/5 border border-electric-blue/10 px-2 py-0.5 rounded-full">
          <div className="w-1 h-1 rounded-full bg-electric-blue animate-ping" />
          <span className="text-[8px] font-bold text-electric-blue uppercase tracking-widest">
            A.I. Active
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {allItems.slice(0, 4).map(item => (
          <div
            key={item.id}
            className={`flex items-start justify-between p-4 border rounded-sm transition-all hover:bg-white/[0.01] ${urgencyColor(
              item.urgency
            )}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={10} className="text-electric-blue" />
                <p className="text-xs font-black uppercase text-white tracking-tight truncate">
                  {item.title}
                </p>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                {item.description || item.summary}
              </p>
              {(item.action_route || item.recommended_action || item.action) && (
                <div className="text-[10px] text-gray-500 mt-2 p-1.5 bg-black/20 border-l border-white/10 italic">
                  💡 Recommendation: {item.recommended_action || item.action}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 ml-4 shrink-0 pt-0.5">
              {item.action_route && (
                <Link
                  href={item.action_route}
                  className="text-[10px] font-black uppercase tracking-wider text-electric-blue hover:text-cyan-300 transition-colors whitespace-nowrap bg-electric-blue/5 border border-electric-blue/10 px-2 py-1 rounded-sm"
                >
                  {item.action_label || 'View →'}
                </Link>
              )}
              {item._source === 'prediction' && (
                <button
                  onClick={() => dismissPrediction(item.id)}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/5"
                  title="Dismiss Forecast"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
