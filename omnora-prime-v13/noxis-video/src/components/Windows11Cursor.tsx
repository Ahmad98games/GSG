import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

export type CursorType = 'arrow' | 'pointer' | 'text'

export interface CursorWaypoint {
  frame: number
  x: number
  y: number
  type?: CursorType
  click?: boolean
  label?: string
  tooltipPlacement?: 'below' | 'above' | 'below-button' | 'above-button'
}

export function Windows11Cursor({
  waypoints,
}: {
  waypoints: CursorWaypoint[]
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  if (waypoints.length === 0) return null

  // Find current segment between waypoints
  let startWp = waypoints[0]
  let endWp = waypoints[0]

  if (frame <= waypoints[0].frame) {
    startWp = waypoints[0]
    endWp = waypoints[0]
  } else if (frame >= waypoints[waypoints.length - 1].frame) {
    startWp = waypoints[waypoints.length - 1]
    endWp = waypoints[waypoints.length - 1]
  } else {
    for (let i = 0; i < waypoints.length - 1; i++) {
      if (frame >= waypoints[i].frame && frame < waypoints[i + 1].frame) {
        startWp = waypoints[i]
        endWp = waypoints[i + 1]
        break
      }
    }
  }

  // Smooth realistic spring transition with damping: 18, stiffness: 90
  const segmentElapsed = Math.max(0, frame - startWp.frame)
  const springProgress = spring({
    frame: segmentElapsed,
    fps,
    config: { damping: 18, stiffness: 90 },
  })

  // Ensure full clamp at end of segment
  const progress = Math.min(1, Math.max(0, springProgress))

  // Arc curvature between distant waypoints
  const linearX = startWp.x + (endWp.x - startWp.x) * progress
  const linearY = startWp.y + (endWp.y - startWp.y) * progress
  const distance = Math.hypot(endWp.x - startWp.x, endWp.y - startWp.y)
  const arcHeight = Math.min(16, distance * 0.035)
  const arcOffset = Math.sin(Math.min(1, progress) * Math.PI) * arcHeight

  const currentX = frame >= endWp.frame ? endWp.x : linearX
  const currentY = frame >= endWp.frame ? endWp.y : linearY - arcOffset

  // Cursor type transition: switches to target type as it arrives over interactive target
  const startType: CursorType = startWp.type || 'arrow'
  const endType: CursorType = endWp.type || 'arrow'
  const cursorType: CursorType = progress >= 0.65 ? endType : startType

  // Determine if a click is occurring right now
  let isClicking = false
  let clickAge = 999

  for (const wp of waypoints) {
    if (wp.click) {
      const diff = frame - wp.frame
      if (diff >= 0 && diff <= 14) {
        if (diff < clickAge) {
          clickAge = diff
          isClicking = diff <= 4
        }
      }
    }
  }

  // Click feedback ripple expanding directly from the exact hotspot (currentX, currentY)
  const clickRingScale = interpolate(clickAge, [0, 14], [0.2, 2.5], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })
  const clickRingOpacity = interpolate(clickAge, [0, 14], [0.9, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })

  // Tooltip label only visible when stationary or arrived over target
  const activeWp = progress >= 0.65 ? endWp : startWp
  const currentLabel = activeWp.label || undefined
  const isMovingFast = distance > 90 && progress > 0.15 && progress < 0.85
  const showLabel = !isMovingFast && Boolean(currentLabel)
  const tooltipPlacement = activeWp.tooltipPlacement || 'below'

  return (
    <>
      {/* ── Windows 11 Click Ripple (Strictly anchored at target x, y) ── */}
      {clickAge <= 14 && (
        <div
          className="absolute pointer-events-none z-40 rounded-full"
          style={{
            left: currentX,
            top: currentY,
            width: 28,
            height: 28,
            transform: `translate(-50%, -50%) scale(${clickRingScale})`,
            opacity: clickRingOpacity,
            border: '2px solid rgba(6, 182, 212, 0.95)',
            background: 'radial-gradient(circle, rgba(6,182,212,0.45) 0%, transparent 70%)',
          }}
        />
      )}

      {/* ── Cursor Layer (Hotspot tip strictly aligned at 0, 0) ── */}
      <div
        className="absolute pointer-events-none z-50 select-none"
        style={{
          left: currentX,
          top: currentY,
          transform: `scale(${isClicking ? 0.92 : 1})`,
          filter: 'drop-shadow(0 2.5px 5px rgba(0,0,0,0.55))',
          pointerEvents: 'none',
        }}
      >
        {/* Windows 11 Arrow (Tip at 0,0) */}
        {cursorType === 'arrow' && (
          <svg
            width="20"
            height="24"
            viewBox="0 0 17 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', transform: 'translate(0px, 0px)' }}
          >
            <path
              d="M0 0L6 20L9.8 12.2L16.5 10.8L0 0Z"
              fill="#FFFFFF"
              stroke="#181C24"
              strokeWidth="1.35"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Windows 11 Pointer Hand (Fingertip tip at 0,0) */}
        {cursorType === 'pointer' && (
          <svg
            width="22"
            height="26"
            viewBox="0 0 18 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', transform: 'translate(-7.5px, 0px)' }}
          >
            <path
              d="M6 1.5C6 0.67 6.67 0 7.5 0C8.33 0 9 0.67 9 1.5V9.5H10C10.83 9.5 11.5 10.17 11.5 11V12H12.5C13.33 12 14 12.67 14 13.5V14.5C14.83 14.5 15.5 15.17 15.5 16V17.5C15.5 20.5 13 23 10 23H7C4 23 2 20.5 2 17.5V13.5C2 12.67 2.67 12 3.5 12H4.5V4C4.5 3.17 5.17 2.5 6 2.5V1.5Z"
              fill="#FFFFFF"
              stroke="#181C24"
              strokeWidth="1.35"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Windows 11 Text I-Beam (Center at 0,0) */}
        {cursorType === 'text' && (
          <svg
            width="12"
            height="22"
            viewBox="0 0 12 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', transform: 'translate(-6px, -11px)' }}
          >
            <path
              d="M2 1H10M6 1V21M2 21H10"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* ── Anchored Action Tooltip (Directly adjacent to target element, NEVER in void) ── */}
      {showLabel && (
        <div
          className="absolute pointer-events-none z-50 select-none px-2.5 py-1 rounded bg-[#0A0E17]/95 border border-cyan-500/40 text-[10px] font-mono font-semibold text-cyan-200 whitespace-nowrap shadow-xl backdrop-blur-md"
          style={{
            left: currentX,
            ...(tooltipPlacement === 'below-button'
              ? { top: currentY + 12, transform: 'translateX(-50%)' }
              : tooltipPlacement === 'above-button'
              ? { bottom: 1080 - currentY + 16, transform: 'translateX(-50%)' }
              : tooltipPlacement === 'above'
              ? { bottom: 1080 - currentY + 14, transform: 'translateX(-50%)' }
              : { top: currentY + 24, transform: 'translateX(-30%)' }),
            pointerEvents: 'none',
          }}
        >
          {currentLabel}
        </div>
      )}
    </>
  )
}


