'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveLicenseToLocal } from './actions'
import { getApiUrl } from '@/lib/utils/apiUrl'

const EDGE_FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL +
  '/functions/v1/verify-license'

// Generate a device fingerprint
function getDeviceId(): string {
  let id = localStorage.getItem(
    'noxis_device_id'
  )
  if (!id) {
    id = 'hub-' +
      Math.random().toString(36).slice(2) +
      '-' +
      Date.now().toString(36)
    localStorage.setItem('noxis_device_id', id)
  }
  return id
}

export default function LicensePage() {
  const router = useRouter()
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if already licensed
    const stored = localStorage.getItem(
      'noxis_license'
    )
    if (stored) {
      try {
        const license = JSON.parse(stored)
        if (license.valid) {
          // Re-validate to check expiry
          validateStored(license, stored)
          return
        }
      } catch {}
    }
    setChecking(false)
  }, [])

  const validateStored = async (
    license: any,
    raw: string
  ) => {
    // If trial, check if expired
    if (license.is_trial && license.expires_at) {
      const expired = new Date(license.expires_at)
        < new Date()
      if (expired) {
        localStorage.removeItem('noxis_license')
        setError(
          'Your 3-day trial has expired. Contact +92  326 4742678 to purchase.'
        )
        setChecking(false)
        return
      }
    }
    // Set cookie for quick middleware check
    document.cookie = `noxis_license_active=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;
    // Still valid
    router.push('/dashboard')
  }

  const handleActivate = async () => {
    const trimmed = key.trim().toUpperCase()
    if (!trimmed) {
      setError('Enter your license key')
      return
    }

    // Basic format check: XXXX-XXXX-XXXX-XXXX
    const format = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
    if (!format.test(trimmed)) {
      setError(
        'Invalid format. Key should be like: TRIA-XXXX-XXXX-XXXX'
      )
      return
    }

    setLoading(true)
    setError('')

    // Collect machine info for device fingerprint
    const machineInfo = {
      platform: navigator.platform,
      language: navigator.language,
      cores: String(navigator.hardwareConcurrency || 'unknown'),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`,
    }

    // Retry up to 3 times on network failure
    let lastError: string | null = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(getApiUrl('/api/license/activate'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            licenseKey: trimmed,
            machineInfo,
            appVersion: '13.0.0',
          }),
          // Explicit timeout — don't let the user wait forever on a bad connection
          signal: AbortSignal.timeout(15000),
        })

        let data: any = {}
        try {
          data = await res.json()
        } catch {
          data = { error: 'Invalid server response' }
        }

        if (res.ok && data.success) {
          // Store license data locally
          localStorage.setItem(
            'noxis_license',
            JSON.stringify({
              ...data.license,
              activatedAt: Date.now(),
              activated_locally_at: new Date().toISOString(),
              cacheExpires: Date.now() + 24 * 60 * 60 * 1000,
            })
          )

          // Store legacy variables
          localStorage.setItem('noxis_tier', data.license.tier)
          localStorage.setItem('noxis_max_devices', String(data.license.maxDevices))

          // Set cookie for quick middleware check
          document.cookie = `noxis_license_active=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;

          // Save to local config SQLite DB via Server Action
          try {
            await saveLicenseToLocal(
              trimmed,
              data.license.tier,
              data.license.isTrialActive,
              data.license.expiresAt
            )
          } catch (dbErr) {
            console.error('Failed to save license to local DB:', dbErr)
          }

          // Redirect to setup page
          router.push('/setup')
          return
        }

        // These errors are NOT network errors — show them clearly without "check internet"
        if (res.status === 404) {
          setError(
            '❌ License key not found. ' +
            'Check the key exactly as provided — ' +
            'it is case-sensitive and includes dashes.'
          )
          setLoading(false)
          return
        }

        if (res.status === 403) {
          setError(
            data.error ||
            '⛔ This license cannot be activated. ' +
            'WhatsApp: +92 333 435 5475'
          )
          setLoading(false)
          return
        }

        if (res.status === 500) {
          setError(`Server error (attempt ${attempt}/3). Retrying...`)
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 2000))
            continue
          }
          setError(
            'Activation server is unavailable. ' +
            'Please try again later or contact ' +
            'support: WhatsApp +92 333 435 5475'
          )
          setLoading(false)
          return
        }

      } catch (networkErr: any) {
        const isTimeout =
          networkErr.name === 'TimeoutError' ||
          networkErr.name === 'AbortError'

        if (isTimeout) {
          lastError =
            `Request timed out (attempt ${attempt}/3).` +
            (attempt < 3 ? ' Retrying...' : ' ' +
            'Make sure Noxis Hub is fully loaded ' +
            'before entering your license key.')
        } else {
          lastError =
            `Connection failed (attempt ${attempt}/3).` +
            (attempt < 3 ? ' Retrying...' : ' ' +
            'The local server may still be starting. ' +
            'Wait 10 seconds and try again.')
        }

        setError(lastError)

        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 3000))
        }
      }
    }

    // All retries exhausted — fallback to offline grace period if a valid local license was active
    const stored = localStorage.getItem('noxis_license')
    if (stored) {
      try {
        const license = JSON.parse(stored)
        const lastValidated = new Date(license.activated_locally_at || 0)
        const hoursAgo = (Date.now() - lastValidated.getTime()) / (1000 * 60 * 60)

        if (hoursAgo < 72) {
          // Set cookie for quick middleware check
          document.cookie = `noxis_license_active=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;
          router.push('/dashboard')
          return
        }
      } catch {}
    }

    setError(lastError || 'Activation failed after 3 attempts. Try again.')
    setLoading(false)
  }

  if (checking) return (
    <div className="min-h-screen bg-[#070809]
      flex items-center justify-center">
      <div className="w-8 h-8 border-2
        border-blue-500/20 border-t-blue-500
        rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#070809]
      flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <img src="/logos/noxis.png"
            alt="Noxis"
            className="w-12 h-12 mx-auto mb-4
              object-contain"
            onError={e => {
              (e.target as HTMLImageElement)
                .style.display = 'none'
            }}
          />
          <h1 className="text-2xl font-bold
            text-white tracking-tight">
            Activate Noxis Hub
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter your license key to continue
          </p>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="text-[10px]
            font-semibold uppercase tracking-widest
            text-gray-500 block mb-2">
            License key
          </label>
          <input
            type="text"
            value={key}
            onChange={e => {
              setError('')
              // Auto-format as user types:
              // XXXX-XXXX-XXXX-XXXX
              const val = e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9-]/g, '')
                .slice(0, 19)
              setKey(val)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter')
                handleActivate()
            }}
            placeholder="TRIA-XXXX-XXXX-XXXX"
            className="w-full bg-[#161A1F]
              border border-white/10 text-white
              text-sm font-mono px-4 py-3.5
              outline-none tracking-widest
              focus:border-[#60A5FA]/40
              placeholder:text-gray-700
              placeholder:tracking-normal"
            autoFocus
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3
            bg-red-500/5 border border-red-500/20
            text-xs text-red-400 leading-relaxed">
            {error}
          </div>
        )}

        {/* Activate button */}
        <button
          onClick={handleActivate}
          disabled={loading || !key.trim()}
          className="w-full py-3.5 text-sm
            font-bold bg-[#60A5FA] text-black
            hover:bg-blue-400
            disabled:opacity-50
            disabled:cursor-not-allowed
            transition-colors"
        >
          {loading
            ? 'Activating...'
            : 'Activate Noxis'}
        </button>

        {/* Help */}
        <div className="mt-6 space-y-3">
          <p className="text-xs text-gray-600
            text-center">
            No key?{' '}
            <a
              href="https://wa.me/923264742678?text=I want to buy Noxis Hub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#60A5FA]
                hover:text-blue-300
                transition-colors"
            >
              Purchase on WhatsApp →
            </a>
          </p>
          <p className="text-xs text-gray-700
            text-center">
            Trial keys available at noxishub.app
          </p>
        </div>

        {/* Tier info */}
        <div className="mt-8 p-4 bg-[#0F1114]
          border border-white/6 rounded-sm">
          <p className="text-[9px] font-semibold
            uppercase tracking-widest text-gray-600
            mb-3">
            License tiers
          </p>
          {[
            {
              prefix: 'TRIA',
              name: 'Free Trial',
              desc: '3 days, all Elite features'
            },
            {
              prefix: 'LITE',
              name: 'Lite — PKR 2,500/mo',
              desc: '5 devices, 2 cameras'
            },
            {
              prefix: 'PROP',
              name: 'Pro — PKR 6,500/mo',
              desc: '15 devices, AI detection'
            },
            {
              prefix: 'ELIT',
              name: 'Elite — PKR 14,000/mo',
              desc: '50 devices, full features'
            },
          ].map(t => (
            <div key={t.prefix}
              className="flex items-center
              justify-between py-1.5 border-b
              border-white/4 last:border-0">
              <div>
                <p className="text-[10px]
                  font-medium text-white">
                  {t.name}
                </p>
                <p className="text-[9px]
                  text-gray-600">
                  {t.desc}
                </p>
              </div>
              <span className="text-[9px]
                font-mono text-gray-600">
                {t.prefix}-...
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
