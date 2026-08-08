'use client'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  // Invoice statuses
  draft:    { label: 'Draft',    color: '#4B5563', bg: 'rgba(75,85,99,0.15)' },
  posted:   { label: 'Posted',   color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  paid:     { label: 'Paid',     color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  partial:  { label: 'Partial',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  overdue:  { label: 'Overdue',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  void:     { label: 'Void',     color: '#4B5563', bg: 'rgba(75,85,99,0.10)' },
  cancelled:{ label: 'Cancelled',color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  issued:   { label: 'Issued',   color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  // Attendance
  present:  { label: 'Present',  color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  absent:   { label: 'Absent',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  half:     { label: 'Half Day', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  half_day: { label: 'Half Day', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  // Stock
  in_stock: { label: 'In Stock', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  low:      { label: 'Low',      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  out:      { label: 'Out',      color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  active:   { label: 'Active',   color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  inactive: { label: 'Inactive', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  // Camera
  online:   { label: 'Online',   color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  offline:  { label: 'Offline',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  // Tier
  free:     { label: 'Free',     color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  lite:     { label: 'Lite',     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  pro:      { label: 'Pro',      color: '#C5A059', bg: 'rgba(197,160,89,0.12)' },
  elite:    { label: 'Elite',    color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
}

export function StatusChip({
  status,
  className = '',
}: {
  status: string
  className?: string
}) {
  const normalizedKey = (status || '').toLowerCase()
  const config = STATUS_CONFIG[normalizedKey] || {
    label: status || 'Unknown',
    color: '#9CA3AF',
    bg: 'rgba(156,163,175,0.12)',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${className}`}
      style={{
        color: config.color,
        backgroundColor: config.bg,
      }}
    >
      {config.label}
    </span>
  )
}

export default StatusChip
