'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  ArrowRight, 
  Copy, 
  ExternalLink,
  Laptop,
  Smartphone,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'
import { FloatingOrb } from '@/components/ui/AnimatedComponents'

const SUPABASE_URL = 'https://zgxmvwxzjmpmesqliwxl.supabase.co'

// For now all tiers use the same installer
const SINGLE_EXE = 'https://pub-[hash].r2.dev/NoxisSetup.exe'
const SINGLE_APK = 'https://pub-[hash].r2.dev/noxis.apk'

type VerifyResult = {
  valid: boolean
  tier?: string
  customer_name?: string
  expires_at?: string
  is_trial?: boolean
  error?: string
}

export default function DownloadPage() {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [step, setStep] = useState<'enter' | 'verified' | 'downloading'>('enter')
  const [copied, setCopied] = useState(false)

  const handleVerify = async () => {
    const cleaned = key.trim().toUpperCase()
    if (!cleaned || cleaned.length < 10) {
      setResult({ 
        valid: false,
        error: 'Please enter a valid license key format' 
      })
      return
    }

    setLoading(true)
    setResult(null)

    // Abort controller for a strict 10s request timeout to prevent indefinite page freezes
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/verify-license`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer sb_publishable_cGJQMAam_R4JU3X4IEIrkQ_EPeSsQIt`,
          },
          body: JSON.stringify({
            license_key: cleaned
          }),
          signal: controller.signal
        }
      )
      clearTimeout(timeoutId)

      const data: VerifyResult = await res.json()
      setResult(data)

      if (data.valid) {
        setStep('verified')
        // Auto-start download after 2 seconds
        setTimeout(() => {
          triggerDownload(SINGLE_EXE, 'NoxisSetup.exe')
          setStep('downloading')
        }, 2000)
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      const isAbort = err.name === 'AbortError'
      setResult({
        valid: false,
        error: isAbort 
          ? 'The verification request timed out. Please check your network and try again.'
          : 'Connection failed. Verify your internet connection and try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const triggerDownload = (url: string, name: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tierColors: Record<string, string> = {
    lite: '#9CA3AF',
    pro: '#3B82F6',
    elite: '#C5A059',
  }

  const tierGlows: Record<string, string> = {
    lite: 'rgba(156,163,175,0.15)',
    pro: 'rgba(59,130,246,0.15)',
    elite: 'rgba(197,160,89,0.15)',
  }

  const tierColor = tierColors[result?.tier || 'lite'] || '#3B82F6'
  const tierGlow = tierGlows[result?.tier || 'lite'] || 'rgba(59,130,246,0.15)'

  return (
    <main className="min-h-screen bg-[#070809] text-white font-sans flex flex-col items-center justify-between py-16 px-6 relative overflow-hidden select-none">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <FloatingOrb color="rgba(96,165,250,0.05)" size={500} x="20%" y="20%" delay={0} blur={120} />
        <FloatingOrb color="rgba(197,160,89,0.04)" size={400} x="80%" y="70%" delay={4} blur={115} />
      </div>
      
      {/* Header / Logo */}
      <div className="flex items-center gap-3 z-10 select-none mb-12">
        <div className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl p-2">
          <img
            src="/logos/noxis.png"
            alt="Noxis"
            className="w-full h-full object-contain"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
        <span className="text-xl font-black tracking-[0.2em] text-white font-mono uppercase">
          NOXIS
        </span>
      </div>

      {/* Main Glassmorphism Card Wrapper */}
      <div className="w-full max-w-[500px] bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] p-8 md:p-10 z-10 relative overflow-hidden">
        {/* Glow border line at the top */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <AnimatePresence mode="wait">
          {step === 'enter' && (
            <motion.div
              key="enter"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                  Download Noxis
                </h1>
                <p className="text-gray-400 text-xs leading-relaxed font-medium">
                  Verify your license key to download your offline-first industrial client installer. Your license was sent to your registered email and WhatsApp after purchase.
                </p>
              </div>

              {/* Key Input */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-bold text-gray-500 tracking-[0.25em] block">
                  License Key
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={key}
                    onChange={e => {
                      const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                      const parts = v.match(/.{1,4}/g) || []
                      setKey(parts.join('-').slice(0, 19))
                      setResult(null)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleVerify()
                    }}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="w-full bg-[#0B0C0F] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-base font-mono text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-gray-700 tracking-[0.1em]"
                  />
                  {key && (
                    <button 
                      onClick={() => setKey('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-500 hover:text-white uppercase tracking-widest"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Error Panel */}
              {result?.error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex items-start gap-3 text-red-400 text-xs leading-relaxed font-medium"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{result.error}</span>
                </motion.div>
              )}

              {/* Action Button */}
              <button
                onClick={handleVerify}
                disabled={loading || !key}
                className="w-full flex items-center justify-center gap-2 py-4 bg-blue-500 hover:bg-blue-400 disabled:bg-gray-800 disabled:text-gray-500 text-black rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-150 cursor-pointer disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-blue-500/10"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Verify & Download</span>
                  </>
                )}
              </button>

              {/* Deep Link Launch shortcut */}
              <button
                onClick={() => {
                  window.location.href = 'noxishub://open'
                  setTimeout(() => {
                    if (document.hasFocus()) {
                      alert("If the Noxis Hub app is not opening, please download and install the APK first.")
                    }
                  }, 2000)
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Open Noxis Hub App</span>
              </button>

              {/* Trial Support Segment */}
              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    Don&apos;t have a verified license key?
                  </span>
                  <p className="text-[11px] text-gray-400 max-w-xs leading-normal">
                    You can request a free 3-day trial key to test the system offline immediately.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href="https://wa.me/923334355475?text=Hi, I want to try Noxis. Please send me a trial key."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:brightness-110 text-black text-[10px] font-black uppercase tracking-widest rounded-xl text-center transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Trial</span>
                  </a>
                  
                  <a
                    href="/pricing"
                    className="flex-1 flex items-center justify-center py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-[10px] font-black uppercase tracking-widest rounded-xl text-center transition-all"
                  >
                    <span>View Pricing Plans</span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {(step === 'verified' || step === 'downloading') && result?.valid && (
            <motion.div
              key="verified"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-center"
            >
              {/* Success Ring Indicator */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.1)] mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                {/* Dynamic Tier Badge */}
                <div 
                  style={{ 
                    backgroundColor: `${tierColor}15`, 
                    borderColor: `${tierColor}40`,
                    color: tierColor,
                    boxShadow: `0 0 15px ${tierGlow}`
                  }}
                  className="inline-block border rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] mb-4"
                >
                  {result.tier} Plan Verified
                </div>

                <h2 className="text-xl font-bold tracking-tight text-white uppercase">
                  Welcome, {result.customer_name}
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  {step === 'downloading'
                    ? 'Your download has started. Check your browser downloads folder.'
                    : 'Securing package. Download starting in 2 seconds...'}
                </p>

                {result.is_trial && (
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-0.5 rounded-full uppercase font-black tracking-widest mt-3">
                    3-Day Trial — Starts Today
                  </span>
                )}
              </div>

              {/* Verified License Key Box */}
              <div className="bg-[#0B0C0F] border border-white/5 rounded-xl p-5 space-y-3 relative overflow-hidden select-text text-center">
                <span className="text-[9px] uppercase font-bold text-gray-600 tracking-[0.2em] block">
                  Your Master License Key
                </span>
                <p 
                  style={{ color: tierColor }}
                  className="font-mono text-base font-black tracking-[0.08em]"
                >
                  {key}
                </p>
                <p className="text-[10px] text-red-500 font-bold leading-normal">
                  This key also serves as your admin credentials password. Keep it secure and do not share it.
                </p>
                
                <button
                  onClick={handleCopy}
                  className="mt-2 inline-flex items-center gap-2 py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-gray-300 transition-all font-bold uppercase tracking-wider cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied!' : 'Copy Key'}</span>
                </button>
              </div>

              {/* Native Download Platform Options */}
              <div className="flex flex-col gap-3">
                <a
                  href={SINGLE_EXE}
                  onClick={() => triggerDownload(SINGLE_EXE, 'NoxisSetup.exe')}
                  className="flex items-center justify-center gap-3 py-4 bg-blue-500 hover:bg-blue-400 text-black text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-blue-500/15"
                >
                  <Laptop className="w-4 h-4" />
                  <span>Download for Windows (.exe)</span>
                </a>
                
                <a
                  href={SINGLE_APK}
                  onClick={() => triggerDownload(SINGLE_APK, 'noxis.apk')}
                  className="flex items-center justify-center gap-3 py-4 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-emerald-500/15"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Download for Android (.apk)</span>
                </a>

                {/* Deep Link Launch Shortcut */}
                <button
                  onClick={() => {
                    window.location.href = 'noxishub://open'
                    setTimeout(() => {
                      if (document.hasFocus()) {
                        alert("If the Noxis Hub app is not opening, please verify that it is installed on your Android device.")
                      }
                    }, 2000)
                  }}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch Android App</span>
                </button>
              </div>

              {/* Walkthrough Guide */}
              <div className="border-t border-white/5 pt-5 text-left space-y-4">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">
                  Installation Protocol
                </span>
                
                <div className="space-y-3">
                  {[
                    'Execute NoxisSetup.exe on your Windows workstation',
                    'Paste your verified master key to unlock features offline',
                    'Noxis will launch and setup local system databases',
                    'Pair your mobile device using the companion APK'
                  ].map((text, idx) => (
                    <div key={idx} className="flex gap-3 items-start text-xs leading-normal">
                      <span className="w-5 h-5 flex items-center justify-center bg-blue-500/10 text-blue-400 rounded font-mono font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="text-gray-400 font-medium">
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset to different key */}
              <div className="pt-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>Questions?</span>
                  <a
                    href="https://wa.me/923334355475"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#25D366] hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>WhatsApp Support</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <button
                  onClick={() => {
                    setStep('enter')
                    setKey('')
                    setResult(null)
                  }}
                  className="text-[10px] text-gray-600 hover:text-white font-bold uppercase tracking-widest mt-4 transition-colors cursor-pointer"
                >
                  Use a different key
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer copyright */}
      <div className="mt-12 text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] text-center z-10 select-none">
        © 2025 Omnora Labs · noxishub.app
      </div>
    </main>
  )
}
