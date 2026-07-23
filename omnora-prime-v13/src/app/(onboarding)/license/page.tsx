'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveLicenseToLocal } from './actions'
import { getApiUrl } from '@/lib/utils/apiUrl'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, Mail, ShieldAlert, CheckCircle } from 'lucide-react'

export default function LicensePage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkLicenseAndUser = async () => {
      // 1. Check if already licensed locally
      const stored = localStorage.getItem('noxis_license')
      if (stored) {
        try {
          const license = JSON.parse(stored)
          if (license.valid || license.key) {
            // Check trial expiry
            const isTrial = license.isTrialActive || license.is_trial
            const expiresAt = license.expiresAt || license.expires_at
            if (isTrial && expiresAt) {
              const expired = new Date(expiresAt) < new Date()
              if (expired) {
                localStorage.removeItem('noxis_license')
                setError('Your 10-day trial has expired. Contact support to purchase a key.')
                setChecking(false)
                return
              }
            }
            document.cookie = `noxis_license_active=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;
            router.push('/dashboard')
            return
          }
        } catch {}
      }

      // 2. Check if user is logged in -> attempt auto-detect
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          setEmail(user.email)
          // Try silent auto detect
          const array = new Uint8Array(16);
          window.crypto.getRandomValues(array);
          const nonce = Array.from(array, dec => dec.toString(16).padStart(2, '0')).join('');

          const res = await fetch(getApiUrl('/api/license/activate'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              autoDetect: true,
              machineInfo: {
                platform: navigator.platform,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              appVersion: '13.0.0',
              nonce,
            }),
            signal: AbortSignal.timeout(10000),
          })

          const data = await res.json()
          if (res.ok && data.success) {
            localStorage.setItem('noxis_license', JSON.stringify({
              ...data.license,
              valid: true,
              activatedAt: Date.now(),
              activated_locally_at: new Date().toISOString(),
              cacheExpires: Date.now() + 24 * 60 * 60 * 1000,
            }))
            localStorage.setItem('noxis_tier', data.license.tier)
            localStorage.setItem('noxis_max_devices', String(data.license.maxDevices))
            document.cookie = `noxis_license_active=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;

            await saveLicenseToLocal(data.license.key, data.license.tier, data.license.isTrialActive, data.license.expiresAt)
            router.push('/setup')
            return
          }
        }
      } catch (e) {
        console.warn('[License] Silent check error:', e)
      }

      setChecking(false)
    }

    checkLicenseAndUser()
  }, [router, supabase])

  const handleActivate = async () => {
    setError('')
    
    if (!email || !password) {
      setError('Please enter your account email and password')
      return
    }

    setLoading(true)

    try {
      // Step 1: Log in user first
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      // Auto-signup if user doesn't exist to make onboarding friction-free
      if (authError && authError.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password
        })

        if (signUpError) {
          throw new Error('Authentication failed: ' + signUpError.message)
        }
      } else if (authError) {
        throw authError
      }

      // Step 2: Validate/Bind Key
      const trimmedKey = key.trim().toUpperCase()
      const autoDetect = !trimmedKey

      if (trimmedKey) {
        const isValidLicenseKeyFormat = (k: string) => {
          if (k.length !== 19) return false;
          const parts = k.split('-');
          if (parts.length !== 4) return false;
          return parts.every(p => p.length === 4);
        };
        if (!isValidLicenseKeyFormat(trimmedKey)) {
          throw new Error('Invalid format. Key should be like: TRIA-XXXX-XXXX-XXXX')
        }
      }

      const machineInfo = {
        platform: navigator.platform,
        language: navigator.language,
        cores: String(navigator.hardwareConcurrency || 'unknown'),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${screen.width}x${screen.height}`,
      }

      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      const nonce = Array.from(array, dec => dec.toString(16).padStart(2, '0')).join('');

      const res = await fetch(getApiUrl('/api/license/activate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: trimmedKey || undefined,
          email: email.trim().toLowerCase(),
          autoDetect,
          machineInfo,
          appVersion: '13.0.0',
          nonce,
        }),
        signal: AbortSignal.timeout(15000),
      })

      let data: any = {}
      try {
        data = await res.json()
      } catch {
        data = { error: 'Invalid response from license server' }
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to activate license')
      }

      // Step 3: Persistence
      localStorage.setItem('noxis_license', JSON.stringify({
        ...data.license,
        valid: true,
        activatedAt: Date.now(),
        activated_locally_at: new Date().toISOString(),
        cacheExpires: Date.now() + 24 * 60 * 60 * 1000,
      }))
      localStorage.setItem('noxis_tier', data.license.tier)
      localStorage.setItem('noxis_max_devices', String(data.license.maxDevices))
      document.cookie = `noxis_license_active=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;

      try {
        await saveLicenseToLocal(
          data.license.key,
          data.license.tier,
          data.license.isTrialActive,
          data.license.expiresAt
        )
      } catch (dbErr) {
        console.error('Failed to sync to local SQLite:', dbErr)
      }

      router.push('/setup')
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Try again.')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#070809] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#040608] flex items-center justify-center p-6 text-slate-300 font-sans selection:bg-cyan-500/20 selection:text-white relative">
      
      {/* Background cyber glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/[0.015] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#C5A059]/[0.01] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md z-10 space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto flex items-center justify-center bg-white/5 border border-white/10 rounded-sm">
            <img src="/logos/noxis.png" alt="Noxis Logo" width={28} height={28} className="object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">
              Noxis <span className="text-cyan-400">License Auth</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Enter your account Login details to authorize this node.
            </p>
          </div>
        </div>

        {/* Form Box */}
        <div className="bg-[#0A0D10] border border-white/[0.04] p-8 rounded-sm space-y-5">
          
          <div className="space-y-2">
            <label className="block text-slate-500 text-[9px] font-bold tracking-widest uppercase">
              Account Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-650 w-4 h-4" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="owner@yourcompany.com"
                className="w-full bg-[#040608]/50 border border-white/[0.05] rounded-sm pl-10 pr-4 py-3 text-xs text-white placeholder-slate-700 outline-none focus:border-cyan-400/40 transition-colors font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-slate-500 text-[9px] font-bold tracking-widest uppercase">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-650 w-4 h-4" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#040608]/50 border border-white/[0.05] rounded-sm pl-10 pr-4 py-3 text-xs text-white placeholder-slate-700 outline-none focus:border-cyan-400/40 transition-colors font-medium"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/[0.03]">
            <label className="block text-slate-500 text-[9px] font-bold tracking-widest uppercase flex justify-between">
              <span>License Key</span>
              <span className="text-[8px] text-slate-600 normal-case font-medium">Optional if key is already linked</span>
            </label>
            <input
              type="text"
              value={key}
              onChange={e => {
                setError('')
                const val = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9-]/g, '')
                  .slice(0, 19)
                setKey(val)
              }}
              placeholder="TRIA-XXXX-XXXX-XXXX"
              className="w-full bg-[#040608]/50 border border-white/[0.05] rounded-sm px-4 py-3 text-xs text-white placeholder-slate-700 outline-none focus:border-cyan-400/40 transition-colors font-mono tracking-wider"
            />
          </div>

          {error && (
            <div className="bg-red-500/5 border border-red-500/20 text-[11px] text-red-400 p-3 rounded-sm leading-relaxed font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleActivate}
            disabled={loading}
            className={`w-full py-3.5 rounded-sm font-black text-xs uppercase tracking-widest transition-all ${
              loading 
                ? 'bg-cyan-500/55 text-black/60 cursor-not-allowed' 
                : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] cursor-pointer'
            }`}
          >
            {loading ? 'Authorizing Node...' : 'Authorize & Activate'}
          </button>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-600 space-y-1 font-medium">
          <p>No key? <a href="https://wa.me/923264742678" className="text-cyan-400 hover:underline">Get trial on WhatsApp</a></p>
          <p className="text-[9px] text-slate-700">Licenses are bound to your account email for high-security verification.</p>
        </div>
      </div>
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
      `}</style>
    </div>
  )
}
