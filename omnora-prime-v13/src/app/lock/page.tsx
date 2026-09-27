'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react'

// SHA-256 hash using Web Crypto API
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'noxis-salt-2026')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function LockPage() {
  const router = useRouter()
  const supabase = createClient()

  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [mode, setMode] = useState<'pin' | 'forgot'>('pin')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotPassword, setForgotPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [businessName, setBusinessName] = useState('Noxis Hub')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  // Initialize Lock and load custom brand & persistent lockout state
  useEffect(() => {
    // 1. Establish impenetrable lock wall in session AND persistent storage
    sessionStorage.setItem('noxis_locked', 'true')
    localStorage.setItem('noxis_locked', 'true')

    const api = (window as any).electronAPI
    if (api?.store?.setLocked) {
      api.store.setLocked(true)
    }

    // 2. Restore persistent lock attempts and lockout timer across software restarts
    const restoreLockState = async () => {
      let currentAttempts = 0
      let until = 0

      if (api?.store?.getLockState) {
        try {
          const state = await api.store.getLockState()
          if (state) {
            currentAttempts = state.attempts || 0
            until = state.lockedUntil || 0
          }
        } catch {}
      } else {
        const storedAttempts = localStorage.getItem('noxis_lock_attempts')
        const storedUntil = localStorage.getItem('noxis_locked_until')
        currentAttempts = storedAttempts ? parseInt(storedAttempts, 10) : 0
        until = storedUntil ? parseInt(storedUntil, 10) : 0
      }

      const now = Date.now()
      if (until > now) {
        setLockedUntil(until)
        setAttempts(currentAttempts)
        const rem = Math.ceil((until - now) / 1000)
        setCountdown(rem)
        setError(`System locked due to failed attempts. Try again in ${rem}s.`)
      } else if (currentAttempts > 0) {
        setAttempts(currentAttempts)
        setError(`Security Notice: ${5 - currentAttempts} attempts remaining.`)
      }
    }

    restoreLockState()

    // 3. Load immediate cached organization identity
    const cachedLogo = localStorage.getItem('noxis_logo')
    if (cachedLogo) setLogoUrl(cachedLogo)

    if (api?.store?.getSession) {
      api.store.getSession().then((s: any) => {
        if (s?.email) {
          setForgotEmail(s.email)
        }
      })
    }

    // 4. Fetch latest business profile from API
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data?.config?.company_name) setBusinessName(data.config.company_name)
        if (data?.config?.logo_url) {
          setLogoUrl(data.config.logo_url)
          try { localStorage.setItem('noxis_logo', data.config.logo_url) } catch {}
        }
      })
      .catch(() => {})
  }, [])

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockedUntil) return
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockedUntil(null)
        setCountdown(0)
        setAttempts(0)
        clearInterval(interval)

        const api = (window as any).electronAPI
        if (api?.store?.clearLockAttempts) {
          api.store.clearLockAttempts()
        }
        localStorage.removeItem('noxis_lock_attempts')
        localStorage.removeItem('noxis_locked_until')
        setError('')
      } else {
        setCountdown(remaining)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [lockedUntil])

  const verifyPin = useCallback(
    async (enteredPin: string) => {
      const api = (window as any).electronAPI
      const storedHash = await api?.store.getPinHash()

      if (!storedHash) {
        sessionStorage.removeItem('noxis_locked')
        localStorage.removeItem('noxis_locked')
        localStorage.removeItem('noxis_lock_attempts')
        localStorage.removeItem('noxis_locked_until')
        sessionStorage.setItem('last_active', String(Date.now()))
        if (api?.store?.setLocked) {
          await api.store.setLocked(false)
        }
        router.replace('/dashboard')
        return
      }

      const enteredHash = await hashPin(enteredPin)

      if (enteredHash === storedHash) {
        setPin('')
        setError('')
        setAttempts(0)
        setLockedUntil(null)
        setCountdown(0)

        // Clear all lock states across sessions and storage
        sessionStorage.removeItem('noxis_locked')
        localStorage.removeItem('noxis_locked')
        localStorage.removeItem('noxis_lock_attempts')
        localStorage.removeItem('noxis_locked_until')
        sessionStorage.setItem('last_active', String(Date.now()))

        if (api?.store?.clearLockAttempts) {
          await api.store.clearLockAttempts()
        }
        if (api?.store?.setLocked) {
          await api.store.setLocked(false)
        }

        const lastRoute = await api?.store.getLastRoute()
        const target = (lastRoute && lastRoute !== '/lock') ? lastRoute : '/dashboard'
        router.replace(target)
      } else {
        let newAttempts = attempts + 1
        let unlockAt: number | null = null

        if (api?.store?.recordFailedAttempt) {
          const res = await api.store.recordFailedAttempt()
          newAttempts = res.attempts
          if (res.lockedUntil > Date.now()) {
            unlockAt = res.lockedUntil
          }
        } else {
          if (newAttempts >= 5) {
            unlockAt = Date.now() + 60000
            localStorage.setItem('noxis_locked_until', String(unlockAt))
          }
          localStorage.setItem('noxis_lock_attempts', String(newAttempts))
        }

        setAttempts(newAttempts)
        setPin('')

        if (unlockAt) {
          setLockedUntil(unlockAt)
          const rem = Math.ceil((unlockAt - Date.now()) / 1000)
          setCountdown(rem)
          setError(`Too many attempts. System locked for ${rem}s.`)
        } else {
          setError(`Wrong PIN. ${5 - newAttempts} attempts left.`)
        }
      }
    },
    [attempts, router]
  )

  // Handle PIN digit press
  const pressDigit = useCallback(
    async (digit: string) => {
      if (lockedUntil) return
      if (pin.length >= 4) return

      const newPin = pin + digit

      if (newPin.length === 4) {
        setPin(newPin)
        await verifyPin(newPin)
      } else {
        setPin(newPin)
        setError('')
      }
    },
    [pin, lockedUntil, verifyPin]
  )

  const deleteDigit = useCallback(() => {
    setPin(p => p.slice(0, -1))
    setError('')
  }, [])

  // Keyboard trap: Direct physical number keys typing & prevent navigation/escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'forgot') return

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        pressDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        deleteDigit()
      } else if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'Alt') {
        e.preventDefault()
      }
    }

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('contextmenu', preventContextMenu)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('contextmenu', preventContextMenu)
    }
  }, [mode, pressDigit, deleteDigit])

  // Forgot PIN — verify with email/password
  const handleForgotSubmit = useCallback(async () => {
    setForgotLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: forgotEmail,
      password: forgotPassword,
    })

    if (error || !data.user) {
      setError('Incorrect email or password.')
      setForgotLoading(false)
      return
    }

    // Valid credentials — disable old PIN and wipe lock state
    await (window as any).electronAPI?.store.disableAppLock()
    if ((window as any).electronAPI?.store?.clearLockAttempts) {
      await (window as any).electronAPI.store.clearLockAttempts()
    }
    if ((window as any).electronAPI?.store?.setLocked) {
      await (window as any).electronAPI.store.setLocked(false)
    }

    sessionStorage.removeItem('noxis_locked')
    localStorage.removeItem('noxis_locked')
    localStorage.removeItem('noxis_lock_attempts')
    localStorage.removeItem('noxis_locked_until')
    sessionStorage.setItem('last_active', String(Date.now()))

    // Redirect to settings to set new PIN
    router.replace('/settings/security?resetPin=true')
    setForgotLoading(false)
  }, [forgotEmail, forgotPassword, supabase, router])

  const PIN_DOTS = Array.from({ length: 4 }, (_, i) => i < pin.length)

  const NUMPAD = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '←'],
  ]

  if (mode === 'forgot') {
    return (
      <div className="fixed inset-0 bg-[#060708] flex items-center justify-center p-6 z-[99999] select-none">
        <div className="w-full max-w-sm">
          <button
            onClick={() => {
              setMode('pin')
              setError('')
            }}
            className="text-gray-500 text-sm mb-8 hover:text-gray-300 transition-colors"
          >
            ← Back to PIN
          </button>

          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center mx-auto mb-3">
              <Lock size={22} className="text-[#60A5FA]" />
            </div>
            <h1 className="text-xl font-bold text-white">
              Reset App Lock
            </h1>
            <p className="text-xs text-gray-500 mt-2">
              Enter your Noxis account credentials to unlock and reset the security PIN.
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <input
              type="email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              placeholder="Email address"
              className="w-full bg-[#0F1114] border border-white/8 text-white text-sm px-4 py-3 outline-none focus:border-[#60A5FA]/40 rounded-sm"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={forgotPassword}
                onChange={e => setForgotPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-[#0F1114] border border-white/8 text-white text-sm px-4 py-3 outline-none focus:border-[#60A5FA]/40 pr-10 rounded-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleForgotSubmit()
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleForgotSubmit}
            disabled={!forgotEmail || !forgotPassword || forgotLoading}
            className="w-full py-3 bg-[#60A5FA] text-black font-bold text-sm hover:bg-blue-400 disabled:opacity-50 transition-colors rounded-sm shadow-md"
          >
            {forgotLoading ? 'Verifying Credentials...' : 'Verify & Unlock System'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#060708] flex flex-col items-center justify-center z-[99999] select-none cursor-default">
      {/* Brand Header */}
      <div className="text-center mb-8 flex flex-col items-center">
        {logoUrl ? (
          <div className="relative mb-3 group">
            <div className="w-16 h-16 rounded-xl bg-[#0F1114] border border-white/10 p-1 flex items-center justify-center shadow-lg shadow-black/60 overflow-hidden">
              <img
                src={logoUrl}
                alt="Brand Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#60A5FA] text-black flex items-center justify-center shadow-md">
              <Lock size={12} strokeWidth={2.5} />
            </div>
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Lock size={24} className="text-[#60A5FA]" />
          </div>
        )}

        <h1 className="text-xl font-bold text-white tracking-tight mb-1">
          {businessName}
        </h1>
        <p className="text-xs text-gray-500">
          Enter 4-digit PIN to unlock session
        </p>

        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/5 text-[10px] text-gray-500">
          <ShieldCheck size={11} className="text-[#60A5FA]" />
          <span>Hardware Isolated Security Wall</span>
        </div>
      </div>

      {/* PIN dots */}
      <div className="flex gap-4 mb-7">
        {PIN_DOTS.map((filled, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
              filled ? 'bg-[#60A5FA] scale-110 shadow-sm shadow-[#60A5FA]/40' : 'bg-white/10 border border-white/15'
            }`}
          />
        ))}
      </div>

      {/* Error / lockout message */}
      {error && (
        <p className={`text-xs mb-6 text-center px-8 font-medium ${lockedUntil ? 'text-red-400' : 'text-amber-400'}`}>
          {lockedUntil ? `System Locked. Try again in ${countdown}s` : error}
        </p>
      )}

      {!error && (
        <div className="h-5 mb-6" />
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {NUMPAD.flat().map((key, i) => {
          if (key === '') {
            return <div key={i} className="w-16 h-16" />
          }

          if (key === '←') {
            return (
              <button
                key={i}
                type="button"
                onClick={deleteDigit}
                className="w-16 h-16 rounded-full bg-white/5 text-white text-lg font-semibold flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
              >
                ←
              </button>
            )
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => pressDigit(key)}
              disabled={!!lockedUntil}
              className="w-16 h-16 rounded-full bg-[#0F1114] border border-white/8 text-white text-xl font-semibold flex items-center justify-center hover:bg-[#161A1F] hover:border-white/20 active:scale-95 disabled:opacity-30 transition-all select-none"
            >
              {key}
            </button>
          )
        })}
      </div>

      {/* Forgot PIN */}
      <button
        type="button"
        onClick={() => {
          setMode('forgot')
          setError('')
          setPin('')
        }}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Forgot PIN? Reset with master credentials
      </button>
    </div>
  )
}
