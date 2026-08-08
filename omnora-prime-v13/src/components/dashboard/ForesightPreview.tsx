'use client'
import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ForesightPreview() {
  const router = useRouter()

  return (
    <div className="bg-[#0F1114] border border-white/6 rounded-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#C5A059]" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Foresight Engine
          </p>
        </div>
        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
          A.I. Forecast
        </span>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        Cash flow projection for next 14 days shows optimal liquidity. Peak payroll demand expected on Friday.
      </p>

      <button
        onClick={() => router.push('/intelligence')}
        className="w-full text-center py-2 px-3 bg-white/5 hover:bg-white/10 text-xs font-bold text-white rounded-sm transition-colors flex items-center justify-center gap-1.5"
      >
        <span>Open Foresight Dashboard</span>
        <ArrowRight size={12} />
      </button>
    </div>
  )
}
