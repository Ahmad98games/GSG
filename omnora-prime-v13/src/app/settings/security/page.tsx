'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Shield } from 'lucide-react'
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
  const { success } = useToast()

  const [lockEnabled, setLockEnabled] = useState(false)
  const [timeout, setTimeoutVal] = useState(5)
  const [phase, setPhase] = useState<'idle' | 'set' | 'confirm'>('idle')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')

  useEffect(() => {
    const load = async () => {
      const api = (window as any).electronAPI
      const enabled = await api?.store.isAppLockEnabled()
      const t = await api?.store.getLockTimeout()
      setLockEnabled(enabled || false)
      setTimeoutVal(t || 5)
    }
    load()

    if (isReset) {
      setPhase('set')
      success('PIN disabled', 'Set a new one.')
    }
  }, [isReset])

  const NUMPAD = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '←'],
  ]

  const currentPin = phase === 'set' ? newPin : confirmPin
  const setCurrentPin = phase === 'set' ? setNewPin : setConfirmPin

  const handleDigit = useCallback(
    async (digit: string) => {
      if (digit === '←') {
        setCurrentPin(p => p.slice(0, -1))
        return
      }

      const updated = currentPin + digit

      if (updated.length > 4) return
      setCurrentPin(updated)
      setPinError('')

      if (updated.length === 4) {
        if (phase === 'set') {
          setPhase('confirm')
          setConfirmPin('')
        } else if (phase === 'confirm') {
          if (updated === newPin) {
            const hash = await hashPin(newPin)
            await (window as any).electronAPI?.store.savePinHash(hash)
            setLockEnabled(true)
            setPhase('idle')
            setNewPin('')
            setConfirmPin('')
            success('App lock enabled')
          } else {
            setPinError('PINs do not match. Try again.')
            setNewPin('')
            setConfirmPin('')
            setPhase('set')
          }
        }
      }
    },
    [currentPin, phase, newPin, setCurrentPin]
  )

  const handleDisable = async () => {
    await (window as any).electronAPI?.store.disableAppLock()
    setLockEnabled(false)
    setPhase('idle')
    success('App lock disabled')
  }

  const handleTimeoutChange = async (minutes: number) => {
    setTimeoutVal(minutes)
    await (window as any).electronAPI?.store.setLockTimeout(minutes)
  }

  return (
    <div className="p-6 max-w-md">
      <div className="flex items-center gap-3 mb-8">
        <Shield size={20} className="text-[#60A5FA]" />
        <div>
          <h1 className="text-xl font-bold text-white">
            Security & App Lock
          </h1>
          <p className="text-[10px] text-gray-500">
            Protect your business data with a 4-digit PIN
          </p>
        </div>
      </div>

      {/* Current status */}
      <div className={`p-4 rounded-sm mb-6 flex items-center justify-between ${
        lockEnabled
          ? 'bg-emerald-500/8 border border-emerald-500/20'
          : 'bg-[#0F1114] border border-white/8'
      }`}>
        <div>
          <p className="text-sm font-semibold text-white">
            App Lock
          </p>
          <p className="text-[10px] text-gray-500">
            {lockEnabled
              ? `Locks after ${timeout} minutes of inactivity`
              : 'Anyone who opens Noxis can access your data'}
          </p>
        </div>
        <div className={`text-xs font-bold px-3 py-1.5 rounded-sm ${
          lockEnabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-gray-600'
        }`}>
          {lockEnabled ? '🔒 ON' : '🔓 OFF'}
        </div>
      </div>

      {/* SET PIN flow */}
      {phase !== 'idle' && (
        <div className="mb-6">
          <p className="text-sm text-center text-gray-400 mb-4">
            {phase === 'set' ? 'Enter your new 4-digit PIN' : 'Confirm your PIN'}
          </p>

          {/* PIN dots */}
          <div className="flex gap-3 justify-center mb-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i < currentPin.length ? 'bg-[#60A5FA]' : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {pinError && (
            <p className="text-xs text-red-400 text-center mb-3">
              {pinError}
            </p>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
            {NUMPAD.flat().map((key, i) => {
              if (key === '') {
                return <div key={i} />
              }
              return (
                <button
                  key={i}
                  onClick={() => handleDigit(key)}
                  className="w-full aspect-square bg-[#0F1114] border border-white/8 text-white text-xl font-semibold rounded-sm hover:bg-[#161A1F] active:scale-95 transition-all flex items-center justify-center"
                >
                  {key}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Controls */}
      {phase === 'idle' && (
        <div className="space-y-3">
          {!lockEnabled ? (
            <button
              onClick={() => {
                setPhase('set')
                setNewPin('')
                setConfirmPin('')
              }}
              className="w-full py-3 bg-[#60A5FA] text-black font-bold text-sm hover:bg-blue-400 transition-colors"
            >
              Enable App Lock
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setPhase('set')
                  setNewPin('')
                  setConfirmPin('')
                }}
                className="w-full py-3 border border-white/10 text-gray-400 text-sm font-semibold hover:border-white/20 transition-colors"
              >
                Change PIN
              </button>
              <button
                onClick={handleDisable}
                className="w-full py-3 border border-red-500/20 text-red-400 text-sm font-semibold hover:border-red-500/40 transition-colors"
              >
                Disable App Lock
              </button>
            </>
          )}
        </div>
      )}

      {/* Timeout setting */}
      {lockEnabled && phase === 'idle' && (
        <div className="mt-6 p-4 bg-[#0F1114] border border-white/8 rounded-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
            Lock After Inactivity
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 15, 30].map(m => (
              <button
                key={m}
                onClick={() => handleTimeoutChange(m)}
                className={`py-2 text-xs font-bold rounded-sm transition-colors ${
                  timeout === m ? 'bg-[#60A5FA] text-black' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-[#0A0C0F] border border-white/6 rounded-sm">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          The PIN protects Noxis if you step away from your desk. It does not replace your account password.
          <br /><br />
          If you forget your PIN, you can reset it using your Noxis email and password.
        </p>
      </div>
    </div>
  )
}
