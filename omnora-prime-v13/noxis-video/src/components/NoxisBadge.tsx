export function NoxisBadge({
  label,
  color = '#60A5FA',
}: {
  label: string
  color?: string
}) {
  return (
    <span
      className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm inline-block"
      style={{
        color,
        background: color + '15',
        border: `1px solid ${color}25`,
      }}
    >
      {label}
    </span>
  )
}
