'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useGlobalKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if typing in an input
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) return

      // Ctrl/Cmd + key shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault()
            // Handled by GlobalSearch
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
          case 'p':
            e.preventDefault()
            router.push('/parties')
            break
        }
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
