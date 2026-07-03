'use client'
import { memo } from 'react'
import { useIndustryConfig } from '@/hooks/useIndustryConfig'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

// ── TEXTILE / GARMENT specific widget ──
function TextileWidget() {
  const { t, fmt, features } = useIndustryConfig()
  const { profile } = useBusinessProfile()
  const supabase = createClient()

  const { data } = useQuery({
    queryKey: ['textile-dashboard', profile?.id],
    queryFn: async () => {
      const today = new Date()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

      const [production, peshgi] = await Promise.all([
        supabase
          .from('karigar_production_logs')
          .select('units_produced, earnings')
          .eq('business_id', profile?.id)
          .gte('log_date', monthStart),
        supabase
          .from('karigars')
          .select('peshgi_balance')
          .eq('business_id', profile?.id)
          .eq('status', 'active')
          .gt('peshgi_balance', 0),
      ])

      const totalUnits = (production.data || [])
        .reduce((s: number, r: any) => s + (r.units_produced || 0), 0)
      const totalEarnings = (production.data || [])
        .reduce((s: number, r: any) => s + (r.earnings || 0), 0)
      const totalPeshgi = (peshgi.data || [])
        .reduce((s: number, r: any) => s + (r.peshgi_balance || 0), 0)

      return { totalUnits, totalEarnings, totalPeshgi }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!profile?.id,
  })

  if (!data) return null

  return (
    <div className="p-5 bg-[#0F1114] border border-white/5 rounded-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
        {t.production} This Month
      </p>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xl font-mono font-bold text-white">
            {data.totalUnits.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            {t.productionUnit} produced
          </p>
        </div>
        <div>
          <p className="text-xl font-mono font-bold text-emerald-400">
            {fmt(data.totalEarnings)}
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            {t.worker} earnings
          </p>
        </div>
        {features.peshgiAdvances && (
          <div>
            <p className="text-xl font-mono font-bold text-amber-400">
              {fmt(data.totalPeshgi)}
            </p>
            <p className="text-[10px] text-gray-600 mt-1">
              {t.advance} outstanding
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── MEDICAL / PHARMACY specific widget ──
function MedicalWidget() {
  const { fmt } = useIndustryConfig()
  const { profile } = useBusinessProfile()
  const supabase = createClient()

  const { data } = useQuery({
    queryKey: ['medical-dashboard', profile?.id],
    queryFn: async () => {
      const thirtyDays = new Date()
      thirtyDays.setDate(thirtyDays.getDate() + 30)

      const { data: expiring } = await supabase
        .from('skus')
        .select('name, expiry_date, qty_on_hand')
        .eq('business_id', profile?.id)
        .eq('is_active', true)
        .lte('expiry_date', thirtyDays.toISOString().split('T')[0])
        .gt('qty_on_hand', 0)
        .order('expiry_date')
        .limit(5)

      return { expiring: expiring || [] }
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!profile?.id,
  })

  if (!data) return null

  return (
    <div className="p-5 bg-[#0F1114] border border-white/5 rounded-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
        Expiring Within 30 Days
      </p>
      {data.expiring.length === 0 ? (
        <p className="text-sm text-emerald-500">
          ✓ No medicines expiring soon
        </p>
      ) : (
        <div className="space-y-2">
          {data.expiring.map((item: any) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <span className="text-white truncate flex-1">
                {item.name}
              </span>
              <span className="text-red-400 font-mono ml-4 flex-shrink-0">
                {new Date(item.expiry_date).toLocaleDateString('en-PK')}
              </span>
              <span className="text-gray-500 ml-3 flex-shrink-0">
                {item.qty_on_hand} units
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-white/5">
            <a href="/inventory/expiry" className="text-[10px] text-red-400 hover:text-red-300">
              View all expiry alerts →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ── RICE MILL specific widget ──
function RiceWidget() {
  const { fmt } = useIndustryConfig()
  const { profile } = useBusinessProfile()
  const supabase = createClient()

  const { data } = useQuery({
    queryKey: ['rice-dashboard', profile?.id],
    queryFn: async () => {
      const today = new Date()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

      const { data: batches } = await supabase
        .from('production_batches')
        .select('input_qty, output_qty, status, created_at')
        .eq('business_id', profile?.id)
        .gte('created_at', monthStart)

      const completed = (batches || [])
        .filter((b: any) => b.status === 'completed')
      const totalInput = completed.reduce((s: number, b: any) => s + (b.input_qty || 0), 0)
      const totalOutput = completed.reduce((s: number, b: any) => s + (b.output_qty || 0), 0)
      const avgYield = totalInput > 0 ? (totalOutput / totalInput * 100) : 0

      return {
        batches: completed.length,
        avgYield,
        totalInput,
        totalOutput,
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!profile?.id,
  })

  if (!data) return null

  return (
    <div className="p-5 bg-[#0F1114] border border-white/5 rounded-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
        Milling Efficiency This Month
      </p>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xl font-mono font-bold text-white">
            {data.avgYield.toFixed(1)}%
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            Avg yield
          </p>
        </div>
        <div>
          <p className="text-xl font-mono font-bold text-amber-400">
            {data.totalInput.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            Paddy in (kg)
          </p>
        </div>
        <div>
          <p className="text-xl font-mono font-bold text-emerald-400">
            {data.totalOutput.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            Rice out (kg)
          </p>
        </div>
      </div>
    </div>
  )
}

// ── AUTO PARTS specific widget ──
function AutoWidget() {
  const { fmt } = useIndustryConfig()
  const { profile } = useBusinessProfile()
  const supabase = createClient()

  const { data } = useQuery({
    queryKey: ['auto-dashboard', profile?.id],
    queryFn: async () => {
      const { data: jobs } = await supabase
        .from('invoices')
        .select('status, total_amount')
        .eq('business_id', profile?.id)
        .in('status', ['draft', 'posted'])

      const open = (jobs || [])
        .filter((j: any) => j.status === 'draft').length
      const totalValue = (jobs || [])
        .filter((j: any) => j.status === 'posted')
        .reduce((s: number, j: any) => s + (j.total_amount || 0), 0)

      return { openJobs: open, totalValue }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!profile?.id,
  })

  if (!data) return null

  return (
    <div className="p-5 bg-[#0F1114] border border-white/5 rounded-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
        Workshop Status
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xl font-mono font-bold text-amber-400">
            {data.openJobs}
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            Open work orders
          </p>
        </div>
        <div>
          <p className="text-xl font-mono font-bold text-emerald-400">
            {fmt(data.totalValue)}
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            Revenue this month
          </p>
        </div>
      </div>
    </div>
  )
}

// ── MAIN EXPORT — picks the right widget ──
export const IndustryWidget = memo(
  function IndustryWidget() {
    const { industry } = useIndustryConfig()

    switch (industry.key) {
      case 'textile':
      case 'garment':
        return <TextileWidget />
      case 'medical':
        return <MedicalWidget />
      case 'rice':
        return <RiceWidget />
      case 'food':
        return <RiceWidget />
      case 'auto':
        return <AutoWidget />
      default:
        return null
    }
  }
)
