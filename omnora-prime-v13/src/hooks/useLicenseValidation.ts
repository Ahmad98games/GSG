import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

import { getApiUrl } from '@/lib/utils/apiUrl'

export function useLicenseValidation() {
  const router = useRouter()
  const pathname = usePathname()
  const [license, setLicense] = useState<any>(null)

  useEffect(() => {
    // List of public or onboarding routes where we bypass validation redirections
    const publicOrOnboardingRoutes = [
      '/',
      '/login',
      '/signup',
      '/license',
      '/setup',
      '/download',
      '/pricing',
      '/privacy',
      '/about',
      '/reviews',
      '/docs',
      '/blog',
      '/dashboard',
      '/admin'
    ]

    const isBypassRoute = publicOrOnboardingRoutes.some(
      r => pathname === r || pathname.startsWith(r + '/') || pathname.startsWith(r)
    )

    const validate = async () => {
      try {
        const stored = localStorage.getItem('noxis_license')
        if (!stored) {
          if (!isBypassRoute) {
            router.push('/license')
          }
          return
        }

        const parsed = JSON.parse(stored)
        setLicense(parsed)

        // Check if cache is stale (> 24 hours) and needs silent background verification
        if (!parsed.cacheExpires || Date.now() > parsed.cacheExpires) {
          const res = await fetch(getApiUrl('/api/license/activate'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              licenseKey: parsed.key,
              machineInfo: { revalidation: true },
              appVersion: '13.0.0',
            }),
          })

          if (res.ok) {
            const data = await res.json()
            if (data.success) {
              // Update cache with fresh validation details
              localStorage.setItem(
                'noxis_license',
                JSON.stringify({
                  ...data.license,
                  activatedAt: parsed.activatedAt,
                  cacheExpires: Date.now() + 24 * 60 * 60 * 1000,
                })
              )
              setLicense(data.license)
            }
          } else if (res.status === 403) {
            const data = await res.json()
            // Clear local license and redirect if deactivated or expired
            if (data.expired || data.error?.includes('deactivated')) {
              localStorage.setItem('noxis_license_error', data.error)
              localStorage.removeItem('noxis_license')
              if (!isBypassRoute) {
                router.push('/license?expired=true')
              }
            }
          }
        }

        // Sync tier to Electron for feature gating
        const win = window as any
        if (win.electronAPI?.syncTier && parsed.tier) {
          win.electronAPI.syncTier({
            tier: parsed.tier,
            expiresAt: parsed.expiresAt,
          })
        }

      } catch (err) {
        console.warn('[License] Background re-validation failed, using cache:', err)
      }
    }

    validate()
  }, [pathname, router])

  return { license }
}
