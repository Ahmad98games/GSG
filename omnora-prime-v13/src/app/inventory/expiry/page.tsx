'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useIndustryConfig } from '@/hooks/useIndustryConfig'
import { AlertTriangle, Package, ChevronRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ExpiringSKU {
  id: string
  name: string
  sku_code: string
  batch_number: string | null
  expiry_date: string
  manufacture_date: string | null
  qty_on_hand: number
  unit: string
  category: string | null
}

function getUrgency(expiryDate: string) {
  const days = Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / 86_400_000
  )
  if (days < 0)   return { label: 'EXPIRED',  color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   days }
  if (days <= 7)  return { label: 'CRITICAL', color: '#EF4444', bg: 'rgba(239,68,68,0.06)',   days }
  if (days <= 30) return { label: 'WARNING',  color: '#F59E0B', bg: 'rgba(245,158,11,0.06)',  days }
  return           { label: 'WATCH',    color: '#60A5FA', bg: 'rgba(96,165,250,0.06)',  days }
}

export default function ExpiryAlertsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const { fmtDate } = useIndustryConfig()

  const { data: items = [], isLoading } = useQuery<ExpiringSKU[]>({
    queryKey: ['expiry-alerts', profile?.id],
    queryFn: async () => {
      const ninetyDaysFromNow = new Date()
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)

      const { data } = await supabase
        .from('skus')
        .select('id, name, sku_code, batch_number, expiry_date, manufacture_date, qty_on_hand, unit, category')
        .eq('business_id', profile!.id)
        .eq('is_active', true)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', ninetyDaysFromNow.toISOString().split('T')[0])
        .gt('qty_on_hand', 0)
        .order('expiry_date', { ascending: true })

      return (data as ExpiringSKU[]) || []
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
  })

  const expired  = items.filter(i => new Date(i.expiry_date) < new Date())
  const critical = items.filter(i => { const d = getUrgency(i.expiry_date).days; return d >= 0 && d <= 7 })
  const warning  = items.filter(i => { const d = getUrgency(i.expiry_date).days; return d > 7 && d <= 30 })
  const watch    = items.filter(i => getUrgency(i.expiry_date).days > 30)

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-mono">
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors mr-8 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Back</span>
        </button>
        <div className="h-4 w-px bg-white/10 mx-4" />
        <h1 className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-400">
          Expiry Alert Dashboard
        </h1>
        <p className="ml-4 text-[10px] text-gray-600">Items expiring within 90 days</p>
      </header>

      <div className="p-8 max-w-4xl mx-auto">
        {/* Summary counters */}
        {items.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Expired',  count: expired.length,  color: 'border-red-500/40 text-red-400',    bg: 'bg-red-500/5' },
              { label: 'Critical', count: critical.length, color: 'border-red-500/25 text-red-400',    bg: 'bg-red-500/4' },
              { label: 'Warning',  count: warning.length,  color: 'border-amber-500/30 text-amber-400', bg: 'bg-amber-500/5' },
              { label: 'Watch',    count: watch.length,    color: 'border-blue-500/20 text-blue-400',  bg: 'bg-blue-500/4' },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className={`p-5 ${bg} border ${color} rounded-sm text-center`}>
                <p className={`text-3xl font-mono font-black ${color.split(' ')[1]}`}>{count}</p>
                <p className="text-[9px] uppercase tracking-widest text-gray-600 mt-1 font-bold">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Item list */}
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-white/4 rounded-sm" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center bg-[#1A1D21] border border-white/5 rounded-sm">
            <Package size={40} className="text-emerald-500 mx-auto mb-4" />
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-2">
              All Clear ✓
            </p>
            <p className="text-[11px] text-gray-600">
              No items expiring within the next 90 days.
            </p>
            <Link
              href="/inventory"
              className="inline-flex items-center gap-2 mt-6 text-[10px] uppercase font-bold text-gray-500 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 transition-all"
            >
              Go to Inventory
              <ChevronRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const urgency = getUrgency(item.expiry_date)
              return (
                <Link key={item.id} href={`/inventory/${item.id}`} className="block group">
                  <div
                    className="flex items-center justify-between p-5 border rounded-sm hover:border-white/20 transition-all cursor-pointer"
                    style={{ backgroundColor: urgency.bg, borderColor: urgency.color + '30' }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 flex items-center justify-center rounded-sm flex-shrink-0"
                        style={{ backgroundColor: urgency.color + '15' }}
                      >
                        <AlertTriangle size={18} style={{ color: urgency.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{item.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                          {item.sku_code}
                          {item.batch_number && (
                            <> · <span className="text-gray-400">Batch: {item.batch_number}</span></>
                          )}
                          {item.category && (
                            <> · {item.category}</>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-0.5 font-bold">
                          Stock: {item.qty_on_hand} {item.unit}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className="inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-sm mb-1"
                        style={{ color: urgency.color, backgroundColor: urgency.color + '20' }}
                      >
                        {urgency.label}
                      </span>
                      <p className="text-xs text-gray-400 font-mono font-bold">
                        {urgency.days < 0
                          ? `Expired ${Math.abs(urgency.days)}d ago`
                          : urgency.days === 0
                          ? 'Expires TODAY'
                          : `${urgency.days} days left`}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        {fmtDate(item.expiry_date)}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Tip footer */}
        {items.length > 0 && (
          <div className="mt-6 p-4 bg-[#1A1D21] border border-white/5 rounded-sm">
            <p className="text-[10px] text-gray-600">
              <span className="font-bold text-gray-500">Tip:</span> Set the expiry date when adding or
              editing an SKU in the Inventory section. Expired stock should be quarantined and
              written off to keep your books accurate.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
