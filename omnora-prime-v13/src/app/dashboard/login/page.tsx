'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { KeyRound, Mail, ArrowLeft, Shield } from 'lucide-react'

export default function OwnerLogin() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth
      .signInWithPassword({ email, password })

    if (authError) {
      setError(
        authError.message.includes('Invalid')
          ? 'Wrong email or password. Try again.'
          : 'Could not sign in. Check your connection.'
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#040608] text-[#94A3B8] font-sans flex items-center justify-center p-6 relative overflow-hidden selection:bg-[#C5A059]/30 selection:text-white">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#C5A059]/[0.015] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#00E5FF]/[0.01] rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm z-10 space-y-8">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Logo and Titles */}
        <div className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto flex items-center justify-center bg-white/5 border border-white/10 rounded-sm shadow-2xl">
            <img src="/logos/noxis.png" alt="Noxis Logo" width={24} height={24} className="object-contain" />
          </div>
          <div className="space-y-1">
            <p className="text-[#C5A059] text-[9px] font-bold tracking-[0.3em] uppercase">
              Noxis hub
            </p>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              Owner Dashboard
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Monitor your industrial units from anywhere in the world.
            </p>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="bg-[#0A0D10] border border-white/[0.04] p-8 rounded-sm space-y-6">
          
          <div className="space-y-2">
            <label className="block text-slate-500 text-[9px] font-bold tracking-widest uppercase">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="you@factory.com"
                className="w-full bg-[#040608]/50 border border-white/[0.05] rounded-sm pl-10 pr-4 py-3 text-xs text-white placeholder-slate-650 outline-none focus:border-[#C5A059]/40 transition-colors font-medium font-sans"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-slate-500 text-[9px] font-bold tracking-widest uppercase">
              Master Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="w-full bg-[#040608]/50 border border-white/[0.05] rounded-sm pl-10 pr-4 py-3 text-xs text-white placeholder-slate-650 outline-none focus:border-[#C5A059]/40 transition-colors font-medium font-sans"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/5 border border-red-500/20 text-xs text-red-400 p-3 rounded-sm leading-relaxed font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-3.5 rounded-sm font-black text-xs uppercase tracking-widest transition-all ${
              loading 
                ? 'bg-[#C5A059]/50 text-black/55 cursor-not-allowed' 
                : 'bg-[#C5A059] text-[#040608] hover:brightness-110 shadow-[0_0_20px_rgba(197,160,89,0.15)] cursor-pointer'
            }`}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </div>

        {/* Extra notice */}
        <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-600 font-medium">
          <Shield className="w-3.5 h-3.5 text-slate-600" />
          <span>Same credentials as your desktop Noxis Hub app</span>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
        .font-mono { font-family: 'JetBrains+Mono', monospace; }
        body { background-color: #040608; }
      `}</style>
    </div>
  )
}
