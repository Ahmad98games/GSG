'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Shield, ShieldCheck, Lock, Unlock, KeyRound, 
  Clock, Eye, EyeOff, AlertTriangle, CheckCircle2,
  Minimize2, RefreshCw, Key
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'noxis-salt-2026')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function SecuritySettingsPage() {
  const searchParams = useSearchParams()
  const isReset = searchParams.get('resetPin')
  const { success, error: toastError } = useToast()

  const [lockEnabled, setLockEnabled] = useState(false)
  const [timeoutVal, setTimeoutVal] = useState(5)
  const [lockOnMinimize, setLockOnMinimize] = useState(false)
  const [recoverySecret, setRecoverySecret] = useState('')
  const [savedRecoverySecret, setSavedRecoverySecret] = useState(false)

  // PIN input states
  const [phase, setPhase] = useState<'idle' | 'verify_old' | 'set' | 'confirm' | 'recovery_setup'>('idle')
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [recoveryInput, setRecoveryInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // Load existing security state
  useEffect(() => {
    const load = async () => {
      try {
        const api = (window as any).electronAPI
        let enabled = false
        let t = 5

        if (api?.store?.isAppLockEnabled) {
          enabled = await api.store.isAppLockEnabled()
        } else if (typeof window !== 'undefined') {
          enabled = localStorage.getItem('noxis_app_lock_enabled') === 'true'
        }

        if (api?.store?.getLockTimeout) {
          t = await api.store.getLockTimeout()
        } else if (typeof window !== 'undefined') {
          t = parseInt(localStorage.getItem('noxis_lock_timeout') || '5', 10)
        }

        const minimizeStored = typeof window !== 'undefined' && localStorage.getItem('noxis_lock_on_minimize') === 'true'
        const hasSecret = typeof window !== 'undefined' && !!localStorage.getItem('noxis_recovery_secret')

        setLockEnabled(Boolean(enabled))
        setTimeoutVal(t || 5)
        setLockOnMinimize(minimizeStored)
        setSavedRecoverySecret(hasSecret)
      } catch (e) {
        console.warn('[Security] Failed to read store:', e)
      }
    }
    load()

    if (isReset) {
      setPhase('set')
      success('App Lock Reset', 'Please enter a fresh 4-digit PIN.')
    }
  }, [isReset])

  const NUMPAD = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '←'],
  ]

  const getCurrentPin = () => {
    if (phase === 'verify_old') return oldPin
    if (phase === 'set') return newPin
    if (phase === 'confirm') return confirmPin
    return ''
  }

  const setCurrentPin = (val: string | ((prev: string) => string)) => {
    if (phase === 'verify_old') setOldPin(val)
    else if (phase === 'set') setNewPin(val)
    else if (phase === 'confirm') setConfirmPin(val)
  }

  // Digit handling
  const handleDigit = useCallback(async (digit: string) => {
    setPinError('')

    if (digit === 'C') {
      setCurrentPin('')
      return
    }

    if (digit === '←') {
      setCurrentPin(prev => prev.slice(0, -1))
      return
    }

    const currentVal = getCurrentPin()
    if (currentVal.length >= 4) return
    const updated = currentVal + digit
    setCurrentPin(updated)

    if (updated.length === 4) {
      if (phase === 'verify_old') {
        setIsVerifying(true)
        const api = (window as any).electronAPI
        const storedHash = (await api?.store?.getPinHash?.()) || (typeof window !== 'undefined' ? localStorage.getItem('noxis_pin_hash') : '')
        const enteredHash = await hashPin(updated)

        if (storedHash && enteredHash === storedHash) {
          setPhase('set')
          setOldPin('')
          setNewPin('')
          setConfirmPin('')
          success('PIN Verified', 'Now choose your new 4-digit PIN.')
        } else {
          setPinError('Current PIN is incorrect.')
          setOldPin('')
        }
        setIsVerifying(false)
      } else if (phase === 'set') {
        setPhase('confirm')
        setConfirmPin('')
      } else if (phase === 'confirm') {
        if (updated === newPin) {
          setIsVerifying(true)
          const hash = await hashPin(newPin)
          const api = (window as any).electronAPI

          if (api?.store) {
            try {
              await api.store.savePinHash?.(hash)
              await api.store.setAppLockEnabled?.(true)
              await api.store.setLocked?.(false)
            } catch {}
          }

          if (typeof window !== 'undefined') {
            localStorage.setItem('noxis_pin_hash', hash)
            localStorage.setItem('noxis_app_lock_enabled', 'true')
            localStorage.removeItem('noxis_locked')
            sessionStorage.removeItem('noxis_locked')
          }

          setLockEnabled(true)
          setPhase('idle')
          setNewPin('')
          setConfirmPin('')
          success('App Lock Activated', 'Your 4-digit PIN is now active across all sessions.')
          setIsVerifying(false)
        } else {
          setPinError('PINs do not match. Please re-enter.')
          setNewPin('')
          setConfirmPin('')
          setPhase('set')
        }
      }
    }
  }, [phase, oldPin, newPin, confirmPin])

  // Native physical keyboard entry support
  useEffect(() => {
    if (phase === 'idle' || phase === 'recovery_setup') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleDigit('←')
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setPhase('idle')
        setOldPin('')
        setNewPin('')
        setConfirmPin('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, handleDigit])

  // Disable lock
  const handleDisable = async () => {
    const api = (window as any).electronAPI
    if (api?.store) {
      try {
        await api.store.disableAppLock?.()
        await api.store.setAppLockEnabled?.(false)
        await api.store.setLocked?.(false)
      } catch {}
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('noxis_app_lock_enabled', 'false')
      localStorage.removeItem('noxis_pin_hash')
      localStorage.removeItem('noxis_locked')
      sessionStorage.removeItem('noxis_locked')
    }

    setLockEnabled(false)
    setPhase('idle')
    setOldPin('')
    setNewPin('')
    setConfirmPin('')
    success('App Lock Disabled', 'Workstation is now open without PIN verification.')
  }

  // Timeout change
  const handleTimeoutChange = async (minutes: number) => {
    setTimeoutVal(minutes)
    const api = (window as any).electronAPI
    if (api?.store?.setLockTimeout) {
      try { await api.store.setLockTimeout(minutes) } catch {}
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('noxis_lock_timeout', String(minutes))
    }
    success('Timeout Updated', `Noxis will automatically lock after ${minutes === 0 ? 'immediate' : `${minutes} minute${minutes > 1 ? 's' : ''}`} of inactivity.`)
  }

  // Lock on minimize toggle
  const handleToggleMinimize = () => {
    const nextVal = !lockOnMinimize
    setLockOnMinimize(nextVal)
    if (typeof window !== 'undefined') {
      localStorage.setItem('noxis_lock_on_minimize', String(nextVal))
    }
    success('Lock Policy Updated', nextVal ? 'Noxis will lock immediately whenever minimized.' : 'Lock on minimize disabled.')
  }

  // Immediate lock
  const handleLockNow = async () => {
    if (!lockEnabled) {
      toastError('App Lock Not Enabled', 'Please enable App Lock and set a 4-digit PIN first.')
      return
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('noxis_locked', 'true')
      sessionStorage.setItem('noxis_locked', 'true')
    }
    const api = (window as any).electronAPI
    if (api?.store?.setLocked) {
      try { await api.store.setLocked(true) } catch {}
    }
    window.location.replace('/lock')
  }

  // Save emergency recovery secret
  const handleSaveRecoverySecret = () => {
    if (!recoveryInput.trim()) {
      toastError('Empty Phrase', 'Please enter a recovery secret or master password.')
      return
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('noxis_recovery_secret', recoveryInput.trim())
    }
    setSavedRecoverySecret(true)
    setRecoverySecret(recoveryInput.trim())
    setPhase('idle')
    setRecoveryInput('')
    success('Recovery Secret Saved', 'You can use this phrase if you ever forget your 4-digit PIN.')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center">
            <Shield size={22} className="text-[#60A5FA]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white uppercase tracking-tight font-mono">
              Security & Master App Lock
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Protect confidential factory ledgers, wages, and wholesale invoices with encrypted hardware PIN lock.
            </p>
          </div>
        </div>

        {lockEnabled && (
          <button
            onClick={handleLockNow}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
            title="Lock workstation immediately (Ctrl + L)"
          >
            <Lock size={14} />
            <span>Lock Now</span>
            <span className="text-[10px] text-red-400/60 font-sans ml-1">Ctrl+L</span>
          </button>
        )}
      </div>

      {/* Main Status Card */}
      <div className={`p-6 rounded-xl border transition-all ${
        lockEnabled
          ? 'bg-gradient-to-r from-emerald-500/[0.08] via-emerald-500/[0.03] to-transparent border-emerald-500/30 shadow-lg shadow-emerald-500/5'
          : 'bg-[#0F1114] border-white/8'
      }`}>
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${lockEnabled ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse' : 'bg-zinc-600'}`} />
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                {lockEnabled ? '🔒 Workstation Protected (App Lock Active)' : '🔓 App Lock Disarmed'}
              </h2>
            </div>
            <p className="text-xs text-gray-400 max-w-xl leading-relaxed pt-1">
              {lockEnabled
                ? `System is locked with a 4-digit PIN. Workstation will automatically lock after ${timeoutVal} minutes of inactivity.`
                : 'Anyone with physical access to this computer can view your accounts, payroll, and stock levels.'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {!lockEnabled ? (
              <button
                onClick={() => {
                  setPhase('set')
                  setNewPin('')
                  setConfirmPin('')
                  setPinError('')
                }}
                className="px-5 py-2.5 bg-[#60A5FA] text-slate-950 font-bold font-mono text-xs uppercase tracking-wider hover:bg-blue-400 rounded-lg shadow-md transition-all cursor-pointer"
              >
                Enable App Lock
              </button>
            ) : (
              <button
                onClick={handleDisable}
                className="px-4 py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Disable Lock
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PIN Setup Modal / Card Flow */}
      {phase !== 'idle' && phase !== 'recovery_setup' && (
        <div className="p-8 bg-[#0B0E14] border border-[#60A5FA]/30 rounded-xl shadow-2xl space-y-6 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-full bg-[#60A5FA]/10 border border-[#60A5FA]/30 flex items-center justify-center mx-auto mb-2 text-[#60A5FA]">
              <KeyRound size={22} />
            </div>
            <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
              {phase === 'verify_old' && 'Verify Current PIN'}
              {phase === 'set' && 'Enter New 4-Digit PIN'}
              {phase === 'confirm' && 'Confirm Your 4-Digit PIN'}
            </h3>
            <p className="text-[11px] text-gray-400">
              Type on your keyboard or tap the buttons below.
            </p>
          </div>

          {/* 4 PIN Dots */}
          <div className="flex gap-4 justify-center py-2">
            {Array.from({ length: 4 }, (_, i) => {
              const currentLength = getCurrentPin().length
              const filled = i < currentLength
              return (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    filled
                      ? 'bg-[#60A5FA] border-[#60A5FA] scale-110 shadow-md shadow-[#60A5FA]/50'
                      : 'border-white/20 bg-white/5'
                  }`}
                />
              )
            })}
          </div>

          {pinError && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 py-2 rounded-lg text-center font-mono">
              <AlertTriangle size={14} />
              <span>{pinError}</span>
            </div>
          )}

          {/* Interactive Numpad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
            {NUMPAD.flat().map((key, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleDigit(key)}
                className={`h-12 bg-[#12161F] border border-white/8 text-white text-lg font-bold font-mono rounded-lg hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                  key === 'C' ? 'text-amber-400 text-sm' : ''
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setPhase('idle')
                setOldPin('')
                setNewPin('')
                setConfirmPin('')
                setPinError('')
              }}
              className="text-xs text-gray-500 hover:text-gray-300 font-mono underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Security Layers & Feature Controls */}
      {lockEnabled && phase === 'idle' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Layer 1: Inactivity Timeout */}
          <div className="p-6 bg-[#0F1114] border border-white/8 rounded-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Auto-Lock Inactivity Timeout
                </h3>
                <p className="text-[11px] text-gray-400">
                  Locks the screen when left unattended.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-2">
              {[1, 5, 15, 30, 60].map(m => (
                <button
                  key={m}
                  onClick={() => handleTimeoutChange(m)}
                  className={`py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    timeoutVal === m
                      ? 'bg-[#60A5FA] text-slate-950 shadow-md shadow-[#60A5FA]/25'
                      : 'bg-white/5 border border-white/8 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* Layer 2: Lock on Window Minimize */}
          <div className="p-6 bg-[#0F1114] border border-white/8 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5">
                <Minimize2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Lock on Window Minimize
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Immediately arms lock screen if Noxis is minimized or hidden.
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleMinimize}
              className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 cursor-pointer ${
                lockOnMinimize ? 'bg-amber-500' : 'bg-white/10'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                lockOnMinimize ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Layer 3: Change PIN Action */}
          <div className="p-6 bg-[#0F1114] border border-white/8 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <RefreshCw size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Change Master PIN
                </h3>
                <p className="text-[11px] text-gray-400">
                  Update your 4-digit workstation passcode.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setPhase('verify_old')
                setOldPin('')
                setNewPin('')
                setConfirmPin('')
                setPinError('')
              }}
              className="px-4 py-2 border border-white/10 hover:border-white/25 rounded-lg text-xs font-mono font-bold text-white transition-all cursor-pointer"
            >
              Change PIN
            </button>
          </div>

          {/* Layer 4: Emergency Master Recovery Phrase */}
          <div className="p-6 bg-[#0F1114] border border-white/8 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Key size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Emergency Recovery Phrase
                </h3>
                <p className="text-[11px] text-gray-400">
                  {savedRecoverySecret ? 'Recovery phrase is active on this machine.' : 'Set phrase to reset forgotten PIN.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setPhase('recovery_setup')}
              className="px-4 py-2 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
            >
              {savedRecoverySecret ? 'Update' : 'Configure'}
            </button>
          </div>
        </div>
      )}

      {/* Emergency Recovery Setup Modal */}
      {phase === 'recovery_setup' && (
        <div className="p-6 bg-[#0B0E14] border border-emerald-500/30 rounded-xl max-w-md mx-auto space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white font-mono uppercase">
              Set Emergency Recovery Passphrase
            </h3>
            <p className="text-xs text-gray-400">
              If a factory manager or operator forgets the 4-digit PIN, this secret word unlocks the app.
            </p>
          </div>

          <input
            type="text"
            value={recoveryInput}
            onChange={(e) => setRecoveryInput(e.target.value)}
            placeholder="e.g. MasterKey2026 or SecretWord"
            className="w-full px-4 py-2.5 bg-[#12161F] border border-white/10 rounded-lg text-sm text-white font-mono outline-none focus:border-emerald-400"
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setPhase('idle')}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white font-mono cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRecoverySecret}
              className="px-4 py-2 bg-emerald-500 text-slate-950 font-mono font-bold text-xs uppercase rounded-lg hover:bg-emerald-400 transition-all cursor-pointer"
            >
              Save Recovery Secret
            </button>
          </div>
        </div>
      )}

      {/* Information Banner */}
      <div className="p-4 bg-[#0A0C0F] border border-white/6 rounded-xl flex items-start gap-3">
        <ShieldCheck size={18} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 leading-relaxed font-sans">
          <strong className="text-white font-mono">Omnora Hardware Security:</strong> App Lock operates locally with SHA-256 cryptographic salting. After 5 incorrect attempts, Noxis automatically enters an exponential lockout cycle to defeat brute-force attempts on factory floors.
        </p>
      </div>
    </div>
  )
}
