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
  const prevPathRef = useRef(pathname)

  useEffect(() => {
    if (prevPathRef.current === pathname) return
    prevPathRef.current = pathname

    const el = containerRef.current
    if (!el) return

    // Quick fade-in on navigation
    el.style.opacity = '0'
    el.style.transform = 'translateY(4px)'

    requestAnimationFrame(() => {
      el.style.transition = 'opacity 150ms ease, transform 150ms ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'

      setTimeout(() => {
        if (el) el.style.transition = ''
      }, 200)
    })
  }, [pathname])

  return (
    <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}
