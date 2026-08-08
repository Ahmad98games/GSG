'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import {
  AlertTriangle, Users2,
  Package, FileText,
  ArrowRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Action {
  id: string
  severity: 'critical' | 'warning' | 'info'
  icon: any
  title: string
  description: string
  href: string
  count?: number
}

export function ActionFeed() {
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const router = useRouter()
  const today = new Date()
    .toISOString().split('T')[0]

  const { data: actions = [] } = useQuery({
    queryKey: ['action-feed', profile?.id],
    queryFn: async () => {
      const results: Action[] = []

      // Unmarked attendance
      const [karigarRes, attRes] =
        await Promise.all([
        supabase.from('karigars')
          .select('id')
          .eq('business_id', profile!.id)
          .eq('status', 'active'),
        supabase.from('attendance_logs')
          .select('karigar_id')
          .eq('business_id', profile!.id)
          .eq('attendance_date', today),
      ])

      const unmarked =
        (karigarRes.data?.length || 0) -
        (attRes.data?.length || 0)

      if (unmarked > 0) {
        results.push({
          id: 'attendance',
          severity: unmarked > 5
            ? 'critical' : 'warning',
          icon: Users2,
          title: 'Attendance Pending',
          description:
            `${unmarked} karigars not marked today`,
          href: '/karigars',
          count: unmarked,
        })
      }

      // Low stock
      const { data: lowStock } = await supabase
        .from('skus')
        .select('id')
        .eq('business_id', profile!.id)
        .filter('qty_on_hand',
          'lte', 'reorder_level')
        .eq('is_active', true)

      if ((lowStock?.length || 0) > 0) {
        results.push({
          id: 'stock',
          severity: 'warning',
          icon: Package,
          title: 'Low Stock Alert',
          description:
            `${lowStock!.length} items below reorder level`,
          href: '/inventory',
          count: lowStock!.length,
        })
      }

      // Overdue invoices
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 86400000
      ).toISOString().split('T')[0]

      const { data: overdue } = await supabase
        .from('invoices')
        .select('id')
        .eq('business_id', profile!.id)
        .eq('status', 'posted')
        .gt('balance_due', 0)
        .lt('created_at', thirtyDaysAgo)

      if ((overdue?.length || 0) > 0) {
        results.push({
          id: 'overdue',
          severity: 'critical',
          icon: FileText,
          title: 'Overdue Invoices',
          description:
            `${overdue!.length} invoices unpaid > 30 days`,
          href: '/invoices?filter=overdue',
          count: overdue!.length,
        })
      }

      return results.sort((a, b) => {
        const order = {
          critical: 0, warning: 1, info: 2
        }
        return order[a.severity] -
          order[b.severity]
      })
    },
    enabled: !!profile?.id,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })

  if (actions.length === 0) return null

  const SEVERITY_STYLES = {
    critical: {
      border: 'border-red-500/25',
      bg: 'bg-red-500/5',
      dot: 'bg-red-500',
      badge: 'bg-red-500/15 text-red-400',
    },
    warning: {
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/5',
      dot: 'bg-amber-500',
      badge: 'bg-amber-500/15 text-amber-400',
    },
    info: {
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/5',
      dot: 'bg-blue-500',
      badge: 'bg-blue-500/15 text-blue-400',
    },
  }

  return (
    <div className="space-y-2">
      <p className="text-label text-gray-600 mb-3">
        Needs Attention
      </p>
      {actions.map(action => {
        const s = SEVERITY_STYLES[
          action.severity
        ]
        const Icon = action.icon
        return (
          <div
            key={action.id}
            onClick={() => router.push(action.href)}
            className={`
              flex items-center gap-3 p-3
              border rounded-sm cursor-pointer
              transition-all duration-150
              hover:brightness-110
              ${s.border} ${s.bg}
            `}
          >
            {/* Severity dot */}
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot} animate-pulse`} />

            {/* Content */}
            <Icon size={15} className="text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">
                {action.title}
              </p>
              <p className="text-[11px] text-gray-500">
                {action.description}
              </p>
            </div>

            {/* Count badge */}
            {action.count && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${s.badge}`}>
                {action.count}
              </span>
            )}

            <ArrowRight size={12} className="text-gray-700 flex-shrink-0" />
          </div>
        )
      })}
    </div>
  )
}
