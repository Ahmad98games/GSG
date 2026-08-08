'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { FileText, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function RecentInvoices() {
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const router = useRouter()

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['recent-invoices-widget', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*, party:parties(name)')
        .eq('business_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(5)
      return data || []
    },
    enabled: !!profile?.id,
  })

  return (
    <div className="bg-[#0F1114] border border-white/6 rounded-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-[#60A5FA]" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Recent Invoices
          </p>
        </div>
        <button
          onClick={() => router.push('/invoices')}
          className="text-[10px] font-bold text-[#60A5FA] hover:underline flex items-center gap-1"
        >
          View All <ArrowRight size={10} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-white/5 animate-pulse rounded-sm" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <p className="text-xs text-gray-600 italic py-2">No recent invoices recorded.</p>
      ) : (
        <div className="space-y-1.5">
          {invoices.map((inv: any) => (
            <div
              key={inv.id}
              onClick={() => router.push(`/invoices/${inv.id}`)}
              className="flex items-center justify-between p-2 rounded bg-white/[0.015] hover:bg-white/[0.04] transition-colors cursor-pointer text-xs"
            >
              <div>
                <p className="font-semibold text-white">
                  {inv.party?.name || inv.customer_name || 'Walk-in Client'}
                </p>
                <p className="text-[10px] text-gray-500">
                  {inv.invoice_number} · {new Date(inv.created_at).toLocaleDateString('en-PK')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-white">
                  {(profile?.currency || 'PKR')} {(inv.total_amount || inv.subtotal || 0).toLocaleString('en-PK')}
                </p>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                  inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {inv.status || 'draft'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
