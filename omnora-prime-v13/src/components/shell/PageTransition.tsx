'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export function PageTransition({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (el) {
      el.style.opacity = '1'
      el.style.transform = 'none'
    }
  }, [pathname])

  return (
    <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}
