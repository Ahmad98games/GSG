
export function InteractiveCursor({
  x,
  y,
  isClicking = false,
  label,
  visible = true,
}: {
  x: number
  y: number
  isClicking?: boolean
  label?: string
  visible?: boolean
}) {
  if (!visible) return null

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all select-none"
      style={{
        left: x,
        top: y,
        transform: `translate(-2px, -2px) scale(${isClicking ? 0.85 : 1})`,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
      }}
    >
      {/* SVG Modern Precision Cursor Arrow */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-white"
      >
        <path
          d="M3 3L10.07 20.97L13.58 13.58L20.97 10.07L3 3Z"
          fill="#06B6D4"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Click ripple animation */}
      {isClicking && (
        <div
          className="absolute -top-3 -left-3 w-8 h-8 rounded-full border-2 border-cyan-400 animate-ping pointer-events-none"
          style={{ opacity: 0.75 }}
        />
      )}

      {/* Optional action tag pill attached to cursor */}
      {label && (
        <div className="absolute top-5 left-4 px-2 py-0.5 rounded bg-black/80 border border-cyan-400/40 text-[9px] font-mono font-bold text-cyan-300 whitespace-nowrap shadow-md">
          {label}
        </div>
      )}
    </div>
  )
}
