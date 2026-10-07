import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'

export function SceneTransition({
  duration = 15,
}: {
  duration?: number
}) {
  const frame = useCurrentFrame()

  // Wipe from left edge to right
  const wipeWidth = interpolate(
    frame,
    [0, duration / 2],
    [0, 1920],
    { extrapolateRight: 'clamp' }
  )

  const fadeOut = interpolate(
    frame,
    [duration / 2, duration],
    [1, 0],
    { extrapolateRight: 'clamp' }
  )

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: wipeWidth,
          height: 1080,
          background:
            'linear-gradient(90deg, #060708 0%, #0F1F3D 50%, #060708 100%)',
          boxShadow: 'inset -40px 0 40px rgba(96,165,250,0.1)',
        }}
      />
    </AbsoluteFill>
  )
}
