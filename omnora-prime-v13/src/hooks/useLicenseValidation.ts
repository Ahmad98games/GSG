import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface CachedLicense {
  id: string
  key: string
  tier: string
  customerName: string
  expiresAt: string | null
  maxDevices: number
  activatedAt: number
  cacheExpires: number
  isValid: boolean
}

export function useLicenseValidation() {
  const router = useRouter()
  const pathname = usePathname()
  const [license, setLicense] = useState<CachedLicense | null>(null)
  const [loading, setLoading] = useState(true)
  const validatedRef = useRef(false)

  useEffect(() => {
    if (!pathname) return

    const normalizedPath = pathname.toLowerCase()
    const isPublicPath = 
      normalizedPath === "/" || 
      normalizedPath === "/index.html" || 
      normalizedPath.startsWith("/login") || 
      normalizedPath.startsWith("/signup") || 
      normalizedPath.startsWith("/license") || 
      normalizedPath.startsWith("/setup") ||
      normalizedPath.startsWith("/download") ||
      normalizedPath.startsWith("/pricing") ||
      normalizedPath.startsWith("/privacy") ||
      normalizedPath.startsWith("/terms") ||
      normalizedPath.startsWith("/refund") ||
      normalizedPath.startsWith("/file-morph") ||
      normalizedPath.startsWith("/about") ||
      normalizedPath.startsWith("/reviews") ||
      normalizedPath.startsWith("/docs") ||
      normalizedPath.startsWith("/blog") ||
      normalizedPath.startsWith("/admin") ||
      normalizedPath === "/dashboard/login"

    if (isPublicPath) {
      setLoading(false)
      return
    }

    // STEP 1: Read cache immediately — never wait for network
    const initLicense = () => {
      try {
        const raw = localStorage.getItem('noxis_license')

        if (!raw) {
          // No license at all — redirect
          // This is the ONLY case where we block the user immediately
          setLoading(false)
          router.replace('/license')
          return
        }

        const cached: CachedLicense = JSON.parse(raw)

        // Use cached data instantly — don't wait for network
        setLicense(cached)
        setLoading(false)

        // STEP 2: Validate in background ONLY if cache is stale (> 24hrs)
        // and we haven't validated yet this session
        const isStale = Date.now() > cached.cacheExpires

        if (isStale && !validatedRef.current) {
          // 5 second delay — app is fully usable before we even try the network
          setTimeout(() => {
            silentRevalidate(cached.key)
          }, 5000)
        }

      } catch {
        // Corrupted cache — clear and redirect to license page
        localStorage.removeItem('noxis_license')
        setLoading(false)
        router.replace('/license')
      }
    }

    initLicense()
  }, [pathname, router])

  const silentRevalidate = async (key: string) => {
    if (validatedRef.current) return
    validatedRef.current = true

    try {
      const controller = new AbortController()
      // 10 second timeout — if internet is slow, don't block anything
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      // Generate a secure client-side nonce (32 hex characters)
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      const nonce = Array.from(array, dec => dec.toString(16).padStart(2, '0')).join('');

      const res = await fetch(
        `${window.location.origin}/api/license/activate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            licenseKey: key,
            machineInfo: {
              revalidation: true,
              platform: navigator.platform,
            },
            appVersion: '13.0.0',
            nonce,
          }),
          signal: controller.signal,
        }
      )
      clearTimeout(timeoutId)

      if (!res.ok) {
        // 403 = deactivated/expired
        // 404 = key deleted from admin
        // These are the ONLY cases where we force-logout the user offline
        if (res.status === 403 || res.status === 404) {
          const data = await res.json()
          // Store the error for the license page to show
          localStorage.setItem(
            'noxis_license_error',
            data.error || 'License expired'
          )
          localStorage.removeItem('noxis_license')
          // Give the user 10 seconds to save their work before redirect
          setTimeout(() => {
            router.replace('/license?expired=true')
          }, 10000)
        }
        // 5xx or network errors: silently continue with cached license
        return
      }

      const data = await res.json()
      if (data.success) {
        // Update cache with fresh data
        const existing = JSON.parse(
          localStorage.getItem('noxis_license')!
        )
        localStorage.setItem(
          'noxis_license',
          JSON.stringify({
            ...existing,
            ...data.license,
            activatedAt: existing.activatedAt,
            cacheExpires: Date.now() + 24 * 60 * 60 * 1000,
          })
        )
        setLicense(prev =>
          prev ? { ...prev, ...data.license } : prev
        )
      }
    } catch (err: any) {
      // Network error, timeout, DNS failure — ALL silently ignored
      // User keeps working with cached license
      console.warn(
        '[License] Background revalidation failed:',
        err.message
      )
    }
  }

  return { license, loading }
}
