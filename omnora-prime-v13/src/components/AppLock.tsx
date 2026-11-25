'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Lock, AlertCircle, ShieldCheck } from 'lucide-react'
import { useLockStore } from '@/stores/lockStore'

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'noxis-salt-2026')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const AppLock: React.FC = () => {
  const { isLocked, unlock } = useLockStore()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [nowTime, setNowTime] = useState('')
  const pinInputRef = useRef<HTMLInputElement | null>(null)

  // Live clock
  useEffect(() => {
    if (!isLocked) return
    const updateClock = () => {
      setNowTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      )
    }
    updateClock()
    const t = setInterval(updateClock, 10_000)
    return () => clearInterval(t)
  }, [isLocked])

  // Force focus PIN input whenever lock activates
  useEffect(() => {
    if (!isLocked) {
      setPin('')
      setError('')
      return
    }
    const timer = setTimeout(() => {
      pinInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [isLocked])

  // Lockout countdown timer
  useEffect(() => {
    if (!lockedUntil) return
    const interval = setInterval(() => {
      const rem = Math.ceil((lockedUntil - Date.now()) / 1000)
      if (rem <= 0) {
        setLockedUntil(null)
        setCountdown(0)
        setAttempts(0)
        setError('')
        clearInterval(interval)
      } else {
        setCountdown(rem)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [lockedUntil])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 450)
  }

  const verifyPin = useCallback(
    async (enteredPin: string) => {
      if (lockedUntil && Date.now() < lockedUntil) return

      const api = (window as any).electronAPI
      let storedHash = ''
      try {
        storedHash = (await api?.store?.getPinHash?.()) || ''
      } catch {}

      if (!storedHash && typeof window !== 'undefined') {
        storedHash = localStorage.getItem('noxis_pin_hash') || ''
      }

      // If no PIN hash exists at all, unlock safely
      if (!storedHash) {
        try {
          await api?.store?.setLocked?.(false)
        } catch {}
        unlock()
        return
      }

      const enteredHash = await hashPin(enteredPin)
      if (enteredHash === storedHash) {
        setAttempts(0)
        setPin('')
        setError('')
        try {
          await api?.store?.clearLockAttempts?.()
          await api?.store?.setLocked?.(false)
          await api?.store?.saveLastActive?.()
        } catch {}
        unlock()
      } else {
        const nextAttempts = attempts + 1
        setAttempts(nextAttempts)
        setPin('')
        triggerShake()
        if (nextAttempts >= 5) {
          const until = Date.now() + 30_000
          setLockedUntil(until)
          setCountdown(30)
          setError('Too many failed attempts. Locked for 30 seconds.')
        } else {
          setError(`Incorrect PIN — ${5 - nextAttempts} attempts remaining`)
        }
        setTimeout(() => pinInputRef.current?.focus(), 60)
      }
    },
    [attempts, lockedUntil, unlock]
  )

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (lockedUntil && Date.now() < lockedUntil) return
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(val)
    if (error && !lockedUntil) setError('')
    if (val.length === 4) {
      verifyPin(val)
    }
  }

  if (!isLocked) return null

  return (
    <div
      onClick={() => pinInputRef.current?.focus()}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'all' }}
      className="flex flex-col items-center justify-center bg-[#060708] text-white select-none"
    >
      <div
        className={`w-full max-w-sm rounded-2xl border border-white/10 bg-[#0D1015] p-8 text-center shadow-2xl transition-transform ${
          shake ? 'animate-[shake_0.35s_ease-in-out]' : ''
        }`}
      >
        {/* Logo & Time */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
          <Lock size={26} />
        </div>

        <h1 className="text-lg font-black tracking-tight text-white">Workstation Locked</h1>
        <p className="mt-1 font-mono text-xs text-slate-400">{nowTime}</p>

        {/* 4-Dot PIN Indicator */}
        <div className="mt-7 flex items-center justify-center gap-4">
          {[0, 1, 2, 3].map((idx) => {
            const filled = idx < pin.length
            return (
              <div
                key={idx}
                className={`h-4 w-4 rounded-full border transition-all duration-150 ${
                  filled
                    ? 'scale-110 border-cyan-400 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]'
                    : 'border-white/25 bg-white/5'
                }`}
              />
            )
          })}
        </div>

        {/* Masked Keyboard Input */}
        <input
          ref={pinInputRef}
          type="password"
          inputMode="numeric"
          autoFocus
          tabIndex={0}
          maxLength={4}
          value={pin}
          onChange={handlePinChange}
          disabled={Boolean(lockedUntil && Date.now() < lockedUntil)}
          aria-label="Enter 4-digit PIN"
          className="mt-5 w-36 rounded-lg border border-white/10 bg-[#060708] px-3 py-2 text-center font-mono text-base tracking-[0.5em] text-white outline-none focus:border-cyan-500/60"
          placeholder="••••"
        />

        <p className="mt-3 text-xs text-slate-400">
          {lockedUntil && countdown > 0
            ? `Locked — wait ${countdown}s`
            : 'Enter PIN to continue'}
        </p>

        {error && (
          <div className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-slate-600">
          <ShieldCheck size={12} />
          <span>Noxis Security Shield • Ctrl+L</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
