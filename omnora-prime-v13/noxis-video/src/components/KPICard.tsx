import {
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion'

export function KPICard({
  label,
  value,
  sub,
  color,
  icon,
  delay = 0,
}: {
  label: string
  value: string
  sub?: string
  color: string
  icon: string
  delay?: number
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 14,
      stiffness: 200,
      mass: 0.6,
    },
  })

  const opacity = interpolate(
    frame - delay,
    [0, 8],
    [0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  )

  return (
    <div
      className="bg-[#0F1114] border border-white/7 rounded-sm p-4 relative overflow-hidden"
      style={{
        transform: `scale(${Math.max(0, scale)})`,
        opacity,
        borderLeft: `3px solid ${color}`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.35)`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">
          {icon}
        </span>
        <span
          className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
          style={{
            color,
            background: color + '15',
          }}
        >
          Today
        </span>
      </div>
      <p
        className="text-2xl font-black font-mono tracking-tight"
        style={{ color }}
      >
        {value}
      </p>
      <p className="text-[11px] text-gray-400 mt-1 font-medium">
        {label}
      </p>
      {sub && (
        <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
          {sub}
        </p>
      )}
    </div>
  )
}
