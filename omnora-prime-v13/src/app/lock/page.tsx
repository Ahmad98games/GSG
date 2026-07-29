'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

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

  // Get business name for display
  useEffect(() => {
    const api = (window as any).electronAPI
    if (api?.store?.getSession) {
      api.store.getSession().then((s: any) => {
        if (s?.email) {
          setForgotEmail(s.email)
        }
      })
    }
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
        router.replace('/dashboard')
        return
      }

      const enteredHash = await hashPin(enteredPin)

      if (enteredHash === storedHash) {
        setPin('')
        setError('')
        setAttempts(0)

        const lastRoute = await api?.store.getLastRoute()
        router.replace(lastRoute || '/dashboard')
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        setPin('')

        if (newAttempts >= 5) {
          const unlockAt = Date.now() + 60000
          setLockedUntil(unlockAt)
          setError('Too many attempts. Wait 60 seconds.')
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

    // Valid credentials — disable old PIN
    await (window as any).electronAPI?.store.disableAppLock()

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
      <div className="fixed inset-0 bg-[#060708] flex items-center justify-center p-6 z-50">
        <div className="w-full max-w-sm">
          <button
            onClick={() => {
              setMode('pin')
              setError('')
            }}
            className="text-gray-600 text-sm mb-8 hover:text-gray-400"
          >
            ← Back
          </button>

          <div className="text-center mb-8">
            <Lock size={32} className="text-[#60A5FA] mx-auto mb-3" />
            <h1 className="text-xl font-bold text-white">
              Reset App Lock
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Enter your Noxis account credentials to disable the PIN.
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-sm flex items-center gap-2">
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
              className="w-full bg-[#0F1114] border border-white/8 text-white text-sm px-4 py-3 outline-none focus:border-[#60A5FA]/40"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={forgotPassword}
                onChange={e => setForgotPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-[#0F1114] border border-white/8 text-white text-sm px-4 py-3 outline-none focus:border-[#60A5FA]/40 pr-10"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleForgotSubmit()
                  }
                }}
              />
              <button
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleForgotSubmit}
            disabled={!forgotEmail || !forgotPassword || forgotLoading}
            className="w-full py-3 bg-[#60A5FA] text-black font-bold text-sm hover:bg-blue-400 disabled:opacity-50 transition-colors"
          >
            {forgotLoading ? 'Verifying...' : 'Verify & Disable PIN'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#060708] flex flex-col items-center justify-center z-50">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-full bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-[#60A5FA]" />
        </div>
        <h1 className="text-xl font-bold text-white mb-1">
          Noxis Hub
        </h1>
        <p className="text-sm text-gray-500">
          Enter your 4-digit PIN to continue
        </p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-4 mb-8">
        {PIN_DOTS.map((filled, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-150 ${
              filled ? 'bg-[#60A5FA] scale-110' : 'bg-white/10 border border-white/20'
            }`}
          />
        ))}
      </div>

      {/* Error / lockout */}
      {error && (
        <p className={`text-sm mb-6 text-center px-8 ${lockedUntil ? 'text-red-400' : 'text-amber-400'}`}>
          {lockedUntil ? `Locked. Try again in ${countdown}s` : error}
        </p>
      )}

      {!error && (
        <div className="h-6 mb-6" />
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {NUMPAD.flat().map((key, i) => {
          if (key === '') {
            return <div key={i} />
          }

          if (key === '←') {
            return (
              <button
                key={i}
                onClick={deleteDigit}
                className="w-20 h-20 rounded-full bg-white/5 text-white text-xl font-semibold flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
              >
                ←
              </button>
            )
          }

          return (
            <button
              key={i}
              onClick={() => pressDigit(key)}
              disabled={!!lockedUntil}
              className="w-20 h-20 rounded-full bg-[#0F1114] border border-white/8 text-white text-2xl font-semibold flex items-center justify-center hover:bg-[#161A1F] hover:border-white/20 active:scale-95 disabled:opacity-30 transition-all select-none"
            >
              {key}
            </button>
          )
        })}
      </div>

      {/* Forgot PIN */}
      <button
        onClick={() => {
          setMode('forgot')
          setError('')
          setPin('')
        }}
        className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
      >
        Forgot PIN? Reset with email
      </button>
    </div>
  )
}
