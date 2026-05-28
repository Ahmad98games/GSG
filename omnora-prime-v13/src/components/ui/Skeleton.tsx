import { cn } from '@/lib/utils'

// Base animated shimmer
export function Skeleton({
  className,
}: { className?: string }) {
  return (
    <div className={cn(
      'animate-pulse rounded-sm',
      'bg-white/[0.06]',
      className
    )} />
  )
}

// KPI card skeleton (matches dashboard cards)
export function KpiCardSkeleton() {
  return (
    <div className="p-4 bg-[#0F1114] border border-white/[0.06] rounded-sm">
      <Skeleton className="h-2.5 w-24 mb-3" />
      <Skeleton className="h-7 w-32 mb-2" />
      <Skeleton className="h-2 w-20" />
    </div>
  )
}

// Table row skeleton
export function TableRowSkeleton({
  cols = 5
}: { cols?: number }) {
  const widths = [
    'w-20', 'w-32', 'w-24', 'w-16', 'w-12',
    'w-28', 'w-36', 'w-14'
  ]
  return (
    <tr className="border-b border-white/[0.04]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton
            className={cn('h-3', widths[i % widths.length])}
          />
        </td>
      ))}
    </tr>
  )
}

// Table skeleton (multiple rows)
export function TableSkeleton({
  rows = 8,
  cols = 5,
}: { rows?: number, cols?: number }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/[0.06]">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="py-3 px-4 text-left">
              <Skeleton className="h-2.5 w-16" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  )
}

// Card grid skeleton (inventory, parties)
export function CardGridSkeleton({
  count = 6
}: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}
          className="p-4 bg-[#0F1114] border border-white/[0.06] rounded-sm">
          <div className="flex items-start justify-between mb-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-3 w-28 mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-2 w-20 mb-1" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Form skeleton (settings, edit pages)
export function FormSkeleton({ fields = 4 }: {
  fields?: number
}) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-2.5 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

// Sidebar skeleton
export function SidebarItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <Skeleton className="h-4 w-4 rounded-sm" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}
