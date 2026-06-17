'use client'

import { useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { startPerfMonitor } from '@/lib/perf/monitor'

export default function ElectronMotionWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    setIsElectron(
      !!(window as Window & { electronAPI?: unknown }).electronAPI ||
      !!(window as Window & { electron?: unknown }).electron ||
      !!(window as Window & { electronWindow?: unknown }).electronWindow
    )
    startPerfMonitor()
  }, [])

  return (
    <MotionConfig
      transition={
        isElectron
          ? {
              duration: 0.05,
              type: 'tween',
            }
          : undefined
      }
      reducedMotion="user"
    >
      {children}
    </MotionConfig>
  )
}
