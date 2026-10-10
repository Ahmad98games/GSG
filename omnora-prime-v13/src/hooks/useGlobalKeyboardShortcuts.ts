'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function useGlobalKeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/lock' || pathname?.startsWith('/lock')) return

    const handler = (e: KeyboardEvent) => {
      // Skip if typing in an input
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) return

      // ── DISPLAY ZOOM RESET & SCALE CONTROLS ──
      // Ctrl + 0 (Digit0 or Numpad0): Restores 100% normal scale immediately
      if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')) {
        e.preventDefault()
        if (typeof window !== 'undefined') {
          if ((window as any).electronAPI?.resetZoom) {
            (window as any).electronAPI.resetZoom()
          }
          document.documentElement.style.zoom = '100%'
          document.body.style.zoom = '100%'
          window.dispatchEvent(new CustomEvent('noxis:zoom-reset'))
        }
        return
      }

      // Ctrl + Shift + shortcuts
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'p':
            e.preventDefault()
            router.push('/parties')
            return
          case 'k':
            e.preventDefault()
            router.push('/karigars')
            return
          case 'r':
            e.preventDefault()
            router.push('/reports')
            return
          case 'c':
            e.preventDefault()
            router.push('/cctv')
            return
          case 'e':
            e.preventDefault()
            router.push('/settings/exchange-rates')
            return
          case 'm':
            e.preventDefault()
            router.push('/settings/import')
            return
        }
      }

      // Ctrl/Cmd + key shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault()
            // Handled by GlobalSearch
            break
          case 'p':
            e.preventDefault()
            router.push('/pos')
            break
          case 'n':
            e.preventDefault()
            router.push('/invoices/new')
            break
          case 'd':
            e.preventDefault()
            router.push('/dashboard')
            break
          case 'i':
            e.preventDefault()
            router.push('/inventory')
            break
          case '/':
            e.preventDefault()
            window.dispatchEvent(new CustomEvent('open-shortcut-help'))
            break
        }
        return
      }

      // Function keys
      if (e.key === 'F1') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('open-shortcut-help'))
        return
      }
      if (e.key === 'F2') {
        e.preventDefault()
        router.push('/pos')
        return
      }

      // Alt shortcuts for navigation
      if (e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault()
            router.push('/dashboard')
            break
          case '2':
            e.preventDefault()
            router.push('/invoices')
            break
          case '3':
            e.preventDefault()
            router.push('/karigars')
            break
          case '4':
            e.preventDefault()
            router.push('/inventory')
            break
          case '5':
            e.preventDefault()
            router.push('/reports')
            break
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])
}
