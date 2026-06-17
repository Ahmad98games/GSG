let frameDrops = 0
let lastFrame = performance.now()

export function startPerfMonitor() {
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV !== 'production') return

  const checkFrame = () => {
    const now = performance.now()
    const delta = now - lastFrame
    lastFrame = now

    if (delta > 100) {
      frameDrops++
      if (frameDrops % 5 === 0) {
        console.warn(
          `[Perf] ${frameDrops} frame drops detected. Last: ${delta.toFixed(0)}ms`
        )
      }
    }

    requestAnimationFrame(checkFrame)
  }

  requestAnimationFrame(checkFrame)
}
